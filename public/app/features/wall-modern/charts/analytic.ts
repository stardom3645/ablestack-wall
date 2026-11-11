import uPlot from 'uplot';

import {
  DataFrame,
  FieldConfigSource,
  Field,
  FieldType,
  formattedValueToString,
  GrafanaTheme2,
  guessDecimals,
  roundDecimals,
} from '@grafana/data';
import { UPlotConfigBuilder } from '@grafana/ui';
import { AxisProps } from '@grafana/ui/src/components/uPlot/config/UPlotAxisBuilder';

import { wallTimeSeriesTokens } from '../chartTokens';
import { wallTypography } from '../typography';

import { presentBarFrames } from './categorical';

export const wallAnalyticTokens = {
  pointOpacity: 0.58,
  pointStroke: 1,
  selectionStroke: 2,
  binGap: 2,
  gestureIntent: 6,
} as const;
export function analyticTokens(theme: GrafanaTheme2) {
  return { ...wallTimeSeriesTokens(theme, false), renderLegend: undefined, ...wallAnalyticTokens };
}
export type AnalyticAppearance = ReturnType<typeof analyticTokens>;
export interface AnalyticHit {
  sidx: number;
  didx: number;
}
export interface AnalyticInteraction {
  pick: (hit: AnalyticHit, event: MouseEvent) => void;
  selected: () => AnalyticHit | undefined;
  ready: (plot: uPlot | null) => void;
  panMode?: () => boolean;
}
export function analyticAxis(tokens?: AnalyticAppearance): Partial<AxisProps> {
  return tokens
    ? {
        fontFamily: tokens.fontFamily,
        fontSize: tokens.axisFontSize,
        fontWeight: tokens.axisFontWeight,
        color: tokens.muted,
        gap: tokens.axisGap,
        grid: { stroke: tokens.grid },
        gridDash: tokens.gridDash,
        ticks: { show: false },
      }
    : {};
}
export function binIndex(frame: DataFrame, value: number) {
  const min = frame.fields[0],
    max = frame.fields[1];
  if (!min || !max || !Number.isFinite(value)) {
    return -1;
  }
  if (min.type === 'string') {
    const row = Math.floor(value);
    return row >= 0 && row < frame.length ? row : -1;
  }
  // Explicit bins need not be uniform. Do not manufacture a new bucket policy.
  return min.values.findIndex(
    (lo, row) => value >= lo && (value < max.values[row] || (row === frame.length - 1 && value === max.values[row]))
  );
}
export function binLabel(frame: DataFrame, row: number) {
  if (row < 0 || row >= frame.length) {
    return '';
  }
  const a = frame.fields[0],
    b = frame.fields[1];
  const fmt = (field: typeof a, other: typeof b) => {
    const display = field.display ?? other.display;
    return display ? formattedValueToString(display(field.values[row])) : String(field.values[row]);
  };
  return `${fmt(a, b)} – ${fmt(b, a)}`;
}
export function analyticTextMeasure(text: string) {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) {
    return text.length * wallTypography.roles.axis.size;
  }
  ctx.font = `${wallTypography.roles.axis.weight} ${wallTypography.roles.axis.size}px ${wallTypography.family}`;
  return ctx.measureText(text).width;
}

/** Native numeric scales only. Alt+drag pans; ordinary drag/hover remains owned by uPlot. */
export function installAnalyticPan(
  builder: UPlotConfigBuilder,
  axes: 'xy' | 'x',
  ready?: (plot: uPlot | null) => void,
  panMode: () => boolean = () => false
) {
  let cleanup = () => {};
  builder.addHook('ready', (u) => {
    ready?.(u);
    let previous: { x: number; y: number } | undefined;
    const move = (e: MouseEvent) => {
      if (!previous) {
        return;
      }
      const dx = e.clientX - previous.x,
        dy = e.clientY - previous.y;
      previous = { x: e.clientX, y: e.clientY };
      u.batch(() => {
        for (const [key, scale] of Object.entries(u.scales)) {
          if (key !== 'x' && axes !== 'xy') {
            continue;
          }
          if (scale.min == null || scale.max == null) {
            continue;
          }
          const vertical = scale.ori === 1,
            pixels = (vertical ? u.bbox.height : u.bbox.width) / uPlot.pxRatio,
            delta = vertical ? dy : dx;
          const a = u.posToVal(-delta, key),
            b = u.posToVal(pixels - delta, key);
          if (Number.isFinite(a) && Number.isFinite(b) && a !== b) {
            u.setScale(key, { min: Math.min(a, b), max: Math.max(a, b) });
          }
        }
      });
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    const stop = () => {
      previous = undefined;
      document.removeEventListener('mousemove', move, true);
      document.removeEventListener('mouseup', stop, true);
      window.removeEventListener('blur', stop);
    };
    const down = (e: MouseEvent) => {
      if (!(e.altKey || panMode()) || e.button !== 0) {
        return;
      }
      previous = { x: e.clientX, y: e.clientY };
      u.setCursor({ left: -10, top: -10 });
      document.addEventListener('mousemove', move, true);
      document.addEventListener('mouseup', stop, true);
      window.addEventListener('blur', stop);
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    const click = (e: MouseEvent) => {
      if (e.altKey || panMode()) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    u.over.addEventListener('click', click, true);
    u.over.addEventListener('mousedown', down, true);
    cleanup = () => {
      stop();
      u.over.removeEventListener('mousedown', down, true);
      u.over.removeEventListener('click', click, true);
      ready?.(null);
    };
  });
  builder.addHook('destroy', () => cleanup());
}

/** Copy native display metadata, never query vectors, before the renderer stamps series/origin state. */
export function analyticFrames(frames: DataFrame[], config: FieldConfigSource, theme: GrafanaTheme2) {
  let index = 0;
  return presentBarFrames(
    frames.map((frame) => ({
      ...frame,
      fields: frame.fields.map((field) => ({
        ...field,
        config: { ...field.config, custom: { ...field.config.custom } },
        state: { ...field.state, ...(field.type === FieldType.number ? { seriesIndex: index++ } : {}) },
      })),
    })),
    config,
    theme
  );
}

/** Axis labels may need more precision than a KPI, without changing field decimals or Tooltip values. */
export function analyticAxisValues(field: Field): uPlot.Axis.Values {
  return (u, splits, axisIdx, tickSpace, tickIncr) => {
    const format = (precision?: number) =>
      splits.map((value) =>
        value == null ? null : field.display ? formattedValueToString(field.display(value, precision)) : String(value)
      );
    const nativePrecision = Number.isFinite(tickIncr) ? guessDecimals(roundDecimals(tickIncr, 6)) : 0;
    let labels = format(nativePrecision > 0 ? nativePrecision : undefined);
    const collides = () =>
      labels.some((label, i) => i > 0 && label != null && label === labels[i - 1] && splits[i] !== splits[i - 1]);
    if (field.type !== FieldType.number || field.config.decimals != null || field.config.mappings?.length) {
      return labels;
    }
    for (let precision = 1; precision <= 12 && collides(); precision++) {
      labels = format(precision);
    }
    return labels;
  };
}
