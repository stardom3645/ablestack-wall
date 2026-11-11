import { LoadingState, PanelData } from '@grafana/data';

import { wallSurfaceTokens } from '../surfaceTokens';

/** Read-only projection: never infer semantics from a dashboard UID, title or panel ID. */
export function panelHeaderHeight(pluginId: string, height?: number) {
  if (height !== undefined && height < wallSurfaceTokens.compactPanelHeight) {
    return wallSurfaceTokens.compactHeaderHeight;
  }
  return ['stat', 'gauge', 'bargauge'].includes(pluginId)
    ? wallSurfaceTokens.metricHeaderHeight
    : wallSurfaceTokens.headerHeight;
}

export function panelContentPadding(pluginId: string, noPadding?: boolean) {
  // Metric renderers and virtualized tables already own their inner padding.
  const inset =
    noPadding || ['stat', 'gauge', 'bargauge', 'table', 'logs'].includes(pluginId) ? 0 : wallSurfaceTokens.padding;
  return { horizontal: inset, vertical: inset };
}

export type PanelDisplayState = 'loading' | 'empty' | 'error' | undefined;
export function panelDisplayState(data?: PanelData, skipDataQuery?: boolean): PanelDisplayState {
  if (skipDataQuery || data?.series.some((frame) => frame.length > 0)) {
    return undefined;
  }
  if (data?.state === LoadingState.Error) {
    return 'error';
  }
  if (!data || data.state === LoadingState.Loading || data.state === LoadingState.NotStarted) {
    return 'loading';
  }
  return data.state === LoadingState.Done ? 'empty' : undefined;
}
