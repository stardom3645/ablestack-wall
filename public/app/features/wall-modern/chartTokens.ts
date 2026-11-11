import { GrafanaTheme2 } from '@grafana/data';
import { TimeSeriesPresentation } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';

import { wallApplicationTokens } from './applicationTokens';
import { renderWallSeriesLegend } from './charts/WallSeriesLegend';
import { renderWallSeriesLegendItem } from './charts/WallSeriesLegendItem';
import { wallTimeSeriesPalette, wallSeriesPalette } from './colorSystem';
import { isWallDashboardPanelRoute } from './model';
import { wallSurfaceTokens } from './surfaceTokens';
import { wallTypography } from './typography';
import { wallVisualization } from './visualization';

/** Wall's time-series design settings live here, independently of saved dashboard options. */
export function wallTimeSeriesTokens(theme: GrafanaTheme2, refined = true): TimeSeriesPresentation {
  const surface = theme.isDark ? wallApplicationTokens.dark : wallApplicationTokens.light;
  return {
    ...wallVisualization(theme, wallTypography.family),
    refinedInteractions: refined,
    palette: refined ? wallTimeSeriesPalette(theme) : wallSeriesPalette(theme),
    renderLegend: renderWallSeriesLegend,
    legendAutoMinWidth: 900,
    renderLegendItem: renderWallSeriesLegendItem,
    surface: surface.surface,
    text: surface.text,
    muted: surface.muted,
    border: surface.border,
    shadow: surface.shadow,
    lineWidth: refined ? 2 : 1.75,
    focusAlpha: refined ? 0.4 : undefined,
    markerStrokeWidth: refined ? 1.5 : undefined,
    tooltipMaxHeight: refined ? 240 : undefined,
    tooltipVisibleRows: refined ? 3 : undefined,
    tooltipOffset: refined ? 12 : undefined,
    tooltipViewportMargin: refined ? 8 : undefined,
    linePixelAlign: false,
    fillOpacity: refined ? 6 : 9,
    pointSize: 3,
    hoverPointSize: 6,
    axisFontSize: wallTypography.roles.axis.size,
    axisFontWeight: wallTypography.roles.axis.weight,
    axisGap: 7,
    plotPaddingRight: wallTypography.roles.axis.size * 2,
    grid: refined
      ? theme.isDark
        ? 'rgba(160,175,196,0.12)'
        : 'rgba(113,128,153,0.10)'
      : theme.isDark
        ? 'rgba(160,175,196,0.13)'
        : 'rgba(113,128,153,0.12)',
    gridDash: [],
    crosshairColor: theme.isDark ? '#7b8ba4' : '#a7b4ca',
    legendFontSize: wallTypography.roles.legend.size,
    legendFontWeight: wallTypography.roles.legend.weight,
    legendLineHeight: wallTypography.roles.legend.line,
    legendHeaderWeight: wallTypography.roles.caption.weight,
    tooltipFontWeight: wallTypography.roles.tooltip.weight,
    tooltipLineHeight: wallTypography.roles.tooltip.line,
    legendHeaderSize: wallTypography.roles.caption.size,
    legendGap: 12,
    legendCellPadding: '4px 8px',
    tooltipFontSize: wallTypography.roles.tooltip.size,
    tooltipPadding: refined ? wallSurfaceTokens.compactPadding : wallSurfaceTokens.cardGap,
    tooltipRowGap: wallSurfaceTokens.controlGap,
    tooltipValueWeight: wallTypography.roles.panel.weight,
    tooltipMaxWidth: refined ? 320 : 400,
    tooltipHeaderBackground: surface.soft,
    radius: wallSurfaceTokens.radius,
  };
}

export const isWallTimeSeriesRoute = isWallDashboardPanelRoute;
