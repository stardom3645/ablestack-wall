import {
  DataFrame,
  Field,
  FieldType,
  FieldColorModeId,
  FieldConfigSource,
  getDisplayProcessor,
  getFieldSeriesColor,
  GrafanaTheme2,
} from '@grafana/data';

import { wallTimeSeriesTokens } from '../chartTokens';
import { canUseWallSeriesPalette, hasWallColorOverride } from '../colorSystem';
import { wallTypography } from '../typography';

export const wallBarTokens = {
  toolbarHeight: 32,
  valueSize: wallTypography.roles.control.size,
  categorySpacing: 58,
  valueAxisReserve: 60,
  categoryWidth: 170,
  categoryWidthRatio: 0.32,
  axisGap: 7,
  selectionWidth: 1.5,
} as const;

/** Share the chart palette, fonts, grid and tooltip system without enabling time-series-only legend actions. */
export function wallCategoricalTokens(theme: GrafanaTheme2) {
  return { ...wallTimeSeriesTokens(theme, false), renderLegend: undefined, ...wallBarTokens };
}

/** Cosmetic palette only; native fixed colors, mappings, thresholds, gradients and matched overrides win. */
export function presentBarFrames(frames: DataFrame[], config: FieldConfigSource, theme: GrafanaTheme2) {
  const tokens = wallCategoricalTokens(theme);
  const paletteTheme = { ...theme, visualization: { ...theme.visualization, palette: tokens.palette } };
  return frames.map((frame) => ({
    ...frame,
    fields: frame.fields.map((field) => {
      const protectedColor = hasWallColorOverride(config, field, frame, frames);
      if (field.type !== FieldType.number || !canUseWallSeriesPalette(field, protectedColor)) {
        return field;
      }
      const copy = {
        ...field,
        config: {
          ...field.config,
          color: { mode: FieldColorModeId.Fixed, fixedColor: getFieldSeriesColor(field, paletteTheme).color },
        },
      };
      copy.display = getDisplayProcessor({ field: copy, theme });
      return copy;
    }),
  }));
}

/** Numeric index plus original name disambiguates equal field names from joined queries. View metadata only. */
export function barFieldKey(field: Field, index: number) {
  return `${index}:${field.name}`;
}
export function findBarField(frame: DataFrame, key: string) {
  return frame.fields.find((field, index) => barFieldKey(field, index) === key);
}

export interface CategoryOrder {
  field: string;
  direction: 'source' | 'asc' | 'desc';
  limit: number;
}
export const initialCategoryOrder: CategoryOrder = { field: '', direction: 'source', limit: 0 };

/** Index projection only. Never sort the query vectors or mix values with a different category/color/extra field. */
export function categoryIndices(frame: DataFrame, order: CategoryOrder): number[] {
  const indices = Array.from({ length: frame.length }, (_, i) => i);
  const field = findBarField(frame, order.field) ?? frame.fields[1];
  if (order.direction !== 'source' && field) {
    indices.sort((a, b) => {
      const av = field.values[a],
        bv = field.values[b];
      const af = typeof av === 'number' && Number.isFinite(av),
        bf = typeof bv === 'number' && Number.isFinite(bv);
      if (!af || !bf) {
        return af ? -1 : bf ? 1 : a - b;
      }
      const delta = order.direction === 'asc' ? av - bv : bv - av;
      return delta || a - b;
    });
  }
  return order.limit > 0 ? indices.slice(0, order.limit) : indices;
}

export function projectCategoryField(field: Field, indices: number[]): Field {
  const getLinks = field.getLinks;
  return {
    ...field,
    values: indices.map((i) => field.values[i]),
    // Native link closures still refer to the original frame. Translate the displayed row back once.
    getLinks: getLinks
      ? (context) =>
          getLinks({
            ...context,
            valueRowIndex: context.valueRowIndex == null ? undefined : indices[context.valueRowIndex],
          })
      : undefined,
  };
}

export function projectCategories(frame: DataFrame, indices: number[]): DataFrame {
  return {
    ...frame,
    length: indices.length,
    fields: frame.fields.map((field) => projectCategoryField(field, indices)),
  };
}

export function truncateCategory(value: string, pixels: number, measure: (text: string) => number) {
  if (measure(value) <= pixels) {
    return value;
  }
  const chars = Array.from(value);
  let lo = 0,
    hi = chars.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measure(chars.slice(0, mid).join('') + '…') <= pixels) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return chars.slice(0, lo).join('') + '…';
}

let canvas: CanvasRenderingContext2D | null;
export function measureBarText(text: string, size: number) {
  if (!canvas) {
    canvas = document.createElement('canvas').getContext('2d');
  }
  if (!canvas) {
    throw new Error('Canvas text measurement is unavailable');
  }
  canvas.font = `${size}px ${wallTypography.family}`;
  return canvas.measureText(text);
}
