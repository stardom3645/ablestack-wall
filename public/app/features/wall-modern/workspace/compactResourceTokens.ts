import { CSSProperties } from 'react';

import { wallSurfaceTokens } from '../surfaceTokens';

/** Presentation dimensions for the overview's four KPIs and three resource usage rows only. */
export const compactResourceTokens = {
  kpi: {
    minWidth: 220,
    width: 260,
    height: 96,
    headerHeight: 32,
    padding: wallSurfaceTokens.padding,
    gap: wallSurfaceTokens.cardGap,
  },
  usage: { height: 64, trackHeight: 5 },
} as const;

export const compactResourceVariables = {
  '--wall-kpi-min-width': `${compactResourceTokens.kpi.minWidth}px`,
  '--wall-kpi-width': `${compactResourceTokens.kpi.width}px`,
  '--wall-kpi-padding': `${compactResourceTokens.kpi.padding}px`,
  '--wall-kpi-gap': `${compactResourceTokens.kpi.gap}px`,
  '--wall-usage-track-height': `${compactResourceTokens.usage.trackHeight}px`,
} as CSSProperties;
