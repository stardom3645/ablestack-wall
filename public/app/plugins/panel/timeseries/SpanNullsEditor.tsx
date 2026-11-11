import { StandardEditorProps, SelectableValue } from '@grafana/data';
import { HorizontalGroup, RadioButtonGroup } from '@grafana/ui';
import { useWallOptionText } from 'app/features/wall-modern/editor/optionText';

import { InputPrefix, NullsThresholdInput } from './NullsThresholdInput';

const GAPS_OPTIONS: Array<SelectableValue<boolean | number>> = [
  {
    label: 'Never',
    value: false,
  },
  {
    label: 'Always',
    value: true,
  },
  {
    label: 'Threshold',
    value: 3600000, // 1h
  },
];

type Props = StandardEditorProps<boolean | number, { isTime: boolean }>;

export const SpanNullsEditor = ({ value, onChange, item }: Props) => {
  const text = useWallOptionText();
  const isThreshold = typeof value === 'number';
  GAPS_OPTIONS[2].value = isThreshold ? value : 3600000; // 1h

  return (
    <HorizontalGroup>
      <RadioButtonGroup
        value={value}
        options={GAPS_OPTIONS.map((option) => ({ ...option, label: text(option.label) }))}
        onChange={onChange}
      />
      {isThreshold && (
        <NullsThresholdInput
          value={value}
          onChange={onChange}
          inputPrefix={InputPrefix.LessThan}
          isTime={item.settings?.isTime ?? false}
        />
      )}
    </HorizontalGroup>
  );
};
