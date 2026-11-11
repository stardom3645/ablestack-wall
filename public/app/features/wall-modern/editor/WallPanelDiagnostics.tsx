import type { ReactNode } from 'react';

import { DataQuery, DataSourceRef, LoadingState, PanelData } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { ClipboardButton } from '@grafana/ui';
import { PanelScrollArea } from '@grafana/ui/src/components/PanelScrollArea/PanelScrollArea';
import { Trans } from 'app/core/internationalization';

import { Collapsible } from '../components/ui/collapsible';
import { safeQueryError } from '../panels/safeQueryError';
import { Button } from '../ui';

import { inspectorErrors, inspectorSources } from './inspectorModel';

export function inspectorSourceName(ref?: DataSourceRef | null) {
  if (!ref) {
    return undefined;
  }
  try {
    return getDataSourceSrv().getInstanceSettings(ref)?.name ?? ref.uid;
  } catch {
    return ref.uid;
  }
}

export function WallPanelDiagnostics({
  data,
  datasource,
  queries: configuredQueries = [],
  stats,
  statsOpen = false,
}: {
  data?: PanelData;
  queries?: DataQuery[];
  datasource?: DataSourceRef | null;
  stats?: ReactNode;
  statsOpen?: boolean;
}) {
  const errors = inspectorErrors(data);
  const queries = data?.request
    ? inspectorSources(data, datasource)
    : configuredQueries.map((target) => ({ refId: target.refId, datasource: target.datasource ?? datasource }));
  const loading = data?.state === LoadingState.Loading || data?.state === LoadingState.Streaming;
  const hasError = errors.length > 0 || data?.state === LoadingState.Error;
  return (
    <PanelScrollArea className="wall-inspect-diagnostics" aria-label="패널 진단 내용">
      <header className="wall-inspect-section-heading">
        <div>
          <h2>
            {hasError
              ? '데이터 조회 오류'
              : loading
                ? '쿼리 실행 중'
                : data?.series.some((frame) => frame.length > 0)
                  ? '데이터 조회 결과'
                  : '표시할 데이터 없음'}
          </h2>
          <p>
            {hasError ? '제공된 오류와 요청 정보를 확인하세요.' : '현재 패널의 조회 상태와 실행 정보를 확인합니다.'}
          </p>
        </div>
      </header>
      {errors.map((error, index) => {
        const target = queries.find((query) => query.refId === error.refId);
        const source = inspectorSourceName(target?.datasource ?? datasource);
        const message = safeQueryError(error.message || error.statusText || '');
        return (
          <section className="wall-inspect-error" key={index} aria-label="쿼리 오류">
            <div className="wall-inspect-section-heading">
              <strong>{error.refId ? `쿼리 ${error.refId}` : '쿼리 오류'}</strong>
              {message && (
                <ClipboardButton getText={() => message} variant="secondary" size="sm" icon="copy">
                  <Trans i18nKey="wall.wall-panel-diagnostics.text-7f698ef2">오류 복사</Trans>
                </ClipboardButton>
              )}
            </div>
            <p className="wall-inspect-message">{message || '상세 오류 메시지가 제공되지 않았습니다.'}</p>
            <dl className="wall-inspect-facts">
              {source && (
                <>
                  <dt>
                    <Trans i18nKey="wall.wall-panel-diagnostics.text-d98ae4b6">데이터 소스</Trans>
                  </dt>
                  <dd>{source}</dd>
                </>
              )}
              {error.refId && (
                <>
                  <dt>
                    <Trans i18nKey="wall.wall-panel-diagnostics.text-c47118ac">Query Ref ID</Trans>
                  </dt>
                  <dd>{error.refId}</dd>
                </>
              )}
              {error.status !== undefined && (
                <>
                  <dt>
                    <Trans i18nKey="wall.wall-panel-diagnostics.text-9a3aa3c8">제공된 상태</Trans>
                  </dt>
                  <dd>{error.status}</dd>
                </>
              )}
            </dl>
          </section>
        );
      })}
      {!errors.length && hasError && (
        <p className="wall-inspect-message">
          <Trans i18nKey="wall.wall-panel-diagnostics.text-4940a435">
            오류 상태입니다. 상세 오류 메시지는 제공되지 않았습니다.
          </Trans>
        </p>
      )}
      <section className="wall-inspect-query-list" aria-label="쿼리 및 데이터 소스">
        <h3>{data?.request ? '요청의 쿼리 및 데이터 소스' : '설정된 쿼리 및 데이터 소스'}</h3>
        {queries.length ? (
          queries.map((query, index) => (
            <div className="wall-inspect-query-row" key={index}>
              <strong>{query.refId || 'Ref ID 없음'}</strong>
              <span>{inspectorSourceName(query.datasource) || '데이터 소스 정보 없음'}</span>
              {query.datasource?.uid && query.datasource.uid !== inspectorSourceName(query.datasource) && (
                <code>{query.datasource.uid}</code>
              )}
            </div>
          ))
        ) : (
          <p className="wall-inspect-muted">
            <Trans i18nKey="wall.wall-panel-diagnostics.text-aa29d376">아직 수집된 요청 정보가 없습니다.</Trans>
            {inspectorSourceName(datasource) && ` 데이터 소스: ${inspectorSourceName(datasource)}`}
          </p>
        )}
      </section>
      {stats && (
        <Collapsible.Root className="wall-inspect-detail" defaultOpen={statsOpen}>
          <Collapsible.Trigger render={<Button variant="ghost" />} className="wall-inspect-detail-trigger">
            <Trans i18nKey="wall.wall-panel-diagnostics.text-8992d772">실행 통계</Trans>
            <span aria-hidden="true">
              <Trans i18nKey="wall.wall-panel-diagnostics.text-00d74e13">⌄</Trans>
            </span>
          </Collapsible.Trigger>
          <Collapsible.Panel>
            <div className="wall-inspect-stats">{stats}</div>
          </Collapsible.Panel>
        </Collapsible.Root>
      )}
    </PanelScrollArea>
  );
}
