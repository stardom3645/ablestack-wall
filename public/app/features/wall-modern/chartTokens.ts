import { GrafanaTheme2 } from '@grafana/data';
import { TimeSeriesPresentation } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';

import { STORAGE_VM_DASHBOARD_UID } from './statPresentation';
import { wallSurfaceTokens } from './surfaceTokens';
import { wallTypography } from './typography';
import { wallVisualization } from './visualization';

/** Wall's time-series design settings live here, independently of saved dashboard options. */
export function wallTimeSeriesTokens(theme: GrafanaTheme2): TimeSeriesPresentation {
  return {
    ...wallVisualization(theme, wallTypography.family),
    palette: theme.isDark
      ? ['#7ca2ff', '#42cbb1', '#b394f6', '#f0b766', '#ef88a9', '#66b8e3', '#a6b5cc', '#b2cb74']
      : ['#3c63e6', '#0d8879', '#8250df', '#b36816', '#ce4072', '#147eaf', '#5f6f88', '#6a7e30'],
    lineWidth: 2,
    linePixelAlign: false,
    fillOpacity: 9,
    pointSize: 3,
    hoverPointSize: 6,
    axisFontSize: wallTypography.roles.axis.size,
    axisFontWeight: wallTypography.roles.axis.weight,
    axisGap: 7,
    plotPaddingRight: wallTypography.roles.axis.size * 2,
    grid: theme.isDark ? 'rgba(160,175,196,0.13)' : 'rgba(113,128,153,0.12)',
    gridDash: [3, 4],
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
    tooltipPadding: wallSurfaceTokens.padding,
    tooltipRowGap: 8,
    tooltipValueWeight: wallTypography.roles.panel.weight,
    tooltipMaxWidth: 480,
    tooltipHeaderBackground: theme.isDark ? '#223045' : '#f8faff',
    radius: wallSurfaceTokens.radius,
  };
}

export function isWallTimeSeriesRoute(pathname: string, search = '') {
  const params = new URLSearchParams(search);
  return (
    /^\/d\/[^/]+(?:\/[^/]+)?\/?$/.test(pathname) &&
    pathname.split('/')[2] === STORAGE_VM_DASHBOARD_UID &&
    !['editPanel', 'editview'].some((key) => params.has(key))
  );
}
