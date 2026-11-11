import { useContext } from 'react';

import { DataLink, DataLinksFieldConfigSettings, StandardEditorProps, VariableSuggestionsScope } from '@grafana/data';
import { DataLinksInlineEditor } from '@grafana/ui';
import { editorPresentationContext } from 'app/features/wall-modern/editor/EditorPresentationContext';
import { useWallOptionText } from 'app/features/wall-modern/editor/optionText';

type Props = StandardEditorProps<DataLink[], DataLinksFieldConfigSettings>;

export const DataLinksValueEditor = ({ value, onChange, context }: Props) => {
  const text = useWallOptionText();
  const wall = useContext(editorPresentationContext);
  const editor = (
    <DataLinksInlineEditor
      displayText={wall ? text : undefined}
      links={value}
      onChange={onChange}
      data={context.data}
      getSuggestions={() => (context.getSuggestions ? context.getSuggestions(VariableSuggestionsScope.Values) : [])}
    />
  );
  return wall ? <div className="wall-option-links">{editor}</div> : editor;
};
