import { TableAutoCellOptions, TableColorTextCellOptions } from '@grafana/schema';
import { Field, Switch, Badge, Label } from '@grafana/ui';
import { useWallOptionText } from 'app/features/wall-modern/editor/optionText';

import { TableCellEditorProps } from '../TableCellOptionEditor';

export const AutoCellOptionsEditor = ({
  cellOptions,
  onChange,
}: TableCellEditorProps<TableAutoCellOptions | TableColorTextCellOptions>) => {
  const text = useWallOptionText();
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
      <Field label={label}>
        <Switch value={cellOptions.wrapText} onChange={onWrapTextChange} />
      </Field>
    </>
  );
};
