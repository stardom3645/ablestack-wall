import { safeQueryError } from './safeQueryError';
it('preserves actual error text while masking common credential forms', () => {
  expect(safeQueryError('Error1045 refA')).toBe('Error1045 refA');
  const result = safeQueryError('password="hidden value" token=abc https://user:pass@host Authorization: Bearer xyz');
  for (const value of ['hidden value', 'abc', 'user:pass', 'xyz']) {
    expect(result).not.toContain(value);
  }
});

it('masks quoted credential keys in error text', () => {
  expect(safeQueryError('{"password":"hidden"}')).not.toContain('hidden');
});
