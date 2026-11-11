import { getDefaultTimeRange, LoadingState, PanelData } from '@grafana/data';

import { inspectorErrors, inspectorExchange, inspectorSources, isInspectorRequest } from './inspectorModel';

it('combines actual errors without inferring a query ID or a failure cause', () => {
  const error = { message: 'Datasource missing was not found' };
  const data = {
    state: LoadingState.Error,
    timeRange: getDefaultTimeRange(),
    series: [],
    error,
    errors: [error],
  } as PanelData;
  expect(inspectorErrors(data)).toEqual([error]);
  expect(inspectorErrors({ ...data, errors: [{ ...error }, { ...error, refId: 'B' }] })).toHaveLength(2);
  expect(inspectorErrors(data)[0].refId).toBeUndefined();
  expect(inspectorSources(data, { uid: 'missing' })).toEqual([]);
});

it('only follows the active native request and its native mixed-datasource subrequests', () => {
  expect(isInspectorRequest('SQR12', 'SQR12')).toBe(true);
  expect(isInspectorRequest('mixed-2-SQR12', 'SQR12')).toBe(true);
  expect(isInspectorRequest('SQR123', 'SQR12')).toBe(false);
  expect(isInspectorRequest(undefined, 'SQR12')).toBe(false);
});

it('preserves actual transport facts while masking secrets and omitting an absent trace ID, without mutating the response', () => {
  const response = {
    status: 400,
    traceId: undefined,
    config: {
      url: 'http://user:pass@host/query?token=abc',
      method: 'POST',
      headers: { authorization: 'Bearer abc' },
      data: { queries: [{ refId: 'B', datasource: { uid: 'ds' }, password: 'secret' }] },
    },
    data: { error: 'password=abc failed', token: 'secret' },
  };
  const before = JSON.stringify(response);
  const exchange = inspectorExchange(response, 'SQR1');
  expect(exchange.status).toBe(400);
  expect(exchange.traceId).toBeUndefined();
  expect(exchange.request?.headers).toBeUndefined();
  expect((exchange.request?.data as { queries: unknown[] } | undefined)?.queries[0]).toMatchObject({
    refId: 'B',
    datasource: { uid: 'ds' },
    password: '[REDACTED]',
  });
  expect(JSON.stringify(exchange)).not.toContain('user:pass');
  expect(exchange.response).toEqual({ error: 'password=[REDACTED] failed', token: '[REDACTED]' });
  expect(JSON.stringify(response)).toBe(before);
  expect(inspectorExchange({ traceId: 'undefined' }).traceId).toBeUndefined();
});
