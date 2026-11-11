import tinycolor from 'tinycolor2';

import {
  FieldDisplay,
  FieldConfigSource,
  FieldType,
  formattedValueToString,
  getDisplayProcessor,
  getFieldSeriesColor,
  GrafanaTheme2,
} from '@grafana/data';
import { FieldColorModeId } from '@grafana/schema';
import { PieChartLabels } from 'app/plugins/panel/piechart/panelcfg.gen';
import { filterDisplayItems, sumDisplayItemsReducer } from 'app/plugins/panel/piechart/utils';

import { wallApplicationTokens } from '../applicationTokens';
import { wallTimeSeriesTokens } from '../chartTokens';
import { canUseWallSeriesPalette, hasWallColorOverride } from '../colorSystem';
import { wallPercentText } from '../formatSystem';
import { measureStatText } from '../panels/statReadout';
import { wallSurfaceTokens } from '../surfaceTokens';
import { wallTypography } from '../typography';

export const wallPieTokens = {
  margin: wallSurfaceTokens.compactPadding,
  holeRatio: 0.72,
  separator: 1.5,
  corner: 2,
  centerMinimumRadius: 32,
  centerValueSize: wallTypography.roles.gauge.size,
  labelSize: wallTypography.roles.caption.size,
  labelLine: wallTypography.roles.caption.line,
  labelWeight: wallTypography.roles.control.weight,
  legendRow: wallSurfaceTokens.controlSize,
  menuSize: 24,
  legendGap: wallSurfaceTokens.contentGap,
} as const;
export const wallPieTheme = wallTimeSeriesTokens;

export interface PieEntry {
  id: string;
  value: FieldDisplay;
}

/** Display copies only. Preserve native reducers, row names, mapping/override colors and getLinks closures. */
export function pieEntries(values: FieldDisplay[], config: FieldConfigSource, theme: GrafanaTheme2): PieEntry[] {
  const tokens = wallPieTheme(theme);
  const paletteTheme = { ...theme, visualization: { ...theme.visualization, palette: tokens.palette } };
  return values.map((value, index) => {
    const title = value.display.title ?? '';
    const frame = value.view?.dataFrame;
    const source = frame?.fields[value.colIndex ?? -1];
    const protectedColor = hasWallColorOverride(config, source, frame, frame ? [frame] : [], title);
    const mode = value.field.color?.mode;
    let color = value.display.color;
    if (canUseWallSeriesPalette({ config: value.field }, protectedColor)) {
      color =
        mode === FieldColorModeId.PaletteClassicByName && source
          ? getFieldSeriesColor(
              { ...source, name: title, state: { ...source.state, displayName: title } },
              paletteTheme
            ).color
          : tokens.palette[index % tokens.palette.length];
    }
    return {
      id: JSON.stringify([frame?.refId, value.colIndex, value.rowIndex, value.name, title, index]),
      value: { ...value, display: { ...value.display, color } },
    };
  });
}

export function pieComposition(entries: PieEntry[], theme: GrafanaTheme2) {
  const candidates = entries.filter((entry) => !entry.value.field.custom?.hideFrom?.viz);
  const visible = candidates.filter((entry) => filterDisplayItems(entry.value));
  const total = visible.map((entry) => entry.value).reduce(sumDisplayItemsReducer, 0);
  const invalid =
    candidates.some((entry) => !Number.isFinite(entry.value.display.numeric) || entry.value.display.numeric < 0) ||
    !Number.isFinite(total);
  const units = new Set(visible.map((entry) => entry.value.field.unit || 'none'));
  const sameUnit = units.size <= 1;
  const first = visible[0]?.value;
  // A display total must not inherit a category's value mapping or imply a sum of utilization percentages.
  const canTotal =
    !invalid &&
    sameUnit &&
    first &&
    !['percent', 'percentunit'].includes(first.field.unit ?? '') &&
    visible.every((entry) => !entry.value.field.mappings?.length);
  const decimals = new Set(visible.map((entry) => entry.value.field.decimals));
  const totalDisplay = canTotal
    ? getDisplayProcessor({
        field: {
          type: FieldType.number,
          config: { unit: first.field.unit, decimals: decimals.size === 1 ? first.field.decimals : undefined },
        },
        theme,
      })(total)
    : undefined;
  return { visible, total, invalid, sameUnit, totalDisplay };
}

export function piePercent(entry: PieEntry, composition: ReturnType<typeof pieComposition>) {
  if (composition.invalid || composition.total <= 0 || entry.value.field.custom?.hideFrom?.viz) {
    return;
  }
  return (entry.value.display.numeric / composition.total) * 100;
}
export function formatPiePercent(percent: number | undefined, decimals?: number | null) {
  return wallPercentText(percent, decimals);
}

export function pieLabelLines(entry: PieEntry, labels: PieChartLabels[], percent: number | undefined) {
  return labels.map((label) => {
    if (label === PieChartLabels.Name) {
      return entry.value.display.title ?? '';
    }
    if (label === PieChartLabels.Percent) {
      return formatPiePercent(percent, entry.value.field.decimals);
    }
    const value = entry.value.display;
    return formattedValueToString(value);
  });
}

export interface PieLabelLayout {
  id: string;
  x: number;
  y: number;
  lines: string[];
  color: string;
}
/** Only suppress labels that do not fit; never remove, merge or renormalize slices. */
export function layoutPieLabels(
  arcs: Array<{ data: PieEntry; startAngle: number; endAngle: number }>,
  outer: number,
  inner: number,
  labels: PieChartLabels[],
  composition: ReturnType<typeof pieComposition>
): PieLabelLayout[] {
  if (labels.length === 0 || outer < 52) {
    return [];
  }
  const placed: Array<{ x: number; y: number; w: number; h: number }> = [];
  const output: PieLabelLayout[] = [];
  const radius = inner ? (outer + inner) / 2 : outer * 0.6;
  const height = labels.length * wallPieTokens.labelLine;
  for (const arc of [...arcs].sort((a, b) => b.endAngle - b.startAngle - (a.endAngle - a.startAngle))) {
    const angle = arc.endAngle - arc.startAngle;
    if (angle <= 0 || height > (outer - inner) * 0.82) {
      continue;
    }
    const width = Math.min(outer * 0.8, 2 * radius * Math.sin(Math.min(angle / 2, Math.PI / 2)) * 0.8);
    const lines = pieLabelLines(arc.data, labels, piePercent(arc.data, composition));
    const max = Math.max(
      ...lines.map((line) => measureStatText(line, wallPieTokens.labelSize, wallPieTokens.labelWeight))
    );
    // Keep complete names/values in the legend/tooltip; do not cut numeric labels into misleading fragments.
    if (max > width || width < 24) {
      continue;
    }
    const middle = (arc.startAngle + arc.endAngle) / 2 - Math.PI / 2;
    const x = Math.cos(middle) * radius,
      y = Math.sin(middle) * radius;
    const rect = { x: x - max / 2, y: y - height / 2, w: max, h: height };
    if (
      placed.some(
        (old) => rect.x < old.x + old.w && rect.x + rect.w > old.x && rect.y < old.y + old.h && rect.y + rect.h > old.y
      )
    ) {
      continue;
    }
    placed.push(rect);
    const color = arc.data.value.display.color ?? '#808080';
    const light = wallApplicationTokens.light.text,
      dark = wallApplicationTokens.dark.text;
    output.push({
      id: arc.data.id,
      x,
      y,
      lines,
      color: tinycolor.readability(color, light) > tinycolor.readability(color, dark) ? light : dark,
    });
  }
  return output;
}
