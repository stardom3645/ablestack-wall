import { ReactNode, useMemo } from 'react';

import { PanelLayoutGrid } from './PanelLayoutGrid';
import { defaultKpiLayout, KpiPosition, validateKpiLayout } from './kpiLayout';
import { WorkspacePanel } from './model';

/** Preserve the existing four-KPI storage key and coordinate contract. */
export function KpiLayoutPilot<T>(props: {
  panels: Array<WorkspacePanel<T>>;
  storageKey?: string;
  original: ReactNode;
  requested?: boolean;
  onModeChange?: (editing: boolean) => void;
  renderPanel: (panel: WorkspacePanel<T>) => ReactNode;
  renderActions?: (panel: WorkspacePanel<T>) => ReactNode;
  draftCache?: Map<string, KpiPosition[]>;
}) {
  const initialLayout = useMemo(defaultKpiLayout, []);
  return <PanelLayoutGrid {...props} initialLayout={initialLayout} validate={validateKpiLayout} />;
}
