import { SelectableValue } from '@grafana/data';
import { TableCellBackgroundDisplayMode, TableColoredBackgroundCellOptions } from '@grafana/schema';
import { Field, RadioButtonGroup, Switch, Label, Badge } from '@grafana/ui';
import { useWallOptionText } from 'app/features/wall-modern/editor/optionText';

import { TableCellEditorProps } from '../TableCellOptionEditor';

const colorBackgroundOpts: Array<SelectableValue<TableCellBackgroundDisplayMode>> = [
  { value: TableCellBackgroundDisplayMode.Basic, label: 'Basic' },
  { value: TableCellBackgroundDisplayMode.Gradient, label: 'Gradient' },
];

export const ColorBackgroundCellOptionsEditor = ({
  cellOptions,
  onChange,
}: TableCellEditorProps<TableColoredBackgroundCellOptions>) => {
  const text = useWallOptionText();
  // Set the display mode on change
  const onCellOptionsChange = (v: TableCellBackgroundDisplayMode) => {
    cellOptions.mode = v;
    onChange(cellOptions);
  };

  // Handle row coloring changes
  const onColorRowChange = () => {
    cellOptions.applyToRow = !cellOptions.applyToRow;
    onChange(cellOptions);
  };

  // Handle row coloring changes
  const onWrapTextChange = () => {
    cellOptions.wrapText = !cellOptions.wrapText;
    onChange(cellOptions);
  };

  const label = (
    <Label description={text('If selected text will be wrapped to the width of text in the configured column')}>
      {text('Wrap text')}
      <Badge text="Alpha" color="blue" style={{ fontSize: '11px', marginLeft: '5px', lineHeight: '1.2' }} />
    </Label>
  );

  return (
    <>
      <Field label={text('Background display mode')}>
        <RadioButtonGroup
          value={cellOptions?.mode ?? TableCellBackgroundDisplayMode.Gradient}
          onChange={onCellOptionsChange}
          options={colorBackgroundOpts.map((option) => ({ ...option, label: text(option.label) }))}
        />
      </Field>
      <Field
        label={text('Apply to entire row')}
        description={text('If selected the entire row will be colored as this cell would be.')}
      >
        <Switch value={cellOptions.applyToRow} onChange={onColorRowChange} />
      </Field>
      <Field label={label}>
        <Switch value={cellOptions.wrapText} onChange={onWrapTextChange} />
      </Field>
    </>
  );
};
