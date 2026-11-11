import {
  FieldColorModeId,
  FieldDisplay,
  FieldSparkline,
  FieldType,
  getActiveThreshold,
  ThresholdsMode,
} from '@grafana/data';
import { getValueMappingResult } from '@grafana/data/src/utils/valueMappings';

import { wallSurfaceTokens } from '../surfaceTokens';
import { wallTypography } from '../typography';

export const wallStatTokens = {
  value: wallTypography.roles.kpi,
  status: wallTypography.roles.status,
  label: wallTypography.roles.caption,
  unit: wallTypography.roles.unit,
  inlineValue: wallTypography.roles.compactMetric,
  name: wallTypography.roles.section,
  gap: wallSurfaceTokens.contentGap,
  unitGap: 3,
  statusGap: 8,
  statusDot: { minimum: 7, maximum: 10, valueRatio: 0.25 },
  statusInsetX: 10,
  statusInsetY: 6,
  compactStatusInsetY: 2,
  statusRadius: wallSurfaceTokens.radius,
  unitScale: 0.48,
  minimumItemWidth: 120,
  minimumItemHeight: 80,
  itemGap: wallSurfaceTokens.contentGap,
  denseGap: wallSurfaceTokens.contentGap / 2,
  inlineRowGap: wallSurfaceTokens.contentGap / 4,
  itemInset: wallSurfaceTokens.padding,
  labelReadingMinimum: 80,
  labelReadingWidth: 200,
  accentThickness: 3,
  accentLength: wallSurfaceTokens.padding * 2,
  accentInset: wallSurfaceTokens.compactPadding,
} as const;

/** Keep the existing state marker legible beside both compact and full-size numbers. */
export function statStateDotSize(valueSize: number) {
  const { minimum, maximum, valueRatio } = wallStatTokens.statusDot;
  return Math.min(maximum, Math.max(minimum, Math.round(valueSize * valueRatio)));
}

/** A native sparkline without a time field is an index plot, not a real time series. */
export function hasStatTimeSeries(sparkline?: FieldSparkline) {
  if (!sparkline?.x || sparkline.x.type !== FieldType.time || sparkline.y.type !== FieldType.number) {
    return false;
  }
  const times = sparkline.x.values;
  const values = sparkline.y.values;
  let valid = 0;
  for (let i = 0; i < Math.min(times.length, values.length); i++) {
    if (Number.isFinite(times[i]) && typeof values[i] === 'number' && Number.isFinite(values[i]) && ++valid >= 2) {
      return true;
    }
  }
  return false;
}

/** A text-colored threshold is neutral text, not a status to decorate with a dot. */
export function hasStatStateColor(value: FieldDisplay) {
  const mapping = statValueMapping(value);
  if (mapping?.color) {
    return mapping.color !== 'text';
  }
  const color = value.field.color;
  if (color?.mode === FieldColorModeId.Fixed) {
    return Boolean(color.fixedColor && color.fixedColor !== 'text');
  }
  if (color?.mode && color.mode !== FieldColorModeId.Thresholds) {
    return true;
  }
  const thresholds = value.field.thresholds;
  if (!thresholds?.steps.length) {
    return false;
  }
  const numeric =
    thresholds.mode === ThresholdsMode.Percentage
      ? value.display.percent === undefined
        ? value.display.numeric
        : value.display.percent * 100
      : value.display.numeric;
  return getActiveThreshold(numeric, thresholds.steps).color !== 'text';
}

/** Numeric display values lose string/boolean identity. Read the native row or
 * cached reducer result that was actually formatted, never guess a source row. */
export function statSourceValue(value: FieldDisplay) {
  const source = value.colIndex == null ? undefined : value.view?.dataFrame.fields[value.colIndex];
  const calcs = source?.state?.calcs;
  return source && value.rowIndex != null
    ? source.values[value.rowIndex]
    : calcs && Object.prototype.hasOwnProperty.call(calcs, value.name)
      ? calcs[value.name]
      : value.view
        ? value.display.numeric
        : null;
}

export function statValueMapping(value: FieldDisplay) {
  return getValueMappingResult(value.field.mappings ?? [], statSourceValue(value));
}

let canvas: HTMLCanvasElement | undefined;
/** Independent canvas: do not disturb Grafana's cached measurement context/font. */
export function measureStatText(text: string, size: number, weight: number) {
  canvas ??= document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return text.length * size;
  }
  context.font = `${weight} ${size}px ${wallTypography.family}`;
  return context.measureText(text).width;
}

export function fitStatValue({
  text,
  prefix = '',
  suffix = '',
  width,
  height,
  maximum,
  unitMaximum,
  weight,
  lineHeight = wallStatTokens.value.line / wallStatTokens.value.size,
}: {
  text: string;
  prefix?: string;
  suffix?: string;
  width: number;
  height: number;
  maximum: number;
  unitMaximum: number;
  weight: number;
  lineHeight?: number;
}) {
  const unit = Math.min(unitMaximum, maximum * wallStatTokens.unitScale);
  const unitWidth =
    measureStatText(prefix + suffix, unit, wallStatTokens.unit.weight) +
    (Number(Boolean(prefix)) + Number(Boolean(suffix))) * wallStatTokens.unitGap;
  const measured = measureStatText(text, maximum, weight) + unitWidth;
  // Scale the number and unit together, never use a CSS transform on glyphs.
  return Math.max(
    1,
    Math.min(
      maximum,
      maximum * Math.min(1, Math.max(0, width) / Math.max(1, measured)),
      Math.max(0, height) / lineHeight
    )
  );
}
