import { css } from '@emotion/css';
import { CSSProperties, FC, useContext } from 'react';

import {
  StandardEditorProps,
  FieldColorModeId,
  SelectableValue,
  FieldColor,
  fieldColorModeRegistry,
  FieldColorMode,
  GrafanaTheme2,
  FieldColorConfigSettings,
  FieldColorSeriesByMode,
  getFieldColorMode,
} from '@grafana/data';
import { useStyles2, useTheme2, Field, RadioButtonGroup, Select } from '@grafana/ui';
import { isWallAutomaticColor, wallSeriesPalette } from 'app/features/wall-modern/colorSystem';
import { editorPresentationContext } from 'app/features/wall-modern/editor/EditorPresentationContext';
import { useWallOptionText } from 'app/features/wall-modern/editor/optionText';

import { ColorValueEditor } from './color';

type Props = StandardEditorProps<FieldColor | undefined, FieldColorConfigSettings>;

export const FieldColorEditor = ({ value, onChange, item, id }: Props) => {
  const text = useWallOptionText();
  const wall = useContext(editorPresentationContext);
  const theme = useTheme2();
  const styles = useStyles2(getStyles);

  const colorMode = getFieldColorMode(value?.mode);
  const availableOptions = item.settings?.byValueSupport
    ? fieldColorModeRegistry.list()
    : fieldColorModeRegistry.list().filter((m) => !m.isByValue);

  const options = availableOptions
    .filter((mode) => !mode.excludeFromPicker)
    .map((mode) => {
      let suffix = mode.isByValue ? ' (by value)' : '';

      return {
        value: mode.id,
        label:
          wall && isWallAutomaticColor(mode.id)
            ? mode.id === FieldColorModeId.PaletteClassicByName
              ? 'Wall 시리즈 · 이름 기준'
              : 'Wall 시리즈'
            : `${text(mode.name)}${suffix ? ' (' + text('by value') + ')' : ''}`,
        description: text(mode.description),
        isContinuous: mode.isContinuous,
        isByValue: mode.isByValue,
        component() {
          return <FieldColorModeViz mode={mode} theme={theme} />;
        },
      };
    });

  const onModeChange = (newMode: SelectableValue<string>) => {
    onChange({
      ...value,
      mode: newMode.value!,
    });
  };

  const onColorChange = (color?: string) => {
    onChange({
      ...value,
      mode,
      fixedColor: color,
    });
  };

  const onSeriesModeChange = (seriesBy?: FieldColorSeriesByMode) => {
    onChange({
      ...value,
      mode,
      seriesBy,
    });
  };

  const mode = value?.mode ?? FieldColorModeId.Thresholds;

  if (mode === FieldColorModeId.Fixed || mode === FieldColorModeId.Shades) {
    return (
      <div className={styles.group}>
        <Select
          minMenuHeight={200}
          options={options}
          value={mode}
          onChange={onModeChange}
          className={styles.select}
          inputId={id}
        />
        <ColorValueEditor value={value?.fixedColor} onChange={onColorChange} />
      </div>
    );
  }

  if (item.settings?.bySeriesSupport && colorMode.isByValue) {
    const seriesModes: Array<SelectableValue<FieldColorSeriesByMode>> = [
      { label: 'Last', value: 'last' },
      { label: 'Min', value: 'min' },
      { label: 'Max', value: 'max' },
    ];

    return (
      <>
        <div style={{ marginBottom: theme.spacing(2) }}>
          <Select minMenuHeight={200} options={options} value={mode} onChange={onModeChange} inputId={id} />
        </div>
        <Field label={text('Color series by')}>
          <RadioButtonGroup
            value={value?.seriesBy ?? 'last'}
            options={seriesModes.map((option) => ({ ...option, label: text(option.label) }))}
            onChange={onSeriesModeChange}
          />
        </Field>
      </>
    );
  }

  return <Select minMenuHeight={200} options={options} value={mode} onChange={onModeChange} inputId={id} />;
};

interface ModeProps {
  mode: FieldColorMode;
  theme: GrafanaTheme2;
}

const FieldColorModeViz: FC<ModeProps> = ({ mode, theme }) => {
  const wall = useContext(editorPresentationContext);
  if (!mode.getColors) {
    return null;
  }

  const colors =
    wall && isWallAutomaticColor(mode.id)
      ? wallSeriesPalette(theme)
      : mode.getColors(theme).map(theme.visualization.getColorByName);
  const style: CSSProperties = {
    height: '8px',
    width: '100%',
    margin: '2px 0',
    borderRadius: '3px',
    opacity: 1,
  };

  if (mode.isContinuous) {
    style.background = `linear-gradient(90deg, ${colors.join(',')})`;
  } else {
    let gradient = '';
    let lastColor = '';

    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      if (gradient === '') {
        gradient = `linear-gradient(90deg, ${color} 0%`;
      } else {
        const valuePercent = i / (colors.length - 1);
        const pos = valuePercent * 100;
        gradient += `, ${lastColor} ${pos}%, ${color} ${pos}%`;
      }
      lastColor = color;
    }
    style.background = gradient;
  }

  return <div style={style} />;
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    group: css({
      display: 'flex',
    }),
    select: css({
      marginRight: theme.spacing(1),
      flexGrow: 1,
    }),
  };
};
