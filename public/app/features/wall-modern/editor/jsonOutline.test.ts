import { nativeJsonSymbols, nestJsonSymbols, jsonSymbolPathAt } from './jsonOutline';

const create = jest.fn();
const has = jest.fn();
const unsubscribe = jest.fn();
let registered: () => void;
jest.mock('monaco-editor/esm/vs/editor/contrib/documentSymbols/browser/outlineModel.js', () => ({
  OutlineModel: { create: (...args: unknown[]) => create(...args) },
}));
jest.mock('monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js', () => ({
  StandaloneServices: {
    get: () => ({
      documentSymbolProvider: {
        has: (...args: unknown[]) => has(...args),
        onDidChange: (cb: () => void) => {
          registered = cb;
          return { dispose: unsubscribe };
        },
      },
    }),
  },
}));
jest.mock('monaco-editor/esm/vs/editor/common/services/languageFeatures.js', () => ({ ILanguageFeaturesService: {} }));

const model = { isDisposed: () => false };
const editor = { getModel: () => model } as unknown as Parameters<typeof nativeJsonSymbols>[0];
const token = () => ({
  isCancellationRequested: false,
  onCancellationRequested: jest.fn(() => ({ dispose: jest.fn() })),
});
beforeEach(() => {
  jest.clearAllMocks();
  has.mockReturnValue(true);
});

it('reuses native document symbols and exact source ranges for nested/array keys', async () => {
  const symbol = {
    name: 'targets',
    range: { startLineNumber: 3, startColumn: 2, endLineNumber: 9, endColumn: 4 },
    selectionRange: { startLineNumber: 3, startColumn: 2, endLineNumber: 3, endColumn: 11 },
    children: [],
  };
  create.mockResolvedValue({ getTopLevelSymbols: () => [symbol] });
  expect(await nativeJsonSymbols(editor, token())).toEqual([symbol]);
  expect(create.mock.calls[0][1]).toBe(model);
});

it('waits for the existing lazy JSON language provider and cleans up its subscription', async () => {
  has.mockReturnValue(false);
  create.mockResolvedValue({ getTopLevelSymbols: () => [] });
  const result = nativeJsonSymbols(editor, token());
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(create).not.toHaveBeenCalled();
  has.mockReturnValue(true);
  registered();
  await result;
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  expect(create).toHaveBeenCalledTimes(1);
});

it('does not start outline work on a disposed/cancelled editor', async () => {
  expect(await nativeJsonSymbols(editor, { ...token(), isCancellationRequested: true })).toEqual([]);
  expect(create).not.toHaveBeenCalled();
});

it('nests flat native ranges without splitting dotted keys or confusing repeated array properties', () => {
  const symbol = (name: string, start: number, end: number) => ({
    name,
    range: { startLineNumber: start, startColumn: 1, endLineNumber: end, endColumn: 10 },
    selectionRange: { startLineNumber: start, startColumn: 1, endLineNumber: start, endColumn: 5 },
  });
  const list = [
    symbol('targets', 1, 20),
    symbol('source', 2, 5),
    symbol('a.b', 3, 3),
    symbol('source', 9, 12),
    symbol('a.b', 10, 10),
    symbol('outside', 22, 22),
  ];
  const result = nestJsonSymbols(list);
  expect(result.map((s) => s.name)).toEqual(['targets', 'outside']);
  expect(result[0].children?.map((s) => s.range.startLineNumber)).toEqual([2, 9]);
  expect(result[0].children?.map((s) => s.children?.[0].name)).toEqual(['a.b', 'a.b']);
  expect(list[0]).not.toHaveProperty('children');
});

it('follows exact native cursor ranges, preserving dotted keys and repeated names', () => {
  const symbol = (name: string, start: number, end: number) => ({
    name,
    range: { startLineNumber: start, startColumn: 3, endLineNumber: end, endColumn: 12 },
    selectionRange: { startLineNumber: start, startColumn: 3, endLineNumber: start, endColumn: 8 },
  });
  const tree = nestJsonSymbols([symbol('targets', 2, 15), symbol('a.b', 3, 3), symbol('a.b', 9, 9)]);
  expect(jsonSymbolPathAt(tree, { lineNumber: 9, column: 6 }).map((s) => s.range.startLineNumber)).toEqual([2, 9]);
  expect(jsonSymbolPathAt(tree, { lineNumber: 3, column: 12 }).map((s) => s.name)).toEqual(['targets', 'a.b']);
  expect(jsonSymbolPathAt(tree, { lineNumber: 3, column: 13 }).map((s) => s.name)).toEqual(['targets']);
  expect(jsonSymbolPathAt(tree, { lineNumber: 1, column: 1 })).toEqual([]);
});
