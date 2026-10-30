import { CSSProperties } from 'react';

/** Representative dashboard only: DOM cards and native presentation share this contract. */
export const wallSurfaceTokens = {
  radius: 8,
  selectionStroke: 2,
  padding: 16,
  compactPadding: 8,
  contentGap: 8,
  cardGap: 12,
  sectionGap: 24,
  headerHeight: 44,
  shadow: 'none',
  // Keep legacy visualization surface/border/shadow stable: charts consume them.
  light: {
    surface: '#ffffff',
    border: '#cbd5e1',
    canvas: '#f2f5f9',
    panelText: '#142239',
    panelMuted: '#5d6e86',
    cardBorder: '#c3cfdd',
    hoverBorder: '#adbbce',
    cardShadow: '0 1px 3px rgb(16 24 40 / 5%)',
    hoverShadow: '0 2px 4px rgb(16 24 40 / 7%)',
    selectedShadow: '0 2px 5px rgb(16 24 40 / 9%)',
  },
  dark: {
    surface: '#1c2635',
    border: '#45566f',
    canvas: '#121a27',
    panelText: '#f1f5fa',
    panelMuted: '#b5c2d5',
    cardBorder: '#4c5e78',
    hoverBorder: '#60748f',
    cardShadow: '0 1px 3px rgb(0 0 0 / 18%)',
    hoverShadow: '0 2px 4px rgb(0 0 0 / 22%)',
    selectedShadow: '0 2px 5px rgb(0 0 0 / 26%)',
  },
} as const;

export function wallSurfaceVariables(isDark: boolean): CSSProperties {
  const colors = isDark ? wallSurfaceTokens.dark : wallSurfaceTokens.light;
  return {
    '--wall-radius': `${wallSurfaceTokens.radius}px`,
    '--wall-selection-stroke': `${wallSurfaceTokens.selectionStroke}px`,
    '--wall-border': colors.border,
    '--wall-shadow': wallSurfaceTokens.shadow,
    '--wall-bg': colors.canvas,
    '--wall-panel-text': colors.panelText,
    '--wall-panel-muted': colors.panelMuted,
    '--wall-card-border': colors.cardBorder,
    '--wall-card-border-hover': colors.hoverBorder,
    '--wall-card-shadow': colors.cardShadow,
    '--wall-card-shadow-hover': colors.hoverShadow,
    '--wall-card-shadow-selected': colors.selectedShadow,
    '--wall-card-padding': `${wallSurfaceTokens.padding}px`,
    '--wall-card-padding-compact': `${wallSurfaceTokens.compactPadding}px`,
    '--wall-card-content-gap': `${wallSurfaceTokens.contentGap}px`,
    '--wall-editor-heading-height': `${wallSurfaceTokens.headerHeight}px`,
    '--wall-card-gap': `${wallSurfaceTokens.cardGap}px`,
    '--wall-section-gap': `${wallSurfaceTokens.sectionGap}px`,
  } as CSSProperties;
}

/** Panel command surface, scoped to the representative Workspace. */
export const wallCommandTokens = { width: 240, height: 252, radius: 12, itemHeight: 32, icon: 15 } as const;
export function wallCommandVariables(isDark: boolean, height: number = wallCommandTokens.height): CSSProperties {
  const colors = isDark ? wallSurfaceTokens.dark : wallSurfaceTokens.light;
  return {
    '--wall-command-width': `${wallCommandTokens.width}px`,
    '--wall-command-height': `${height}px`,
    '--wall-command-radius': `${wallCommandTokens.radius}px`,
    '--wall-command-item-height': `${wallCommandTokens.itemHeight}px`,
    '--wall-command-border': colors.cardBorder,
    '--wall-command-danger': isDark ? '#fda4af' : '#c24149',
    '--wall-command-hover': isDark ? '#28364a' : '#f1f5f9',
    '--wall-command-shadow': isDark ? '0 6px 18px rgb(0 0 0 / 24%)' : '0 6px 18px rgb(16 24 40 / 12%)',
  } as CSSProperties;
}
