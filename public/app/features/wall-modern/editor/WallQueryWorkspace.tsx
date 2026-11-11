import { Plus, MoreHorizontal, Maximize2, Minimize2, ScanSearch, CircleHelp } from 'lucide-react';
import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { config } from '@grafana/runtime';
import { useSceneObjectState } from '@grafana/scenes';
import { Spinner, useTheme2 } from '@grafana/ui';
import { t } from 'app/core/internationalization';
import type { PanelDataPane } from 'app/features/dashboard-scene/panel-edit/PanelDataPane/PanelDataPane';
import { PanelDataQueriesTab } from 'app/features/dashboard-scene/panel-edit/PanelDataPane/PanelDataQueriesTab';
import { PanelDataTransformationsTab } from 'app/features/dashboard-scene/panel-edit/PanelDataPane/PanelDataTransformationsTab';
import { QueryEditorRows } from 'app/features/query/components/QueryEditorRows';
import { QueryGroupTopSection } from 'app/features/query/components/QueryGroup';
import { isSharedDashboardQuery } from 'app/plugins/datasource/dashboard';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../components/ui/dropdown-menu';
import { wallSurfaceVariables, wallEditorFormVariables } from '../surfaceTokens';
import { WallTypographyContext, wallTypographyVariables, wallEditorTypographyVariables } from '../typography';
import { Button } from '../ui';

import { queryAdvancedSlotContext, queryWorkspaceViewContext } from './EditorPresentationContext';
import { WorkspaceSection } from './WallQueryParts';

export function WallQueryWorkspace({ pane }: { pane: PanelDataPane }) {
  const { tabs, tab } = pane.useState();
  const queries = tabs.find((item): item is PanelDataQueriesTab => item instanceof PanelDataQueriesTab);
  const transforms = tabs.find(
    (item): item is PanelDataTransformationsTab => item instanceof PanelDataTransformationsTab
  );
  const otherTabs = tabs.filter((item) => item !== queries && item !== transforms);
  if (!queries) {
    return null;
  }
  return (
    <section className="wall-query-workspace" aria-label={t('wall.work.title', '쿼리 작업공간')}>
      <div className="wall-query-workspace-scroll">
        <QueryTasks
          model={queries}
          transforms={transforms && <transforms.Component model={transforms} />}
          extra={otherTabs.map((item) => (
            <WorkspaceSection
              title={item.getTabLabel()}
              key={item.tabId}
              open={tab === item.tabId}
              onOpenChange={(open) => pane.onChangeTab(open ? item : queries)}
            >
              <item.Component model={item} />
            </WorkspaceSection>
          ))}
        />
      </div>
    </section>
  );
}

function QueryTasks({
  model,
  transforms,
  extra,
}: {
  model: PanelDataQueriesTab;
  transforms?: ReactNode;
  extra: ReactNode;
}) {
  const { datasource, dsSettings } = useSceneObjectState(model, { shouldActivateOrKeepAlive: true });
  const { data, queries } = model.queryRunner.useState();
  const [preferred, setPreferred] = useState<string>();
  const [advancedHost, setAdvancedHost] = useState<HTMLDivElement | null>(null);
  const view = useContext(queryWorkspaceViewContext);
  const handledRequest = useRef<{ refId: string }>();
  useEffect(() => {
    if (
      view?.request &&
      view.request !== handledRequest.current &&
      queries.some((query) => query.refId === view.request?.refId)
    ) {
      handledRequest.current = view.request;
      setPreferred(view.request.refId);
    }
  }, [view?.request, queries]);
  const previousIds = useState(() => new Set(queries.map((query) => query.refId)))[0];
  // Native add/duplicate chooses the new query; remove/rename resolves to an existing ID.
  useEffect(() => {
    const added = queries.filter((query) => !previousIds.has(query.refId));
    if (added.length) {
      setPreferred(added[added.length - 1].refId);
    }
    previousIds.clear();
    queries.forEach((query) => previousIds.add(query.refId));
  }, [queries, previousIds]);
  const selected = queries.find((query) => query.refId === preferred)?.refId ?? queries[0]?.refId;
  const group = {
    data: data!,
    dataSource: datasource!,
    dsSettings: dsSettings!,
    options: model.buildQueryOptions(),
    onDataSourceChange: model.onChangeDataSource,
    onOptionsChange: model.onQueryOptionsChange,
    onOpenQueryInspector: model.onOpenInspector,
  };
  if (!datasource || !dsSettings || !data) {
    return (
      <div className="wall-work-loading">
        <Spinner />
      </div>
    );
  }
  return (
    <>
      <div className="wall-work-source-row">
        <label htmlFor="data-source-picker">{t('wall.editor.datasource', '데이터 소스')}</label>
        <QueryGroupTopSection {...group} section="source" />
        {view && (
          <Button
            size="icon"
            variant="ghost"
            onClick={view.onToggleExpand}
            aria-label={
              view.expanded
                ? t('wall.work.restore-workspace', '쿼리 작업공간 복원')
                : t('wall.work.expand-workspace', '쿼리 작업공간 확대')
            }
            aria-pressed={view.expanded}
          >
            {view.expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </Button>
        )}
        <QueryGroupTopSection
          {...group}
          section="actions"
          renderActions={(actions) => (
            <QueryMoreMenu
              inspect={actions.inspect}
              help={actions.help}
              addExpression={
                config.expressionsEnabled && model.isExpressionsSupported(dsSettings)
                  ? model.onAddExpressionClick
                  : undefined
              }
            />
          )}
        />
      </div>
      {!queries.length && <p className="wall-work-no-query">{t('wall.work.no-queries', '등록된 쿼리가 없습니다.')}</p>}
      <QueryEditorRows
        workspace
        navigationActions={
          !isSharedDashboardQuery(dsSettings.name) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={model.addQueryClick}
              aria-label={t('wall.work.add', '쿼리 추가')}
            >
              <Plus size={15} />
            </Button>
          )
        }
        activeQuery={selected}
        onActiveQueryChange={setPreferred}
        data={data}
        queries={queries}
        dsSettings={dsSettings}
        onAddQuery={model.onAddQuery}
        onQueriesChange={model.onQueriesChange}
        onRunQueries={model.onRunQueries}
        queryRowWrapper={(children, refId) => (
          <queryAdvancedSlotContext.Provider key={refId} value={{ host: advancedHost, active: refId === selected }}>
            <div hidden={refId !== selected} className="wall-work-query-editor">
              {children}
            </div>
          </queryAdvancedSlotContext.Provider>
        )}
      />
      <WorkspaceSection title={t('wall.work.query-options', '쿼리 옵션')} className="wall-query-advanced">
        <div ref={setAdvancedHost} className="wall-query-advanced-slot" />
        <h3 className="wall-query-advanced-label">{t('wall.work.execution-options', '조회 실행 범위')}</h3>
        <QueryGroupTopSection {...group} section="options" />
        {model.renderExtraActions()}
        {extra}
      </WorkspaceSection>
      {transforms}
    </>
  );
}

function QueryMoreMenu({
  inspect,
  help,
  addExpression,
}: {
  inspect?: () => void;
  help: () => void;
  addExpression?: () => void;
}) {
  const theme = useTheme2();
  return (
    <WallTypographyContext.Provider value>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" />}
          aria-label={t('wall.work.more', '추가 작업')}
        >
          <MoreHorizontal size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="wall-query-more-menu"
          style={{
            ...wallTypographyVariables,
            ...wallEditorTypographyVariables,
            ...wallEditorFormVariables,
            ...wallSurfaceVariables(theme.isDark),
          }}
        >
          {inspect && (
            <DropdownMenuItem onClick={inspect}>
              <ScanSearch size={15} />
              {t('wall.editor.query-inspector', '쿼리 검사')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={help}>
            <CircleHelp size={15} />
            {t('wall.editor.datasource-help', '데이터 소스 도움말')}
          </DropdownMenuItem>
          {addExpression && (
            <DropdownMenuItem onClick={addExpression}>
              <Plus size={15} />
              {t('wall.work.expression', '표현식 추가')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </WallTypographyContext.Provider>
  );
}
