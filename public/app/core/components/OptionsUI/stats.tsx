import { useContext } from 'react';

import { StandardEditorProps, StatsPickerConfigSettings } from '@grafana/data';
import { StatsPicker } from '@grafana/ui';
import { editorPresentationContext } from 'app/features/wall-modern/editor/EditorPresentationContext';
import { useWallOptionText } from 'app/features/wall-modern/editor/optionText';

export const StatsPickerEditor = ({
  value,
  onChange,
  item,
  id,
}: StandardEditorProps<string[], StatsPickerConfigSettings>) => {
  const text = useWallOptionText();
  const wall = useContext(editorPresentationContext);
  return (
    <StatsPicker
      displayText={wall ? text : undefined}
      stats={value}
      onChange={onChange}
      allowMultiple={!!item.settings?.allowMultiple}
      defaultStat={item.settings?.defaultStat}
      inputId={id}
    />
  );
};
