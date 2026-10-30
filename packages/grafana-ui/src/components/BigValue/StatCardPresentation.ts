import { createContext, CSSProperties } from 'react';

/** An opt-in skin for the native Stat renderer, independent of other visualizations. */
export interface StatCardPresentation {
  foreground: string;
  muted: string;
  surface: string;
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
}

export const StatCardPresentationContext = createContext<StatCardPresentation | undefined>(undefined);

export interface StatCardStyleOptions {
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
  const kind = hasBackground ? 'plain' : isMapped ? 'status' : isEmpty ? 'empty' : 'metric';
  const color = options.color ?? tokens.muted;
  const inset = width < 110 ? 10 : 16;
  const valueSize =
    options.explicitValueSize ??
    Math.min(options.valueSize, isMapped || isEmpty ? tokens.statusSize : tokens.valueSize);

  const panel: CSSProperties = {
    fontFamily: tokens.fontFamily,
    padding: `${height < 90 ? 8 : 12}px ${inset}px`,
    alignItems: 'flex-start',
    justifyContent: 'center',
    textAlign: 'left',
    borderRadius: tokens.radius,
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
    ...(hasBackground ? {} : { color: tokens.muted }),
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
    ...(hasBackground ? {} : { color: isMapped && isColored ? color : isEmpty ? tokens.muted : tokens.foreground }),
  };
  return { panel, stack, label, value, kind, indicator: !hasBackground && isColored && !isEmpty };
}
