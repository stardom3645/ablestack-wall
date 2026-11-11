import { getDataSourceSrv } from '@grafana/runtime';
import { Trans } from 'app/core/internationalization';
import type { PanelDataPane } from 'app/features/dashboard-scene/panel-edit/PanelDataPane/PanelDataPane';
import { PanelDataQueriesTab } from 'app/features/dashboard-scene/panel-edit/PanelDataPane/PanelDataQueriesTab';

import { Button } from '../ui';

import { queryConnection } from './queryConnection';

export function WallQueryConnection({ pane, onEdit }: { pane?: PanelDataPane; onEdit: (refId?: string) => void }) {
  return pane ? <PaneConnection pane={pane} onEdit={onEdit} /> : <EmptyConnection />;
}

function EmptyConnection() {
  return (
    <section className="wall-query-connection" aria-label="데이터 연결">
      <span className="wall-query-connection-label">
        <Trans i18nKey="wall.wall-query-connection.text-0c6de345">데이터</Trans>
      </span>
      <span className="wall-query-connection-count">
        <Trans i18nKey="wall.wall-query-connection.text-e5182952">연결된 쿼리가 없습니다.</Trans>
      </span>
    </section>
  );
}

function PaneConnection({ pane, onEdit }: { pane: PanelDataPane; onEdit: (refId?: string) => void }) {
  const { tabs } = pane.useState();
  const queries = tabs.find((tab): tab is PanelDataQueriesTab => tab instanceof PanelDataQueriesTab);
  return queries ? <Connection model={queries} onEdit={onEdit} /> : <EmptyConnection />;
}

function Connection({ model, onEdit }: { model: PanelDataQueriesTab; onEdit: (refId?: string) => void }) {
  const { dsSettings } = model.useState();
  const { queries } = model.queryRunner.useState();
  const summary = queryConnection(queries);
  const representative = queries.find((query) => query.refId === summary.query?.refId);
  let querySource: string | undefined;
  try {
    if (representative?.datasource) {
      querySource = getDataSourceSrv().getInstanceSettings(representative.datasource)?.name;
    }
  } catch {
    /* Unsupported plugin references remain in the native query editor. */
  }
  const source = [dsSettings?.name, querySource !== dsSettings?.name ? querySource : undefined]
    .filter(Boolean)
    .join(' / ');
  return (
    <section className="wall-query-connection" aria-label="데이터 연결">
      <span className="wall-query-connection-label">
        <Trans i18nKey="wall.wall-query-connection.text-0c6de345">데이터</Trans>
      </span>
      <span className="wall-query-connection-source" title={source}>
        {source || '데이터 연결 확인 중'}
      </span>
      <span className="wall-query-connection-count">
        <Trans i18nKey="wall.wall-query-connection.text-5dd76b76">쿼리 </Trans>
        {summary.count}
        <Trans i18nKey="wall.wall-query-connection.text-11600c9a">개</Trans>
        {summary.hidden ? ` · 조회 제외 ${summary.hidden}개` : ''}
      </span>
      <div className="wall-query-connection-code">
        {summary.query && (
          <span>
            {summary.query.refId}
            {summary.query.hide ? ' (조회 제외)' : ''}
          </span>
        )}
        <code title={summary.preview}>
          {summary.preview ??
            (summary.protectedCode
              ? '민감 정보 보호를 위해 편집기에서 확인하세요.'
              : summary.count
                ? '쿼리 편집기에서 확인하세요.'
                : '등록된 쿼리가 없습니다.')}
        </code>
      </div>
      <Button size="sm" variant="ghost" onClick={() => onEdit(summary.query?.refId)}>
        <Trans i18nKey="wall.wall-query-connection.text-73e294d6">쿼리 편집</Trans>
      </Button>
    </section>
  );
}
