import { css } from '@emotion/css';
import { memo, useCallback, useMemo, useState, useContext } from 'react';

import { GrafanaTheme2, MappingType, StandardEditorProps, ValueMapping } from '@grafana/data';
import { useStyles2, VerticalGroup, Icon, ColorPicker, Button, Modal } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';
import { editorPresentationContext } from 'app/features/wall-modern/editor/EditorPresentationContext';
import { WallValueMappingsEditor } from 'app/features/wall-modern/editor/WallValueMappingsEditor';
import { useWallOptionText } from 'app/features/wall-modern/editor/optionText';

import { MediaType, ResourceFolderName, ResourcePickerSize } from '../../types';
import { ResourcePicker } from '../ResourcePicker';

import { buildEditRowModels, editModelToSaveModel, ValueMappingsEditorModal } from './ValueMappingsEditorModal';

export interface Props extends StandardEditorProps<ValueMapping[]> {
  showIcon?: boolean;
}

export const ValueMappingsEditor = memo((props: Props) => {
  const text = useWallOptionText();
  const wall = useContext(editorPresentationContext);
  const { value, onChange, item } = props;

  const styles = useStyles2(getStyles);
  const showIconPicker = item.settings?.icon;
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const onCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
  }, [setIsEditorOpen]);

  const rows = useMemo(() => buildEditRowModels(value), [value]);

  const onChangeColor = useCallback(
    (color: string, index: number) => {
      rows[index].result.color = color;
      onChange(editModelToSaveModel(rows));
    },
    [rows, onChange]
  );

  const onChangeIcon = useCallback(
    (icon: string | undefined, index: number) => {
      rows[index].result.icon = icon;
      onChange(editModelToSaveModel(rows));
    },
    [rows, onChange]
  );

  if (wall) {
    return <WallValueMappingsEditor value={value} onChange={onChange} showIconPicker={showIconPicker} />;
  }
  return (
    <VerticalGroup>
      <table className={styles.compactTable}>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex.toString()}>
              <td>
                {row.type === MappingType.ValueToText && row.key}
                {row.type === MappingType.RangeToText && (
                  <span>
                    <Trans i18nKey="wall.value-mappings-editor.text-1e5c2f36">[</Trans>
                    {row.from}
                    <Trans i18nKey="wall.value-mappings-editor.text-3bc15c8a"> - </Trans>
                    {row.to}
                    <Trans i18nKey="wall.value-mappings-editor.text-4ff447b8">]</Trans>
                  </span>
                )}
                {row.type === MappingType.RegexToText && row.pattern}
                {row.type === MappingType.SpecialValue && row.specialMatch}
              </td>
              <td>
                <Icon name="arrow-right" />
              </td>
              <td>{row.result.text}</td>
              {row.result.color && (
                <td>
                  <ColorPicker
                    color={row.result.color}
                    onChange={(color) => onChangeColor(color, rowIndex)}
                    enableNamedColors={true}
                  />
                </td>
              )}
              {showIconPicker && row.result.icon && (
                <td data-testid="iconPicker">
                  <ResourcePicker
                    onChange={(icon) => onChangeIcon(icon, rowIndex)}
                    value={row.result.icon}
                    size={ResourcePickerSize.SMALL}
                    folderName={ResourceFolderName.Icon}
                    mediaType={MediaType.Icon}
                    color={row.result.color}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <Button
        className="wall-value-mappings-action"
        variant="secondary"
        size="sm"
        fullWidth
        onClick={() => setIsEditorOpen(true)}
      >
        {rows.length > 0 && <span>{text('Edit value mappings')}</span>}
        {rows.length === 0 && <span>{text('Add value mappings')}</span>}
      </Button>
      <Modal
        isOpen={isEditorOpen}
        title={text('Value mappings')}
        onDismiss={onCloseEditor}
        className={styles.modal}
        closeOnBackdropClick={false}
      >
        <ValueMappingsEditorModal
          value={value}
          onChange={onChange}
          onClose={onCloseEditor}
          showIconPicker={showIconPicker}
        />
      </Modal>
    </VerticalGroup>
  );
});

ValueMappingsEditor.displayName = 'ValueMappingsEditor';

export const getStyles = (theme: GrafanaTheme2) => ({
  modal: css({
    width: '980px',
  }),
  compactTable: css({
    width: '100%',
    'tbody td': {
      padding: theme.spacing(0.5),
    },
  }),
});
