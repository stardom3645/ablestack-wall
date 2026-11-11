import { inspectJsonSyntax } from './jsonWorkspace';

it('uses strict native JSON parsing without treating a valid scalar or array as a panel model', () => {
  expect(inspectJsonSyntax('{"fieldConfig":{"overrides":[{"matcher":{"id":"byName"}}]}}').error).toBeUndefined();
  expect(inspectJsonSyntax('[0, null, "x"]').value).toEqual([0, null, 'x']);
  expect(inspectJsonSyntax('42').value).toBe(42);
  expect(inspectJsonSyntax('{"x":1,}').error).toBeTruthy();
  expect(inspectJsonSyntax('{/*comment*/"x":1}').error).toBeTruthy();
});

it('reports a native parser offset or EOF as a real UTF-16 line and column', () => {
  const result = inspectJsonSyntax('{\n  "x":');
  expect(result.error).toBeTruthy();
  expect(result.line).toBe(2);
  expect(result.column).toBe(7);
  const next = inspectJsonSyntax('{\n  "x":1\n}');
  expect(next.error).toBeUndefined();
});

it('keeps EOF locations correct for CR and CRLF documents', () => {
  expect(inspectJsonSyntax('{\r  "x":')).toMatchObject({ line: 2, column: 7 });
  expect(inspectJsonSyntax('{\r\n  "x":')).toMatchObject({ line: 2, column: 7 });
});
