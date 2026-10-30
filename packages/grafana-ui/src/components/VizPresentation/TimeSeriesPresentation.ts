import { CSSObject } from '@emotion/react';
import { createContext } from 'react';

import { VizPresentation } from './VizPresentation';

/** Configuration is read only by TimeSeriesPanel; effective styling never leaks into other panel types. */
export interface TimeSeriesPresentation extends VizPresentation {
  palette: string[];
  lineWidth: number;
  linePixelAlign: boolean;
  fillOpacity: number;
  pointSize: number;
  hoverPointSize: number;
  axisFontSize: number;
  axisFontWeight?: number;
  plotPaddingRight?: number;
  axisGap: number;
  gridDash: number[];
  crosshairColor: string;
  legendFontSize: number;
  legendFontWeight?: number;
  legendLineHeight?: number;
  legendHeaderWeight?: number;
  tooltipFontWeight?: number;
  tooltipLineHeight?: number;
  legendHeaderSize: number;
  legendGap: number;
  legendCellPadding: string;
  tooltipFontSize: number;
  tooltipPadding: number;
  tooltipRowGap: number;
  tooltipValueWeight: number;
  tooltipMaxWidth: number;
  tooltipHeaderBackground: string;
}

export const TimeSeriesStyleConfigContext = createContext<TimeSeriesPresentation | undefined>(undefined);
export const TimeSeriesPresentationContext = createContext<TimeSeriesPresentation | undefined>(undefined);

export function timeSeriesPlotStyles(tokens: TimeSeriesPresentation): CSSObject {
  return {
    width: '100%',
    height: '100%',
    minWidth: 0,
    '.u-cursor-x': { borderRightColor: tokens.crosshairColor, borderRightStyle: 'dashed' },
    '.u-cursor-y': { borderBottomColor: tokens.crosshairColor, borderBottomStyle: 'dashed' },
  };
}

export function timeSeriesLegendStyles(tokens: TimeSeriesPresentation): CSSObject {
  return {
    '&&': {
      fontFamily: tokens.fontFamily,
      fontSize: tokens.legendFontSize,
      fontWeight: tokens.legendFontWeight,
      lineHeight: tokens.legendLineHeight ? `${tokens.legendLineHeight}px` : undefined,
      color: tokens.muted,
      fontVariantNumeric: 'tabular-nums',
    },
    '&& th': {
      fontSize: tokens.legendHeaderSize,
      color: tokens.muted,
      fontWeight: tokens.legendHeaderWeight ?? 500,
      padding: tokens.legendCellPadding,
      borderBottom: `1px solid ${tokens.border}`,
    },
    '&& td': { padding: tokens.legendCellPadding, fontSize: tokens.legendFontSize },
    '&& tbody tr': { borderBottom: 0 },
    '&& tbody tr:hover': { background: tokens.tooltipHeaderBackground },
    '&& button': { fontSize: 'inherit', borderRadius: tokens.radius / 2 },
    '&& li': { marginRight: tokens.legendGap },
  };
}

export function timeSeriesTooltipSurface(tokens: TimeSeriesPresentation, maxWidth?: number): CSSObject {
  return {
    background: tokens.surface,
    color: tokens.text,
    border: `1px solid ${tokens.border}`,
    borderRadius: tokens.radius,
    boxShadow: tokens.shadow,
    fontFamily: tokens.fontFamily,
    fontSize: tokens.tooltipFontSize,
    fontWeight: tokens.tooltipFontWeight,
    lineHeight: tokens.tooltipLineHeight ? `${tokens.tooltipLineHeight}px` : undefined,
    fontVariantNumeric: 'tabular-nums',
    padding: 0,
    maxWidth: maxWidth ?? tokens.tooltipMaxWidth,
  };
}

export function timeSeriesTooltipContent(tokens: TimeSeriesPresentation): CSSObject {
  return {
    minWidth: 0,
    fontFamily: tokens.fontFamily,
    fontSize: tokens.tooltipFontSize,
    fontWeight: tokens.tooltipFontWeight,
    lineHeight: tokens.tooltipLineHeight ? `${tokens.tooltipLineHeight}px` : undefined,
    '[data-wall-chart-slot="tooltip-heading"] > div': {
      padding: tokens.tooltipPadding,
      color: tokens.muted,
      background: tokens.tooltipHeaderBackground,
      borderRadius: `${tokens.radius}px ${tokens.radius}px 0 0`,
    },
    '[data-wall-chart-slot="tooltip-rows"] > div': {
      borderTop: `1px solid ${tokens.border}`,
      padding: tokens.tooltipPadding,
      gap: tokens.tooltipRowGap,
    },
    '[data-wall-chart-slot="tooltip-rows"] > div > div': {
      minWidth: 0,
      alignItems: 'center',
      gap: tokens.legendGap,
    },
    '[data-wall-chart-slot="tooltip-rows"] > div > div > div:first-child': {
      flex: '1 1 auto',
      minWidth: 0,
      '& > div:last-child': { minWidth: 0, whiteSpace: 'normal', overflowWrap: 'anywhere' },
    },
    '[data-wall-chart-slot="tooltip-rows"] > div > div > div:last-child': {
      flex: '0 0 auto',
      fontWeight: tokens.tooltipValueWeight,
      color: tokens.text,
    },
  };
}
