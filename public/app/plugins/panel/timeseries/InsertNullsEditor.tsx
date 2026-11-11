import { StandardEditorProps, SelectableValue } from '@grafana/data';
import { HorizontalGroup, RadioButtonGroup } from '@grafana/ui';
import { useWallOptionText } from 'app/features/wall-modern/editor/optionText';

import { InputPrefix, NullsThresholdInput } from './NullsThresholdInput';

const DISCONNECT_OPTIONS: Array<SelectableValue<boolean | number>> = [
  {
    label: 'Never',
    value: false,
  },
  {
    label: 'Threshold',
    value: 3600000, // 1h
  },
];

type Props = StandardEditorProps<boolean | number, { isTime: boolean }>;

export const InsertNullsEditor = ({ value, onChange, item }: Props) => {
  const text = useWallOptionText();
  const isThreshold = typeof value === 'number';
  DISCONNECT_OPTIONS[1].value = isThreshold ? value : 3600000; // 1h

  return (
    <HorizontalGroup>
      <RadioButtonGroup
        value={value}
        options={DISCONNECT_OPTIONS.map((option) => ({ ...option, label: text(option.label) }))}
        onChange={onChange}
      />
      {isThreshold && (
        <NullsThresholdInput
          value={value}
          onChange={onChange}
          inputPrefix={InputPrefix.GreaterThan}
          isTime={item.settings?.isTime ?? false}
        />
      )}
    </HorizontalGroup>
  );
};
