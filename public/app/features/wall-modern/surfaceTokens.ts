import { CSSProperties } from 'react';

import { wallApplicationVariables, wallApplicationTokens } from './applicationTokens';

/** Shared dashboard presentation: DOM cards and native presentation share this contract. */
export const wallSurfaceTokens = {
  radius: 8,
  selectionStroke: 2,
  padding: 16,
  compactPadding: 8,
  contentGap: 8,
  cardGap: 12,
  sectionGap: 24,
  headerHeight: 44,
  metricHeaderHeight: 32,
  compactHeaderHeight: 28,
  compactPanelHeight: 96,
  controlSize: 28,
  moveGripSize: 24,
  controlGap: 4,
  shadow: 'none',
  // Keep legacy visualization surface/border/shadow stable: charts consume them.
  light: {
    surface: '#ffffff',
    soft: '#f8fafc',
    border: '#cbd5e1',
    canvas: '#f2f5f9',
    dashboardBackground: '#f8f9fa',
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
    soft: '#202d3e',
    border: '#45566f',
    canvas: '#121a27',
    dashboardBackground: '#17191e',
    panelText: '#f1f5fa',
    panelMuted: '#b5c2d5',
    cardBorder: '#4c5e78',
    hoverBorder: '#60748f',
    cardShadow: '0 1px 3px rgb(0 0 0 / 18%)',
    hoverShadow: '0 2px 4px rgb(0 0 0 / 22%)',
    selectedShadow: '0 2px 5px rgb(0 0 0 / 26%)',
  },
} as const;

export function wallSurfaceVariables(isDark: boolean, application = false): CSSProperties {
  const colors = isDark ? wallSurfaceTokens.dark : wallSurfaceTokens.light;
  const app = isDark ? wallApplicationTokens.dark : wallApplicationTokens.light;
  return {
    ...wallApplicationVariables(isDark),
    '--wall-surface': app.surface,
    '--wall-soft': app.soft,
    '--wall-text': app.text,
    '--wall-muted': app.muted,
    '--wall-hover': app.hover,
    '--wall-primary': app.primary,
    '--wall-primary-soft': app.active,
    '--wall-panel-control-size': `${wallSurfaceTokens.controlSize}px`,
    '--wall-panel-control-gap': `${wallSurfaceTokens.controlGap}px`,
    '--wall-radius': `${wallSurfaceTokens.radius}px`,
    '--wall-selection-stroke': `${wallSurfaceTokens.selectionStroke}px`,
    '--wall-border': app.border,
    '--wall-shadow': wallSurfaceTokens.shadow,
    '--wall-bg': app.background,
    '--wall-dashboard-bg': colors.dashboardBackground,
    '--wall-state-error': isDark ? '#fda4af' : '#c24149',
    '--wall-panel-text': application ? app.text : colors.panelText,
    '--wall-panel-muted': application ? app.muted : colors.panelMuted,
    '--wall-card-border': application ? app.border : colors.cardBorder,
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
  };
}

/** Panel command surface, scoped to the representative Workspace. */
export const wallCommandTokens = { width: 240, height: 252, radius: 12, itemHeight: 32, icon: 15 } as const;
export function wallCommandVariables(isDark: boolean, height: number = wallCommandTokens.height): CSSProperties {
  const app = isDark ? wallApplicationTokens.dark : wallApplicationTokens.light;
  return {
    '--wall-command-width': `${wallCommandTokens.width}px`,
    '--wall-command-height': `${height}px`,
    '--wall-command-radius': `${wallCommandTokens.radius}px`,
    '--wall-command-item-height': `${wallCommandTokens.itemHeight}px`,
    '--wall-command-border': app.border,
    '--wall-command-danger': isDark ? '#fda4af' : '#c24149',
    '--wall-command-hover': app.hover,
    '--wall-command-shadow': isDark ? '0 6px 18px rgb(0 0 0 / 24%)' : '0 6px 18px rgb(16 24 40 / 12%)',
  };
}

/** Editor geometry only; dashboard card and chart geometry remain unchanged. */
export const wallStudioTokens = {
  inspectorWidth: 416,
  dataWidth: 760,
  previewWidth: 960,
  previewHeight: 420,
  dialogWidth: 980,
  dialogHeight: 700,
  mobilePreviewHeight: 320,
  dataPreviewRatio: 0.5,
  queryPreviewRatio: 0.59,
  queryPreviewMinWidth: 360,
  queryWorkspaceMinWidth: 460,
  queryWorkspaceMobileHeight: 480,
  dataPreviewMinHeight: 230,
  dataEditorMinHeight: 180,
  queryCodeMinHeight: 140,
  queryWorkspaceCodeMinHeight: 320,
  queryCodeExpandedHeight: 480,
} as const;
/** Shared inspector rhythm, independent of dashboard and chart geometry. */
export const wallEditorFormTokens = {
  controlHeight: 32,
  categoryHeight: 44,
  categoryGap: 6,
  fieldGap: 18,
  labelGap: 6,
  contentPadding: 12,
} as const;
export const wallEditorFormVariables: CSSProperties = Object.fromEntries(
  Object.entries(wallEditorFormTokens).map(([key, value]) => [`--wall-editor-form-${key}`, `${value}px`])
);

export const wallStudioVariables: CSSProperties = Object.fromEntries([
  ['--wall-query-workspace-mobile-height', `${wallStudioTokens.queryWorkspaceMobileHeight}px`],
  ['--wall-studio-data-preview-min', `${wallStudioTokens.dataPreviewMinHeight}px`],
  ['--wall-studio-data-editor-min', `${wallStudioTokens.dataEditorMinHeight}px`],
  ['--wall-studio-mobile-preview-height', `${wallStudioTokens.mobilePreviewHeight}px`],
  ['--wall-studio-dialog-width', `${wallStudioTokens.dialogWidth}px`],
  ['--wall-studio-dialog-height', `${wallStudioTokens.dialogHeight}px`],
  ['--wall-studio-inspector-width', `${wallStudioTokens.inspectorWidth}px`],
  ['--wall-studio-data-width', `${wallStudioTokens.dataWidth}px`],
  ['--wall-studio-preview-width', `${wallStudioTokens.previewWidth}px`],
  ['--wall-studio-preview-height', `${wallStudioTokens.previewHeight}px`],
]);
