import { useLayoutEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { locationService } from '@grafana/runtime';
import { SceneGridRow, SceneObject, VizPanel } from '@grafana/scenes';
import { contextSrv } from 'app/core/services/context_srv';
import { DashboardGridItem } from 'app/features/dashboard-scene/scene/DashboardGridItem';
import { DefaultGridLayoutManager } from 'app/features/dashboard-scene/scene/layout-default/DefaultGridLayoutManager';
import { getDashboardSceneFor, getPanelIdForVizPanel } from 'app/features/dashboard-scene/utils/utils';

import { WallPanelContentContext } from '../visualizations/WallPanelContent';
import { displayKinds } from '../visualizations/model';

import { DashboardWorkspace } from './DashboardWorkspace';
import { WallPanelActions } from './WallPanelActions';
import { selectedWorkspaceTab, WorkspaceGroup, WorkspacePanel } from './model';

/** Project the native data tree into Wall; query runners, IDs and native gridPos stay intact. */
export function getWorkspaceGroups(
  layout: DefaultGridLayoutManager,
  sources: Record<number, number> = {}
): Array<WorkspaceGroup<VizPanel>> {
  const panel = (item: DashboardGridItem): WorkspacePanel<VizPanel> => ({
    id: getPanelIdForVizPanel(item.state.body),
    title: item.state.body.state.title,
    presentationId: sources[getPanelIdForVizPanel(item.state.body)],
    type: item.state.body.state.pluginId,
    width: item.state.width ?? 12,
    height: item.state.height ?? 8,
    model: item.state.body,
  });
  return layout.state.grid.state.children.map((item) =>
    item instanceof SceneGridRow
      ? {
          rowId: getPanelIdForVizPanel(item),
          panels: item.state.children
            .filter((child): child is DashboardGridItem => child instanceof DashboardGridItem)
            .map(panel),
        }
      : { rowId: 0, panels: item instanceof DashboardGridItem ? [panel(item)] : [] }
  );
}

/** Own a reference for each ancestor even when the child Scene component is already active. */
export function activateWorkspaceParents(model: SceneObject) {
  const parents: SceneObject[] = [];
  for (let parent = model.parent; parent; parent = parent.parent) {
    parents.unshift(parent);
  }
  const cancel = parents.map((parent) => parent.activate());
  return () => cancel.reverse().forEach((stop) => stop());
}

function NativeWorkspacePanel({
  model,
  presentationId,
  onHeight,
}: {
  model: VizPanel;
  presentationId?: number;
  onHeight: (id: number, height: number) => void;
}) {
  const id = getPanelIdForVizPanel(model);
  const reportHeight = useCallback((height: number) => onHeight(id, height), [id, onHeight]);
  // Parent activation must precede the child wrapper's passive activation effect.
  useLayoutEffect(() => activateWorkspaceParents(model), [model]);
  return (
    <WallPanelContentContext.Provider
      value={
        displayKinds[presentationId ?? id]
          ? { kind: displayKinds[presentationId ?? id], onHeight: reportHeight }
          : undefined
      }
    >
      <model.Component model={model} />
    </WallPanelContentContext.Provider>
  );
}

export function StorageDashboardWorkspace({ layout }: { layout: DefaultGridLayoutManager }) {
  const dashboard = getDashboardSceneFor(layout);
  dashboard.useState();
  const user = contextSrv.user;
  const kpiLayoutStorageKey = `wall-modern:kpi-layout:v1:${dashboard.state.uid}:${user.orgId}:${user.id}`;
  const [panelHeights, setPanelHeights] = useState<Record<number, number>>({});
  const onHeight = useCallback(
    (id: number, height: number) =>
      setPanelHeights((current) => (current[id] === height ? current : { ...current, [id]: height })),
    []
  );
  layout.useState();
  layout.state.grid.useState();
  const location = useLocation();
  return (
    <DashboardWorkspace
      groups={getWorkspaceGroups(layout, dashboard.state.wallModern?.panelSources)}
      panelHeights={panelHeights}
      kpiLayoutStorageKey={kpiLayoutStorageKey}
      activeTab={selectedWorkspaceTab(location.search)}
      onTabChange={(value) => locationService.partial({ wallTab: value === 'overview' ? null : value }, true)}
      renderPanelActions={(panel) => (
        <WallPanelActions
          panel={panel.model}
          synchronize={(href) => {
            // Commit native view state in the same event before Workspace providers unmount.
            // The original URL, query runner and native ViewPanelScene remain authoritative.
            const params = new URLSearchParams(href.split('?')[1]);
            if (params.has('viewPanel') || params.has('editPanel')) {
              dashboard.urlSync?.updateFromUrl({
                viewPanel: params.get('viewPanel') ?? null,
                editPanel: params.get('editPanel') ?? null,
              });
            }
          }}
        />
      )}
      renderPanel={(panel) => (
        <NativeWorkspacePanel model={panel.model} presentationId={panel.presentationId} onHeight={onHeight} />
      )}
    />
  );
}
