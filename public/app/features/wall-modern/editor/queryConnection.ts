/** Read only known code fields. Never stringify plugin options or connection settings. */
export interface ConnectionQuery {
  refId: string;
  hide?: boolean;
  expr?: unknown;
  rawSql?: unknown;
  expression?: unknown;
}

export function queryConnection(queries: readonly ConnectionQuery[]) {
  const query = queries.find((query) => !query.hide) ?? queries[0];
  const code =
    query &&
    [query.expr, query.rawSql, query.expression].find(
      (value): value is string => typeof value === 'string' && Boolean(value.trim())
    );
  // A preview is optional: keep sensitive literals and connection URLs in the native editor.
  const protectedCode = Boolean(
    code &&
      /(?:password|passwd|secret|token|authorization|credential|api[_-]?key|access[_-]?key|identified\s+by)\b|[a-z][a-z\d+.-]*:\/\//i.test(
        code
      )
  );
  const compact = !protectedCode && code ? code.replace(/\s+/g, ' ').trim() : undefined;
  return {
    query,
    count: queries.length,
    hidden: queries.filter((query) => query.hide).length,
    protectedCode,
    preview: compact ? compact.slice(0, 180) + (compact.length > 180 ? '…' : '') : undefined,
  };
}

export type EditorSurface = 'visual' | 'data' | 'panel';
export function readEditorSurface(key?: string): EditorSurface {
  try {
    const value = key && localStorage.getItem(key);
    return value === 'data' || value === 'panel' ? value : 'visual';
  } catch {
    return 'visual';
  }
}
export function rememberEditorSurface(key: string | undefined, value: EditorSurface) {
  if (key) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Storage can be disabled; editing still works. */
    }
  }
}
