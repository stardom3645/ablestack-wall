import { useState } from 'react';

import { JSONFormatter, ClipboardButton } from '@grafana/ui';
import { PanelScrollArea } from '@grafana/ui/src/components/PanelScrollArea/PanelScrollArea';
import { Trans } from 'app/core/internationalization';

import { Collapsible } from '../components/ui/collapsible';
import { Button } from '../ui';

import { InspectorExchange, inspectorRecord } from './inspectorModel';

export function WallQueryInspection({
  exchanges,
  loading,
  onRefresh,
  executed,
}: {
  exchanges: InspectorExchange[];
  loading: boolean;
  onRefresh: () => void;
  executed: Array<{ refId: string; query: string; frames: number; rows: number }>;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <PanelScrollArea className="wall-inspect-requests" aria-label="요청 및 응답 내용">
      <header className="wall-inspect-section-heading">
        <div>
          <h2>
            <Trans i18nKey="wall.wall-query-inspection.text-c161bb50">요청·응답</Trans>
          </h2>
          <p>
            <Trans i18nKey="wall.wall-query-inspection.text-f214a570">
              새로고침 이후 이 패널에서 수집된 요청과 응답입니다.
            </Trans>
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
          {loading ? '수집 중…' : '쿼리 새로고침'}
        </Button>
      </header>
      {!exchanges.length && (
        <p className="wall-inspect-empty">
          {loading
            ? '요청을 수집하고 있습니다.'
            : '수집된 요청이 없습니다. 쿼리를 새로고침하여 요청·응답을 확인하세요.'}
        </p>
      )}
      {exchanges.map((exchange, index) => (
        <section key={index} className="wall-inspect-exchange">
          <dl className="wall-inspect-facts">
            {exchange.request?.method && (
              <>
                <dt>
                  <Trans i18nKey="wall.wall-query-inspection.text-88306943">Method</Trans>
                </dt>
                <dd>{exchange.request.method}</dd>
              </>
            )}
            {exchange.request?.url && (
              <>
                <dt>
                  <Trans i18nKey="wall.wall-query-inspection.text-0e2d9b07">URL</Trans>
                </dt>
                <dd>
                  <code>{exchange.request.url}</code>
                </dd>
              </>
            )}
            {exchange.status !== undefined && (
              <>
                <dt>
                  <Trans i18nKey="wall.wall-query-inspection.text-b1525a51">HTTP 상태</Trans>
                </dt>
                <dd>
                  {exchange.status}
                  {exchange.statusText && ` · ${exchange.statusText}`}
                </dd>
              </>
            )}
            {exchange.traceId && (
              <>
                <dt>
                  <Trans i18nKey="wall.wall-query-inspection.text-976f74ba">Trace ID</Trans>
                </dt>
                <dd>
                  <code>{exchange.traceId}</code>
                </dd>
              </>
            )}
          </dl>
          {requestQueries(exchange).map((query, q) => (
            <div className="wall-inspect-query-row" key={q}>
              <strong>{query.refId || 'Ref ID 없음'}</strong>
              <span>{query.type || '쿼리'}</span>
              {query.uid && <code>{query.uid}</code>}
            </div>
          ))}
          {Object.entries(inspectorRecord(inspectorRecord(exchange.response)?.results) ?? {}).map(([refId, result]) =>
            typeof inspectorRecord(result)?.error === 'string' ? (
              <p className="wall-inspect-message" key={refId}>
                <strong>{refId}</strong>
                <Trans i18nKey="wall.wall-query-inspection.text-1fdf0d90"> · </Trans>
                {String(inspectorRecord(result)?.error)}
              </p>
            ) : null
          )}
          {(['request', 'response'] as const)
            .filter((key) => exchange[key] !== undefined)
            .map((key) => (
              <Collapsible.Root className="wall-inspect-detail" key={key}>
                <Collapsible.Trigger render={<Button variant="ghost" />} className="wall-inspect-detail-trigger">
                  {key === 'request' ? '요청 상세' : '응답 상세'}
                  <span aria-hidden="true">
                    <Trans i18nKey="wall.wall-query-inspection.text-00d74e13">⌄</Trans>
                  </span>
                </Collapsible.Trigger>
                <Collapsible.Panel>
                  <div className="wall-inspect-raw">
                    <ClipboardButton
                      getText={() => JSON.stringify(exchange[key], null, 2)}
                      variant="secondary"
                      size="sm"
                      icon="copy"
                    >
                      {key === 'request' ? '요청 복사' : '응답 복사'}
                    </ClipboardButton>
                    <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}>
                      {expanded ? '원시 정보 접기' : '원시 정보 전체 펼치기'}
                    </Button>
                    <JSONFormatter json={exchange[key] ?? {}} open={expanded ? 20 : 2} />
                  </div>
                </Collapsible.Panel>
              </Collapsible.Root>
            ))}
        </section>
      ))}
      {executed.length > 0 && (
        <Collapsible.Root className="wall-inspect-detail">
          <Collapsible.Trigger render={<Button variant="ghost" />} className="wall-inspect-detail-trigger">
            <Trans i18nKey="wall.wall-query-inspection.text-ccb5f3d5">실행된 쿼리</Trans>
            <span aria-hidden="true">
              <Trans i18nKey="wall.wall-query-inspection.text-00d74e13">⌄</Trans>
            </span>
          </Collapsible.Trigger>
          <Collapsible.Panel>
            {executed.map((info, index) => (
              <div key={index}>
                <strong>{info.refId}</strong>
                <Trans i18nKey="wall.wall-query-inspection.text-1fdf0d90"> · </Trans>
                {info.frames}
                <Trans i18nKey="wall.wall-query-inspection.text-66663292"> frames · </Trans>
                {info.rows}
                <Trans i18nKey="wall.wall-query-inspection.text-6c30d261"> rows</Trans>
                <pre className="wall-inspect-code">{info.query}</pre>
              </div>
            ))}
          </Collapsible.Panel>
        </Collapsible.Root>
      )}
    </PanelScrollArea>
  );
}

function requestQueries(exchange: InspectorExchange) {
  const queries = inspectorRecord(exchange.request?.data)?.queries;
  if (!Array.isArray(queries)) {
    return [];
  }
  return queries.map((value) => {
    const query = inspectorRecord(value),
      datasource = inspectorRecord(query?.datasource);
    return {
      refId: typeof query?.refId === 'string' ? query.refId : undefined,
      type: typeof datasource?.type === 'string' ? datasource.type : undefined,
      uid: typeof datasource?.uid === 'string' ? datasource.uid : undefined,
    };
  });
}
