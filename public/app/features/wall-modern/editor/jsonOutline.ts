import type { Monaco, MonacoEditor } from '@grafana/ui';

export interface JsonSymbol {
  name: string;
  range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
  selectionRange: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
  children?: JsonSymbol[];
}

/** Monaco 0.34.1's own Outline provider/JSON worker, shared with quickOutline. No second parser. */
export async function nativeJsonSymbols(
  editor: MonacoEditor,
  token: InstanceType<Monaco['CancellationTokenSource']>['token']
): Promise<JsonSymbol[]> {
  const [{ OutlineModel }, { StandaloneServices }, { ILanguageFeaturesService }] = await Promise.all([
    import('monaco-editor/esm/vs/editor/contrib/documentSymbols/browser/outlineModel.js'),
    import('monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js'),
    import('monaco-editor/esm/vs/editor/common/services/languageFeatures.js'),
  ]);
  const model = editor.getModel();
  if (!model || model.isDisposed() || token.isCancellationRequested) {
    return [];
  }
  const registry = StandaloneServices.get(ILanguageFeaturesService).documentSymbolProvider;
  if (!registry.has(model)) {
    await new Promise<void>((resolve) => {
      const done = () => {
        changed.dispose();
        cancelled.dispose();
        resolve();
      };
      const changed = registry.onDidChange(() => {
        if (registry.has(model)) {
          done();
        }
      });
      const cancelled = token.onCancellationRequested(done);
      if (registry.has(model) || token.isCancellationRequested) {
        done();
      }
    });
  }
  if (token.isCancellationRequested || model.isDisposed()) {
    return [];
  }
  const outline = await OutlineModel.create(registry, model, token);
  return token.isCancellationRequested ? [] : nestJsonSymbols(outline.getTopLevelSymbols());
}

/** The bundled JSON provider returns flat property ranges. Recover nesting from those ranges only. */
export function nestJsonSymbols(symbols: JsonSymbol[]): JsonSymbol[] {
  const flat: JsonSymbol[] = [];
  const collect = (items: JsonSymbol[]) =>
    items.forEach((item) => {
      flat.push(item);
      if (item.children) {
        collect(item.children);
      }
    });
  collect(symbols);
  const compare = (a: { line: number; column: number }, b: { line: number; column: number }) =>
    a.line - b.line || a.column - b.column;
  const start = (s: JsonSymbol) => ({ line: s.range.startLineNumber, column: s.range.startColumn });
  const end = (s: JsonSymbol) => ({ line: s.range.endLineNumber, column: s.range.endColumn });
  flat.sort((a, b) => compare(start(a), start(b)) || compare(end(b), end(a)));
  const roots: JsonSymbol[] = [],
    stack: JsonSymbol[] = [];
  for (const symbol of flat) {
    const node: JsonSymbol = { ...symbol, children: [] };
    while (stack.length) {
      const parent = stack[stack.length - 1];
      if (
        compare(start(parent), start(node)) <= 0 &&
        compare(end(parent), end(node)) >= 0 &&
        (compare(start(parent), start(node)) !== 0 || compare(end(parent), end(node)) !== 0)
      ) {
        break;
      }
      stack.pop();
    }
    if (stack.length) {
      stack[stack.length - 1].children!.push(node);
    } else {
      roots.push(node);
    }
    stack.push(node);
  }
  return roots;
}

/** Locate the current property using the existing provider's actual document ranges. */
export function jsonSymbolPathAt(symbols: JsonSymbol[], point: { lineNumber: number; column: number }): JsonSymbol[] {
  for (const symbol of symbols) {
    const r = symbol.range;
    const afterStart =
      point.lineNumber > r.startLineNumber || (point.lineNumber === r.startLineNumber && point.column >= r.startColumn);
    const beforeEnd =
      point.lineNumber < r.endLineNumber || (point.lineNumber === r.endLineNumber && point.column <= r.endColumn);
    if (afterStart && beforeEnd) {
      return [symbol, ...jsonSymbolPathAt(symbol.children ?? [], point)];
    }
  }
  return [];
}
