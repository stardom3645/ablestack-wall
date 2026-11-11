// Version-bound bridge to Monaco 0.34.1's existing Outline provider.
declare module 'monaco-editor/esm/vs/editor/contrib/documentSymbols/browser/outlineModel.js' {
  import type { editor, CancellationToken, languages } from 'monaco-editor';
  export const OutlineModel: {
    create(
      registry: unknown,
      model: editor.ITextModel,
      token: CancellationToken
    ): Promise<{ getTopLevelSymbols(): languages.DocumentSymbol[] }>;
  };
}
declare module 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js' {
  export const StandaloneServices: {
    get(id: unknown): {
      documentSymbolProvider: { has(model: unknown): boolean; onDidChange(callback: () => void): { dispose(): void } };
    };
  };
}
declare module 'monaco-editor/esm/vs/editor/common/services/languageFeatures.js' {
  export const ILanguageFeaturesService: unknown;
}
