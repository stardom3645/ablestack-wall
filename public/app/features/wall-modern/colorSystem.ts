import { DataFrame, Field, FieldColorModeId, FieldConfigSource, GrafanaTheme2, getFieldMatcher } from '@grafana/data';
import { GraphGradientMode } from '@grafana/schema';

/** Cosmetic accents only. Semantic colors are resolved by Grafana's field formatter/thresholds. */
export const wallColorPalettes = {
  cobalt: { label: 'Cobalt / Sky', light: ['#3c63e6', '#147eaf'], dark: ['#7ca2ff', '#66b8e3'] },
  indigo: { label: 'Indigo / Violet', light: ['#8250df', '#a78bfa'], dark: ['#b394f6', '#c4b5fd'] },
  teal: { label: 'Teal / Cyan', light: ['#0d8879', '#0891b2'], dark: ['#42cbb1', '#22d3ee'] },
  slate: { label: 'Slate / Blue', light: ['#5f6f88', '#3c63e6'], dark: ['#a6b5cc', '#7ca2ff'] },
} as const;

export function wallSeriesPalette(theme: GrafanaTheme2): string[] {
  const mode = theme.isDark ? 'dark' : 'light';
  return [
    wallColorPalettes.cobalt[mode][0],
    wallColorPalettes.teal[mode][0],
    wallColorPalettes.indigo[mode][0],
    theme.isDark ? '#f0b766' : '#b36816',
    theme.isDark ? '#ef88a9' : '#ce4072',
    wallColorPalettes.cobalt[mode][1],
    wallColorPalettes.slate[mode][0],
    theme.isDark ? '#b2cb74' : '#6a7e30',
  ];
}

export function isWallAutomaticColor(mode?: string) {
  return mode === FieldColorModeId.PaletteClassic || mode === FieldColorModeId.PaletteClassicByName;
}

/** A saved matching override is intentional even when it resembles a default palette. */
export function hasWallColorOverride(
  config: FieldConfigSource,
  field?: Field,
  frame?: DataFrame,
  frames: DataFrame[] = frame ? [frame] : [],
  displayName?: string
) {
  return config.overrides.some(
    (rule) =>
      rule.properties.some((property) => property.id === 'color') &&
      ((field && frame && getFieldMatcher(rule.matcher)(field, frame, frames)) ||
        (displayName != null && rule.matcher.id === 'byName' && rule.matcher.options === displayName))
  );
}

/** Never replace value encodings, fixed/threshold colors, colored mappings or explicit paint. */
export function canUseWallSeriesPalette(field: Pick<Field, 'config'>, protectedColor = false) {
  const custom = field.config.custom;
  return (
    isWallAutomaticColor(field.config.color?.mode) &&
    !protectedColor &&
    !field.config.mappings?.some((mapping) =>
      mapping.type === 'value'
        ? Object.values(mapping.options).some((result) => result.color)
        : mapping.options.result?.color
    ) &&
    custom?.gradientMode !== GraphGradientMode.Scheme &&
    custom?.gradientMode !== GraphGradientMode.Hue &&
    !custom?.lineColor &&
    !custom?.fillColor
  );
}

/** Preserve the established eight series, extending automatic Time Series colors before cycling. */
export function wallTimeSeriesPalette(theme: GrafanaTheme2): string[] {
  return [
    ...wallSeriesPalette(theme),
    ...(theme.isDark
      ? ['#62d9e8', '#d4a1df', '#d7bca1', '#a7afb9', '#ed9d81', '#8bd3bb', '#c2b0ed', '#ccd28a']
      : ['#067e96', '#a34b91', '#8b6847', '#67727d', '#bd5535', '#26775c', '#7053a0', '#787326']),
  ];
}
