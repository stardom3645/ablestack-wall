import React from 'react';
import Editor from '@monaco-editor/react';
import { promLanguageDefinition } from 'monaco-promql';
import type * as monacoType from 'monaco-editor/esm/vs/editor/editor.api';
type Monaco = typeof monacoType;
import { useTheme2 } from '@grafana/ui';
import { getSuggestion } from './suggestions';
import { getCompletions } from './completions';
import type PromQlLanguageProvider from '../../language_provider';

const setupPromQL = (monaco: Monaco, languageProvider: PromQlLanguageProvider) => {
  function provideCompletionItems(
    model: monacoType.editor.ITextModel,
    position: monacoType.Position
  ): monacoType.languages.ProviderResult<monacoType.languages.CompletionList> {
    console.log('pci');
    const word = model.getWordAtPosition(position);
    const range =
      word != null
        ? monaco.Range.lift({
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          })
        : monaco.Range.fromPositions(position);
    // documentation says `position` will be "adjusted" in `getOffsetAt`
    // i don't know what that means, to be sure i clone it
    const positionClone = {
      column: position.column,
      lineNumber: position.lineNumber,
    };
    const offset = model.getOffsetAt(positionClone);
    const suggestion = getSuggestion(model.getValue(), offset);
    const completionsPromise = suggestion != null ? getCompletions(suggestion, languageProvider) : Promise.resolve([]);
    return completionsPromise.then((items) => {
      const suggestions = items.map((item) => ({
        kind: monaco.languages.CompletionItemKind.Text,
        label: item.label,
        insertText: item.insertText,
        range,
        command: item.suggestOnInsert
          ? {
              id: 'editor.action.triggerSuggest',
              title: '',
            }
          : undefined,
      }));
      return { suggestions };
    });
  }

  const completionProvider: monacoType.languages.CompletionItemProvider = {
    triggerCharacters: ['{', ','],
    provideCompletionItems,
  };

  const langId = promLanguageDefinition.id;
  monaco.languages.register(promLanguageDefinition);
  // monaco.languages.onLanguage(langId, () => {
  promLanguageDefinition.loader().then((mod) => {
    monaco.languages.setMonarchTokensProvider(langId, mod.language);
    monaco.languages.setLanguageConfiguration(langId, mod.languageConfiguration);
    monaco.languages.registerCompletionItemProvider(langId, completionProvider);
  });
  // });
};

type Props = {
  languageProvider: PromQlLanguageProvider;
};

const MonacoQueryField = (props: Props) => {
  const theme2 = useTheme2();

  return (
    <Editor
      theme="grafana"
      height="100px"
      defaultLanguage="promql"
      defaultValue="hey"
      beforeMount={(monaco: Monaco) => {
        monaco.editor.defineTheme('grafana', {
          base: theme2.isDark ? 'vs-dark' : 'vs',
          inherit: true,
          colors: {
            'editor.background': theme2.components.input.background,
            'minimap.background': theme2.colors.background.secondary,
          },
          rules: [],
        });

        setupPromQL(monaco, props.languageProvider);
      }}
    />
  );
};

export default MonacoQueryField;
