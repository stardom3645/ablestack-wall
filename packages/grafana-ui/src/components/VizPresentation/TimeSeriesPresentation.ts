import { CSSObject } from '@emotion/react';
import { createContext, type ReactElement } from 'react';

import type { LegendProps, VizLegendItem } from '../VizLegend/types';

import { VizPresentation } from './VizPresentation';

/** Configuration is read only by TimeSeriesPanel; effective styling never leaks into other panel types. */
export interface TimeSeriesPresentation extends VizPresentation {
  renderLegend?: (props: LegendProps) => ReactElement;
  legendAutoMinWidth?: number;
  renderLegendItem?: (props: TimeSeriesLegendItemProps) => ReactElement;
  palette: string[];
  lineWidth: number;
  refinedInteractions?: boolean;
  focusAlpha?: number;
  markerStrokeWidth?: number;
  tooltipMaxHeight?: number;
  tooltipMinHeight?: number;
  tooltipVisibleRows?: number;
  tooltipOffset?: number;
  tooltipViewportMargin?: number;
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

export type TimeSeriesLegendItemProps = Pick<
  LegendProps,
  'displayMode' | 'onLabelClick' | 'onLabelMouseOver' | 'onLabelMouseOut' | 'readonly'
> & { item: VizLegendItem };

export const TimeSeriesStyleConfigContext = createContext<TimeSeriesPresentation | undefined>(undefined);
export const TimeSeriesPresentationContext = createContext<TimeSeriesPresentation | undefined>(undefined);

export function timeSeriesPlotStyles(tokens: TimeSeriesPresentation): CSSObject {
  return {
    width: '100%',
    height: '100%',
    minWidth: 0,
    '.u-cursor-x': {
      borderRightColor: tokens.crosshairColor,
      borderRightStyle: tokens.refinedInteractions ? 'solid' : 'dashed',
      borderRightWidth: 1,
    },
    '.u-cursor-y': {
      borderBottomColor: tokens.crosshairColor,
      borderBottomStyle: tokens.refinedInteractions ? 'solid' : 'dashed',
      borderBottomWidth: 1,
    },
    '.uplot[data-wall-cursor-follower="true"] .u-cursor-x': { borderRightStyle: 'dashed' },
    '.uplot[data-wall-cursor-follower="true"] .u-cursor-y, .uplot[data-wall-cursor-follower="true"] .u-cursor-pt': {
      display: 'none',
    },
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
    ...(tokens.refinedInteractions
      ? {
          maxHeight: 'var(--wall-tooltip-available-height, calc(100dvh - 16px))',
          opacity: 1,
          transition: 'opacity var(--wall-motion-enter-duration) var(--wall-motion-enter-easing)',
          '@starting-style': { opacity: 0 },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }
      : {}),
    maxWidth: `min(${maxWidth ?? tokens.tooltipMaxWidth}px, calc(100vw - ${tokens.tooltipPadding * 2}px))`,
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
