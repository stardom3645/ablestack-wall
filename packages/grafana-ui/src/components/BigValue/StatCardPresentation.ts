import { createContext, CSSProperties, ReactNode } from 'react';

import type { DisplayValueAlignmentFactors, FieldDisplay, FormattedValue } from '@grafana/data';

import type { VizRepeaterGrid } from '../VizRepeater/VizRepeater';

export type StatPresentationStyle = 'legacy' | 'soft' | 'minimal';

/** Missing and unrecognized styles preserve saved Grafana color modes. */
export function statPresentationStyle(value?: string): StatPresentationStyle {
  return value === 'soft' || value === 'minimal' ? value : 'legacy';
}

export interface StatLayoutOptions {
  wallStatStyle?: StatPresentationStyle;
  textMode?: string;
  graphMode?: string;
  colorMode?: string;
  showPercentChange?: boolean;
  text?: { valueSize?: number; titleSize?: number };
}

/** An opt-in skin for the native Stat renderer, independent of other visualizations. */
export interface StatCardPresentation {
  foreground: string;
  muted: string;
  surface: string;
  softSurface?: string;
  border: string;
  shadow: string;
  radius: number;
  valueSize: number;
  statusSize: number;
  labelSize: number;
  fontFamily?: string;
  valueWeight?: number;
  statusWeight?: number;
  labelWeight?: number;
  valueLineHeight?: number;
  labelLineHeight?: number;
  valueTracking?: string;
  unitSize?: number;
  unitWeight?: number;
  statusLineHeight?: number;
  compactVerticalPadding?: number;
  minimumItemWidth?: number;
  minimumItemHeight?: number;
  itemGap?: number;
  fontLoadRevision?: string;
  getGridDimensions?: (
    values: FieldDisplay[],
    width: number,
    height: number,
    spacing: number,
    options: StatLayoutOptions
  ) => VizRepeaterGrid | undefined;
  /** Application-owned value hierarchy; native formatting, links and chart rendering stay upstream. */
  renderContent?: (props: StatContentProps) => ReactNode;
}

export interface StatContentProps {
  /** Native reducer output count, not the number of query frames. */
  singleValue?: boolean;
  foreground?: string;
  /** Native BigValue auto-fit, refined with the actual application font. */
  autoValueSize?: number;
  presentationStyle?: StatPresentationStyle;
  surfaceStyle?: CSSProperties;
  contentInset?: number;
  layout?: 'inline';
  nameOnly?: boolean;
  textual?: boolean;
  value: FormattedValue & { title?: string; numeric?: number };
  alignmentFactors?: DisplayValueAlignmentFactors;
  width: number;
  height: number;
  valueStyle: CSSProperties;
  labelStyle: CSSProperties;
  explicitValueSize?: number;
  explicitLabelSize?: number;
  kind: 'plain' | 'status' | 'empty' | 'metric';
  indicator: boolean;
  indicatorSpace: boolean;
  color?: string;
  centered: boolean;
  chart: ReactNode;
  chartWidth: number;
  chartHeight: number;
  percentChange: ReactNode;
}

export const StatCardPresentationContext = createContext<StatCardPresentation | undefined>(undefined);

export interface StatCardStyleOptions {
  presentationStyle?: StatPresentationStyle;
  width: number;
  height: number;
  valueSize: number;
  labelSize: number;
  fontFamily?: string;
  valueWeight?: number;
  statusWeight?: number;
  labelWeight?: number;
  valueLineHeight?: number;
  labelLineHeight?: number;
  valueTracking?: string;
  unitSize?: number;
  unitWeight?: number;
  statusLineHeight?: number;
  explicitValueSize?: number;
  explicitLabelSize?: number;
  isMapped: boolean;
  isColored: boolean;
  hasBackground: boolean;
  isEmpty: boolean;
  color?: string;
}

/** Use the native fit calculation and formatted value; this only supplies styles. */
export function getStatCardPresentation(tokens: StatCardPresentation, options: StatCardStyleOptions) {
  const { width, height, isMapped, hasBackground, isColored, isEmpty } = options;
  const style = statPresentationStyle(options.presentationStyle);
  const modern = style !== 'legacy';
  const kind: StatContentProps['kind'] = hasBackground ? 'plain' : isMapped ? 'status' : isEmpty ? 'empty' : 'metric';
  const color = options.color ?? tokens.muted;
  const inset = width < 110 ? 10 : 16;
  const valueSize =
    options.explicitValueSize ??
    Math.min(options.valueSize, isMapped || isEmpty ? tokens.statusSize : tokens.valueSize);

  const verticalInset = height < 90 ? (tokens.compactVerticalPadding ?? 8) : 12;
  const panel: CSSProperties = {
    fontFamily: tokens.fontFamily,
    padding: `${verticalInset}px ${inset}px`,
    alignItems: 'flex-start',
    justifyContent: 'center',
    textAlign: 'left',
    borderRadius: tokens.radius,
    ...(modern
      ? {
          background: 'transparent',
          boxShadow: 'none',
          color: tokens.foreground,
        }
      : {}),
  };
  const stack: CSSProperties = {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    flexGrow: 1,
    gap: 6,
    minWidth: 0,
  };
  const label: CSSProperties = {
    fontSize: options.explicitLabelSize ?? Math.min(options.labelSize, tokens.labelSize),
    fontWeight: tokens.labelWeight ?? 500,
    lineHeight: tokens.labelLineHeight ?? 1.4,
    ...(hasBackground && !modern ? {} : { color: tokens.muted }),
  };
  const value: CSSProperties & { '--wall-stat-state': string; '--wall-stat-muted': string } = {
    '--wall-stat-state': color,
    '--wall-stat-muted': tokens.muted,
    fontSize: valueSize,
    fontWeight: isMapped ? (tokens.statusWeight ?? 600) : (tokens.valueWeight ?? 700),
    lineHeight: (isMapped ? tokens.statusLineHeight : tokens.valueLineHeight) ?? 1.15,
    letterSpacing: isMapped ? '0.01em' : (tokens.valueTracking ?? '-0.04em'),
    textAlign: 'left',
    fontVariantNumeric: 'tabular-nums',
    ...(hasBackground && !modern
      ? {}
      : { color: isEmpty ? tokens.muted : modern ? tokens.foreground : isColored ? color : tokens.foreground }),
  };
  const surfaceStyle: CSSProperties | undefined =
    style === 'soft'
      ? {
          background: tokens.softSurface ?? tokens.surface,
          boxShadow: `inset 0 0 0 1px ${tokens.border}`,
          borderRadius: tokens.radius,
        }
      : undefined;
  return {
    panel,
    stack,
    label,
    value,
    inset,
    verticalInset,
    kind,
    surfaceStyle,
    indicator: (modern || !hasBackground) && isColored && !isEmpty,
  };
}
