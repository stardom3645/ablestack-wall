import {
  DataFrame,
  Field,
  FieldColorModeId,
  FieldConfigSource,
  FieldType,
  getDisplayProcessor,
  getFieldMatcher,
  getFieldSeriesColor,
  GrafanaTheme2,
} from '@grafana/data';
import { GraphDrawStyle, GraphFieldConfig, GraphGradientMode, StackingMode, VisibilityMode } from '@grafana/schema';
import { TimeSeriesPresentation } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';

import { canUseWallSeriesPalette } from './colorSystem';

function protectedProperties(field: Field, frame: DataFrame, frames: DataFrame[], config: FieldConfigSource) {
  return new Set([
    ...Object.entries(config.defaults.custom ?? {})
      .filter(([, value]) => value != null)
      .map(([key]) => `custom.${key}`),
    ...config.overrides.flatMap((override) =>
      getFieldMatcher(override.matcher)(field, frame, frames) ? override.properties.map((property) => property.id) : []
    ),
  ]);
}

/** Copy presentation only. Preserve original data vectors, model configs, links, nulls and semantic encodings. */
export function presentTimeSeriesFrames(
  frames: DataFrame[],
  config: FieldConfigSource,
  theme: GrafanaTheme2,
  tokens: TimeSeriesPresentation
): DataFrame[] {
  const visibleLines = frames.reduce(
    (count, frame) =>
      count +
      frame.fields.filter(
        (field) =>
          field.type === FieldType.number &&
          !field.config.custom?.hideFrom?.viz &&
          (field.config.custom?.drawStyle ?? GraphDrawStyle.Line) === GraphDrawStyle.Line
      ).length,
    0
  );
  const autoFillOpacity = Math.max(1, tokens.fillOpacity / Math.sqrt(Math.max(1, visibleLines)));
  const paletteTheme = { ...theme, visualization: { ...theme.visualization, palette: tokens.palette } };
  return frames.map((frame) => ({
    ...frame,
    fields: frame.fields.map((field) => {
      if (field.type !== FieldType.number) {
        return field;
      }
      const protectedIds = protectedProperties(field, frame, frames, config);
      const original: GraphFieldConfig = field.config.custom ?? {};
      const custom = { ...original };
      const canUsePalette = canUseWallSeriesPalette(field, protectedIds.has('color'));
      const color = canUsePalette
        ? { mode: FieldColorModeId.Fixed, fixedColor: getFieldSeriesColor(field, paletteTheme).color }
        : field.config.color;
      if ((custom.drawStyle ?? GraphDrawStyle.Line) === GraphDrawStyle.Line) {
        // The native path builder defaults to Linear; keep saved interpolation untouched.
        if (!protectedIds.has('custom.lineWidth') && (custom.lineWidth == null || custom.lineWidth === 1)) {
          custom.lineWidth = tokens.lineWidth;
        }
        // Keep explicitly requested markers, points-only plots, and native isolated-point handling across gaps.
        if (
          custom.lineWidth !== 0 &&
          !protectedIds.has('custom.showPoints') &&
          (custom.showPoints == null || custom.showPoints === VisibilityMode.Auto)
        ) {
          custom.showPoints = VisibilityMode.Never;
          if (!protectedIds.has('custom.pointSize')) {
            custom.pointSize = tokens.pointSize;
          }
        }
        const semanticFill =
          original.fillColor ||
          original.fillBelowTo ||
          original.gradientMode === GraphGradientMode.Scheme ||
          original.gradientMode === GraphGradientMode.Hue ||
          (original.stacking && original.stacking.mode !== StackingMode.None);
        if (
          !semanticFill &&
          !protectedIds.has('custom.fillOpacity') &&
          !protectedIds.has('custom.gradientMode') &&
          (custom.fillOpacity ?? 0) > 0
        ) {
          custom.fillOpacity = Math.min(custom.fillOpacity!, autoFillOpacity);
          custom.gradientMode = GraphGradientMode.Opacity;
        }
      }
      const copy = { ...field, config: { ...field.config, color, custom } };
      if (canUsePalette) {
        copy.display = getDisplayProcessor({ field: copy, theme });
      }
      return copy;
    }),
  }));
}
