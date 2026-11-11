import { css } from '@emotion/css';
import { useContext } from 'react';

import { StandardEditorProps, GrafanaTheme2, UnitFieldConfigSettings } from '@grafana/data';
import { IconButton, UnitPicker, useStyles2 } from '@grafana/ui';
import { editorPresentationContext } from 'app/features/wall-modern/editor/EditorPresentationContext';
import { useWallOptionText } from 'app/features/wall-modern/editor/optionText';

type Props = StandardEditorProps<string, UnitFieldConfigSettings>;

export function UnitValueEditor({ value, onChange, item }: Props) {
  const text = useWallOptionText();
  const wall = useContext(editorPresentationContext);
  const styles = useStyles2(getStyles);
  if (item?.settings?.isClearable && value != null) {
    return (
      <div className={styles.wrapper}>
        <span className={styles.first}>
          <UnitPicker displayText={wall ? text : undefined} value={value} onChange={onChange} />
        </span>
        <IconButton name="times" onClick={() => onChange(undefined)} tooltip={text('Clear unit selection')} />
      </div>
    );
  }
  return <UnitPicker displayText={wall ? text : undefined} value={value} onChange={onChange} />;
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  }),
  first: css({
    marginRight: theme.spacing(1),
    flexGrow: 2,
  }),
});
