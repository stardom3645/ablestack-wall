import type { DataQueryError, DataSourceRef, PanelData } from '@grafana/data';

import { safeQueryError } from '../panels/safeQueryError';

/** Display-only projection. Never infer a cause, status or Ref ID from a message. */
export function inspectorErrors(data?: PanelData): DataQueryError[] {
  const errors = [...(data?.errors ?? [])];
  if (data?.error && !errors.includes(data.error)) {
    errors.unshift(data.error);
  }
  const seen = new Set<string>();
  return errors.filter((error) => {
    const key = JSON.stringify([error.refId, error.message, error.status, error.statusText]);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function inspectorSources(data: PanelData | undefined, fallback?: DataSourceRef | null) {
  const queries = data?.request?.targets ?? [];
  return queries.map((target) => ({ refId: target.refId, datasource: target.datasource ?? fallback }));
}

export function isInspectorRequest(requestId: string | undefined, current: string | undefined) {
  return Boolean(
    current && requestId && (requestId === current || requestId.match(/^mixed-\d+-(.*)$/)?.[1] === current)
  );
}

/** Raw inspector output retains the native omission of headers/config internals, plus masks secrets. */
export function safeInspectorValue(value: unknown, key = ''): unknown {
  if (
    /^(authorization|proxy-authorization|cookie|set-cookie|password|passwd|secret|token|access_token|refresh_token|api[_-]?key|secureJsonData|basicAuthPassword|clientSecret)$/i.test(
      key
    )
  ) {
    return '[REDACTED]';
  }
  if (typeof value === 'string') {
    return safeQueryError(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => safeInspectorValue(item));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, safeInspectorValue(v, k)])
    );
  }
  return value;
}

export interface InspectorExchange {
  requestId?: string;
  status?: number;
  statusText?: string;
  traceId?: string;
  request?: { url?: string; method?: string; data?: unknown; [key: string]: unknown };
  response?: unknown;
}

export function inspectorRecord(value: unknown): Record<string, unknown> | undefined {
  return isInspectorRecord(value) ? value : undefined;
}

function isInspectorRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function inspectorExchange(value: unknown, requestId?: string): InspectorExchange {
  const response = inspectorRecord(value) ?? {};
  const request = inspectorRecord(response.config ?? response.request);
  const cleanRequest = request
    ? Object.fromEntries(
        Object.entries(request).filter(
          ([key]) =>
            ![
              'headers',
              'transformRequest',
              'transformResponse',
              'paramSerializer',
              'jsonpCallbackParam',
              'requestId',
              'inspect',
              'retry',
              'timeout',
            ].includes(key)
        )
      )
    : undefined;
  const safeRequest = inspectorRecord(safeInspectorValue(cleanRequest));
  const traceId = response.traceId;
  return {
    requestId,
    status: typeof response.status === 'number' ? response.status : undefined,
    statusText: typeof response.statusText === 'string' ? response.statusText : undefined,
    traceId:
      typeof traceId === 'string' && traceId.trim() && traceId !== 'undefined' ? safeQueryError(traceId) : undefined,
    request: safeRequest
      ? {
          ...safeRequest,
          url: typeof safeRequest.url === 'string' ? safeRequest.url : undefined,
          method: typeof safeRequest.method === 'string' ? safeRequest.method : undefined,
        }
      : undefined,
    response: safeInspectorValue(response.data ?? response.response),
  };
}
