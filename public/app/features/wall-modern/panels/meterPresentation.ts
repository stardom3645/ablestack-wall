import {
  FieldColorModeId,
  FieldDisplay,
  FieldConfigSource,
  DataFrame,
  getFieldMatcher,
  getActiveThreshold,
  ThresholdsMode,
  DisplayValue,
  FieldConfig,
  GrafanaTheme2,
  getDisplayProcessor,
  FieldType,
} from '@grafana/data';
import { getValueMappingResult } from '@grafana/data/src/utils/valueMappings';
import { DEFAULT_THRESHOLDS } from '@grafana/ui/src/components/Gauge/utils';
import type { MeterAppearance } from '@grafana/ui/src/components/VizPresentation/VizPresentation';

import { wallDisplayText } from '../formatSystem';

import { wallMeterTokens } from './meterTokens';

export interface WallMeterOptions {
  wallHeatAggregation?: import('./heatStripModel').HeatAggregation;
  wallMeterUseThresholds?: boolean;
  wallGaugeTheme?: MeterAppearance['theme'];
  wallGaugeShape?: MeterAppearance['shape'];
  wallGaugeFinish?: MeterAppearance['finish'];
}

/** Persisted identical-to-default colors are ambiguous and must remain protected. */
export function meterAppearance(
  value: FieldDisplay,
  config: FieldConfigSource,
  frames: DataFrame[],
  options: WallMeterOptions
): MeterAppearance {
  const source = value.view?.dataFrame;
  const field = source && value.colIndex != null ? source.fields[value.colIndex] : undefined;
  const useThresholds = options.wallMeterUseThresholds !== false;
  const colorKeys = new Set(useThresholds ? ['color', 'thresholds', 'mappings'] : ['color', 'mappings']);
  const matched =
    field &&
    source &&
    config.overrides.some(
      (rule) =>
        getFieldMatcher(rule.matcher)(field, source, frames) &&
        rule.properties.some((property) => colorKeys.has(property.id))
    );
  const raw = config.defaults;
  const mode = value.field.color?.mode;
  const steps = value.field.thresholds;
  const nativeDefaults =
    !steps ||
    (steps.mode === DEFAULT_THRESHOLDS.mode &&
      steps.steps.length === 2 &&
      steps.steps.every(
        (step, i) =>
          step.color === DEFAULT_THRESHOLDS.steps[i].color &&
          (i === 0 ? step.value == null || step.value === -Infinity : step.value === 80)
      ));
  // A deliberate Wall theme selection may restyle only the native preset's
  // baseline green. Persisted look-alike defaults stay protected without that
  // explicit choice; custom thresholds/fixed colors/overrides always win.
  const selectedNativePreset =
    Object.prototype.hasOwnProperty.call(wallMeterTokens.palettes, options.wallGaugeTheme ?? '') && nativeDefaults;
  const explicit = Boolean(
    (useThresholds && raw.thresholds?.steps.length && !selectedNativePreset) ||
      getValueMappingResult(raw.mappings ?? [], value.display.numeric)?.color ||
      (raw.color && raw.color.mode !== FieldColorModeId.Thresholds) ||
      matched
  );
  const activeNativeAlert = useThresholds && nativeDefaults && value.display.numeric >= 80;
  const configured =
    explicit ||
    activeNativeAlert ||
    (mode != null && mode !== FieldColorModeId.Thresholds) ||
    (useThresholds && !nativeDefaults) ||
    Boolean(getValueMappingResult(value.field.mappings ?? [], value.display.numeric)?.color);
  return {
    theme: options.wallGaugeTheme,
    shape: options.wallGaugeShape,
    finish: options.wallGaugeFinish,
    useThresholds,
    colorSource: configured ? 'configured' : 'default',
  };
}

export function meterColors(value: DisplayValue, appearance: MeterAppearance | undefined, theme: GrafanaTheme2) {
  const palette = wallMeterTokens.palettes[appearance?.theme ?? 'cobalt'] ?? wallMeterTokens.palettes.cobalt;
  const pair = theme.isDark ? palette.dark : palette.light;
  // Absence of provenance never licenses replacing a potentially explicit color.
  return appearance?.colorSource === 'default'
    ? pair
    : ([
        theme.visualization.getColorByName(value.color ?? theme.colors.primary.main),
        theme.visualization.getColorByName(value.color ?? theme.colors.primary.main),
      ] as const);
}

export function formatMeterBound(value: number, field: FieldConfig, theme: GrafanaTheme2) {
  const display = getDisplayProcessor({
    field: { name: '', type: FieldType.number, config: { ...field, mappings: [] }, values: [] },
    theme,
  });
  return wallDisplayText(display(value));
}

/** Explain the actual threshold interval, without guessing severity from a hue. */
export function meterInterval(
  field: FieldConfig,
  value: DisplayValue,
  theme: GrafanaTheme2,
  configured: boolean,
  percentageNumeric?: number
) {
  if (!configured || field.color?.mode !== FieldColorModeId.Thresholds || !Number.isFinite(value.numeric)) {
    return undefined;
  }
  if (getValueMappingResult(field.mappings ?? [], value.numeric)) {
    return undefined;
  }
  const steps = field.thresholds?.steps ?? [];
  if (steps.length === 0) {
    return undefined;
  }
  const numeric =
    field.thresholds?.mode === ThresholdsMode.Percentage
      ? (percentageNumeric ?? (value.percent === undefined ? value.numeric : value.percent * 100))
      : value.numeric;
  if (!Number.isFinite(numeric)) {
    return undefined;
  }
  const active = getActiveThreshold(numeric, steps);
  const next = steps[steps.indexOf(active) + 1];
  const lower = Number.isFinite(active.value) && numeric >= active.value;
  const bound = lower
    ? active.value
    : next && Number.isFinite(next.value)
      ? next.value
      : Number.isFinite(active.value)
        ? active.value
        : undefined;
  if (bound == null) {
    return undefined;
  }
  const label =
    field.thresholds?.mode === ThresholdsMode.Percentage ? `${bound}%` : formatMeterBound(bound, field, theme);
  return lower ? `≥ ${label}` : `${label} 미만`;
}

/** Contiguous threshold ranges for the native 'gradient' mode: precise flat colors, no gloss. */
export function meterSegments(field: FieldConfig, value: DisplayValue, min: number, max: number, theme: GrafanaTheme2) {
  if (
    field.color?.mode !== FieldColorModeId.Thresholds ||
    !field.thresholds?.steps.length ||
    getValueMappingResult(field.mappings ?? [], value.numeric)?.color ||
    !Number.isFinite(value.numeric) ||
    max <= min
  ) {
    return [];
  }
  const ratio = Math.max(0, Math.min(1, (value.numeric - min) / (max - min)));
  if (ratio <= 0) {
    return [];
  }
  const percentage = field.thresholds.mode === ThresholdsMode.Percentage;
  const stops = [
    0,
    ...Array.from(
      new Set(
        field.thresholds.steps
          .filter((step) => Number.isFinite(step.value))
          .map((step) => (percentage ? step.value / 100 : (step.value - min) / (max - min)))
          .filter((stop) => stop > 0 && stop < ratio)
      )
    ).sort((a, b) => a - b),
    ratio,
  ];
  return stops.slice(0, -1).map((start, index) => {
    const end = stops[index + 1],
      midpoint = (start + end) / 2;
    const threshold = getActiveThreshold(
      percentage ? midpoint * 100 : min + midpoint * (max - min),
      field.thresholds!.steps
    );
    return { size: (end - start) / ratio, color: theme.visualization.getColorByName(threshold.color) };
  });
}
