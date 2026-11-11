import { queryConnection, readEditorSurface, rememberEditorSurface } from './queryConnection';

it('summarizes actual enabled code queries without changing their order or model', () => {
  const queries = [
    { refId: 'A', hide: true, expr: 'disabled' },
    { refId: 'B', expr: 'rate(cpu[5m])' },
    { refId: 'C', rawSql: 'SELECT value\nFROM metric' },
  ];
  const original = JSON.stringify(queries);
  expect(queryConnection(queries)).toMatchObject({ count: 3, hidden: 1, query: queries[1], preview: 'rate(cpu[5m])' });
  expect(queryConnection([queries[2]]).preview).toBe('SELECT value FROM metric');
  expect(JSON.stringify(queries)).toBe(original);
});

it.each([
  [{ refId: 'A', expr: '{job="logs"} |= "error"' }, '{job="logs"} |= "error"'],
  [{ refId: 'B', expression: '$A / $B' }, '$A / $B'],
  [{ refId: 'C', expr: 'x'.repeat(300) }, 'x'.repeat(180) + '…'],
])('uses real Loki/expression/long code text and no fabricated query meaning', (query, preview) => {
  expect(queryConnection([query]).preview).toBe(preview);
});

it.each([
  'SELECT password FROM users',
  'metric{token="private"}',
  'SELECT "https://user:password@host"',
  'api_key = "private"',
])('withholds sensitive previews: %s', (expr) => {
  expect(queryConnection([{ refId: 'A', expr }])).toMatchObject({ protectedCode: true, preview: undefined });
});

it('handles empty/all-disabled/unsupported plugin queries without serializing their options', () => {
  expect(queryConnection([])).toMatchObject({ count: 0, query: undefined });
  const hidden = { refId: 'B', hide: true, rawSql: 'SELECT 1' };
  expect(queryConnection([hidden])).toMatchObject({ query: hidden, hidden: 1, preview: 'SELECT 1' });
  expect(queryConnection([{ refId: 'X', options: { secret: 'do not expose' } } as never]).preview).toBeUndefined();
});

it('isolates tab preferences by the caller user key and ignores invalid values', () => {
  const key = 'test:wall-editor:org1:user1';
  try {
    localStorage.setItem(key, 'invalid');
    expect(readEditorSurface(key)).toBe('visual');
    rememberEditorSurface(key, 'data');
    expect(readEditorSurface(key)).toBe('data');
    expect(readEditorSurface(key + ':other')).toBe('visual');
    expect(readEditorSurface()).toBe('visual');
  } finally {
    localStorage.removeItem(key);
  }
});
