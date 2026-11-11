import { ChevronDown, Database, Maximize2, Minimize2, SlidersHorizontal } from 'lucide-react';
import { useContext, useMemo, type ComponentProps, type PropsWithChildren, type ReactNode } from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { useTheme2, Tab } from '@grafana/ui';
import { StatCardPresentationContext } from '@grafana/ui/src/components/BigValue/StatCardPresentation';
import { Trans, t } from 'app/core/internationalization';

import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { WallManagementBack } from '../management/WallManagement';
import { wallStatCardPresentation } from '../statPresentation';
import { wallEditorFormVariables, wallSurfaceVariables } from '../surfaceTokens';
import {
  WallFontStatusContext,
  wallEditorTypographyVariables,
  wallTypographyVariables,
  useWallTypographyFonts,
} from '../typography';
import { Button } from '../ui';

import '../modern.css';
import '../typography.css';
import { editorPresentationContext, studioPreviewContext } from './EditorPresentationContext';
import { WallVisualizationIcon } from './WallVisualizationIcon';
import { wallOptionText } from './optionText';
import { useWallMonacoTheme } from './useWallMonacoTheme';
import './panelEditor.css';

export const WallPanelEditorContext = editorPresentationContext;

export function WallEditorVisualizationButton({
  pluginId,
  name,
  logo,
  onOpen,
}: {
  pluginId: string;
  name: string;
  logo: string;
  onOpen: () => void;
}) {
  return (
    <div className="wall-current-visualization">
      <div>
        <WallVisualizationIcon pluginId={pluginId} logo={logo} selected />
        <strong>{wallOptionText(name)}</strong>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={onOpen}
        data-testid={selectors.components.PanelEditor.toggleVizPicker}
        aria-label="시각화 변경"
      >
        <Trans i18nKey="wall.studio.change-visualization">시각화 변경</Trans>
        <ChevronDown size={14} aria-hidden="true" />
      </Button>
    </div>
  );
}

/** Presentation boundary only. Native Scenes still own every edit and save action. */
export function WallPanelEditorFrame({
  enabled,
  title,
  dirty,
  actions,
  children,
  visualizationName,
  dashboardTitle,
}: PropsWithChildren<{
  visualizationName?: string;
  dashboardTitle?: string;
  enabled: boolean;
  title: string;
  dirty?: boolean;
  actions?: ReactNode;
}>) {
  const theme = useTheme2();
  const fontStatus = useWallTypographyFonts(enabled);
  useWallMonacoTheme(enabled);
  if (!enabled) {
    return <>{children}</>;
  }
  return (
    <WallPanelEditorContext.Provider value={true}>
      <section
        className="wall-modern wall-panel-editor"
        data-wall-theme={theme.isDark ? 'dark' : 'light'}
        data-wall-typography="storage-vm"
        data-wall-font-status={fontStatus}
        style={{
          ...wallTypographyVariables,
          ...wallEditorTypographyVariables,
          ...wallEditorFormVariables,
          ...wallSurfaceVariables(theme.isDark, true),
        }}
      >
        <header className="wall-editor-heading">
          <div className="wall-editor-identity">
            <WallManagementBack dashboardTitle={dashboardTitle} />
            <div className="wall-editor-title">
              <h1 title={title}>{title.trim() ? title : t('wall.editor.untitled', '제목 없는 패널')}</h1>
              <small className="wall-editor-metadata" title={visualizationName}>
                <Trans i18nKey="wall.editor.edit-panel">패널 편집</Trans>
                {visualizationName && (
                  <>
                    <Trans i18nKey="wall.wall-panel-editor.text-1fdf0d90"> · </Trans>
                    {visualizationName}
                  </>
                )}
              </small>
            </div>
          </div>
          {actions ?? (
            <span className="wall-editor-status" data-dirty={dirty || undefined} role="status">
              {dirty ? t('wall.editor.dirty', '저장 전 변경 사항') : t('wall.editor.preview', '미리보기')}
            </span>
          )}
        </header>
        <WallFontStatusContext.Provider value={fontStatus}>
          <div className="wall-editor-workspace">{children}</div>
        </WallFontStatusContext.Provider>
      </section>
    </WallPanelEditorContext.Provider>
  );
}

export function WallEditorPreview({
  children,
  tableView,
  onToggleTableView,
  hasData,
}: PropsWithChildren<{ tableView: boolean; hasData: boolean; onToggleTableView: () => void }>) {
  const enabled = useContext(WallPanelEditorContext);
  const theme = useTheme2();
  const fontStatus = useContext(WallFontStatusContext);
  const stat = useMemo(
    () => ({ ...wallStatCardPresentation(theme), fontLoadRevision: fontStatus }),
    [theme, fontStatus]
  );
  const studio = useContext(studioPreviewContext);
  if (!enabled) {
    return <>{children}</>;
  }
  return (
    <Card className="wall-editor-preview">
      <header className="wall-editor-region-heading">
        <span>
          <Trans i18nKey="wall.editor.visualization-preview">시각화 미리보기</Trans>
        </span>
        {studio?.controls && <div className="wall-studio-controls">{studio.controls}</div>}
        <div className="wall-preview-actions">
          {hasData && (
            <Button
              size="sm"
              variant="ghost"
              aria-pressed={tableView}
              onClick={onToggleTableView}
              data-testid={selectors.components.PanelEditor.toggleTableView}
            >
              <Database size={14} aria-hidden="true" />
              <Trans i18nKey="wall.editor.table-view">테이블 보기</Trans>
            </Button>
          )}
          {studio && (
            <Button
              size="sm"
              variant="ghost"
              aria-label={
                studio.expanded
                  ? t('wall.studio.restore-preview', '미리보기 크기 복원')
                  : t('wall.studio.expand-preview', '전체 화면 미리보기')
              }
              aria-pressed={studio.expanded}
              onClick={studio.onToggleExpand}
            >
              {studio.expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </Button>
          )}
        </div>
      </header>
      <div className="wall-editor-preview-content">
        <StatCardPresentationContext.Provider value={stat}>{children}</StatCardPresentationContext.Provider>
      </div>
      {studio && <footer className="wall-studio-caption">{studio.resultStatus}</footer>}
    </Card>
  );
}

export function WallEditorOptions({ children }: PropsWithChildren) {
  const enabled = useContext(WallPanelEditorContext);
  if (!enabled) {
    return <>{children}</>;
  }
  return (
    <Card className="wall-editor-options">
      <header className="wall-editor-region-heading">
        <SlidersHorizontal size={15} aria-hidden="true" />
        <span>
          <Trans i18nKey="wall.editor.display-options">표시 설정</Trans>
        </span>
      </header>
      <div className="wall-editor-options-content">{children}</div>
    </Card>
  );
}

/** Existing query/transform/rule headers keep their live counters and permissions. */
export function WallEditorDataTab({ value, ...props }: ComponentProps<typeof Tab> & { value: string }) {
  const enabled = useContext(WallPanelEditorContext);
  if (!enabled) {
    return <Tab {...props} />;
  }
  return (
    <TabsTrigger value={value} data-testid={selectors.components.Tab.title(props.label)}>
      {props.label === 'Queries'
        ? t('wall.editor.queries', '쿼리')
        : props.label === 'Transformations'
          ? t('wall.editor.transforms', '변환')
          : props.label}
      {typeof props.counter === 'number' && <span className="wall-editor-tab-count">{props.counter}</span>}
    </TabsTrigger>
  );
}

export function WallEditorDataTabs({
  value,
  onValueChange,
  tabs,
  children,
}: PropsWithChildren<{ value: string; onValueChange: (value: string) => void; tabs: ReactNode }>) {
  return (
    <Tabs
      className="wall-editor-data"
      value={value}
      onValueChange={(value) => {
        if (typeof value === 'string') {
          onValueChange(value);
        }
      }}
    >
      <TabsList variant="line" aria-label={t('wall.editor.data-tabs', '패널 데이터 편집')}>
        {tabs}
      </TabsList>
      <TabsContent value={value} className="wall-editor-data-content">
        {children}
      </TabsContent>
    </Tabs>
  );
}
