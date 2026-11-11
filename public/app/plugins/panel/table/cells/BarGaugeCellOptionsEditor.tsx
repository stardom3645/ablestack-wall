import { SelectableValue } from '@grafana/data';
import { BarGaugeDisplayMode, BarGaugeValueMode, TableBarGaugeCellOptions } from '@grafana/schema';
import { Field, RadioButtonGroup, Stack } from '@grafana/ui';
import { useWallOptionText } from 'app/features/wall-modern/editor/optionText';

import { TableCellEditorProps } from '../TableCellOptionEditor';

type Props = TableCellEditorProps<TableBarGaugeCellOptions>;

export function BarGaugeCellOptionsEditor({ cellOptions, onChange }: Props) {
  const text = useWallOptionText();
  // Set the display mode on change
  const onCellOptionsChange = (v: BarGaugeDisplayMode) => {
    cellOptions.mode = v;
    onChange(cellOptions);
  };

  const onValueModeChange = (v: BarGaugeValueMode) => {
    cellOptions.valueDisplayMode = v;
    onChange(cellOptions);
  };

  return (
    <Stack direction="column" gap={0}>
      <Field label={text('Gauge display mode')}>
        <RadioButtonGroup
          value={cellOptions?.mode ?? BarGaugeDisplayMode.Gradient}
          onChange={onCellOptionsChange}
          options={barGaugeOpts.map((option) => ({ ...option, label: text(option.label) }))}
        />
      </Field>
      <Field label={text('Value display')}>
        <RadioButtonGroup
          value={cellOptions?.valueDisplayMode ?? BarGaugeValueMode.Text}
          onChange={onValueModeChange}
          options={valueModes.map((option) => ({ ...option, label: text(option.label) }))}
        />
      </Field>
    </Stack>
  );
}

const barGaugeOpts: SelectableValue[] = [
  { value: BarGaugeDisplayMode.Basic, label: 'Basic' },
  { value: BarGaugeDisplayMode.Gradient, label: 'Gradient' },
  { value: BarGaugeDisplayMode.Lcd, label: 'Retro LCD' },
];

const valueModes: SelectableValue[] = [
  { value: BarGaugeValueMode.Color, label: 'Value color' },
  { value: BarGaugeValueMode.Text, label: 'Text color' },
  { value: BarGaugeValueMode.Hidden, label: 'Hidden' },
];
