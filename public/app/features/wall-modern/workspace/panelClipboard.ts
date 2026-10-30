import { cloneDeep } from 'lodash';

import { SceneGridRow, VizPanel } from '@grafana/scenes';
import { PanelModel } from 'app/features/dashboard/state';
import { getDashboardChangesFromScene } from 'app/features/dashboard-scene/saving/getDashboardChangesFromScene';
import { DashboardGridItem } from 'app/features/dashboard-scene/scene/DashboardGridItem';
import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';
import { DefaultGridLayoutManager } from 'app/features/dashboard-scene/scene/layout-default/DefaultGridLayoutManager';
import { buildGridItemForPanel } from 'app/features/dashboard-scene/serialization/transformSaveModelToScene';
import { gridItemToPanel } from 'app/features/dashboard-scene/serialization/transformSceneToSaveModel';
import { dashboardSceneGraph } from 'app/features/dashboard-scene/utils/dashboardSceneGraph';
import { getPanelIdForVizPanel } from 'app/features/dashboard-scene/utils/utils';

import { KpiPosition } from './kpiLayout';
import { LayoutHistory } from './layoutHistory';
import { WorkspaceTab, workspaceTabs } from './model';
import { normalizeWallDocument, wallDocument, WallDocument, wallRegionKey } from './wallDocument';

export interface ClipboardGrid {
  key: string;
  tab: WorkspaceTab;
  positions: () => KpiPosition[];
  selected: () => string[];
  busy: () => boolean;
  root: () => HTMLElement | null;
}
export interface CopiedPanel {
  uid: string;
  json: ReturnType<typeof gridItemToPanel>;
  size: Pick<KpiPosition, 'w' | 'h'>;
  presentationId: number;
}
export function copyPanelSettings(dashboard: DashboardScene, panel: VizPanel, positions: KpiPosition[]): CopiedPanel {
  if (!(panel.parent instanceof DashboardGridItem) || !dashboard.state.uid) {
    throw new Error('복사할 패널을 찾을 수 없습니다.');
  }
  const id = getPanelIdForVizPanel(panel);
  const position = positions.find((entry) => entry.i === String(id));
  if (!position) {
    throw new Error('패널 배치가 준비되지 않았습니다.');
  }
  return {
    uid: dashboard.state.uid,
    json: cloneDeep(gridItemToPanel(panel.parent)),
    size: { w: position.w, h: position.h },
    presentationId: dashboard.state.wallModern?.panelSources?.[id] ?? id,
  };
}

/** Append below the occupied extent. No neighbour is moved or compacted. */
export function pastedPosition(items: KpiPosition[], id: number, size: CopiedPanel['size']): KpiPosition {
  return { i: String(id), x: 0, y: Math.max(0, ...items.map((item) => item.y + item.h)), ...size };
}

/** Same native JSON -> PanelModel -> Scene path as Grafana paste, with an explicit target Row. */
export function pastePanelSettings(
  dashboard: DashboardScene,
  copied: CopiedPanel,
  target: ClipboardGrid,
  document?: WallDocument
) {
  if (copied.uid !== dashboard.state.uid || !(dashboard.state.body instanceof DefaultGridLayoutManager)) {
    return;
  }
  const manager = dashboard.state.body;
  const rowId = workspaceTabs.find((tab) => tab.id === target.tab)!.rowId;
  const row = manager.state.grid.state.children.find(
    (child): child is SceneGridRow => child instanceof SceneGridRow && getPanelIdForVizPanel(child) === rowId
  );
  if (!row) {
    throw new Error('붙여넣을 탭의 원본 Row를 찾을 수 없습니다.');
  }
  const id = dashboardSceneGraph.getNextPanelId(dashboard);
  const region = wallRegionKey(target.key);
  const doc: WallDocument = dashboard.state.wallModern ?? document ?? { version: 1, layouts: {}, texts: {} };
  const nativeIds = new Set(manager.getVizPanels().map((panel) => String(getPanelIdForVizPanel(panel))));
  const live = target.positions().filter((entry) => Number(entry.i) < 0 || nativeIds.has(entry.i));
  const validIds = new Set([
    ...live.map((entry) => entry.i),
    ...row.state.children
      .filter((child): child is DashboardGridItem => child instanceof DashboardGridItem)
      .map((child) => String(getPanelIdForVizPanel(child.state.body))),
  ]);
  const cached = (dashboard.state.wallModern?.layouts[region] ?? []).filter((entry) => validIds.has(entry.i));
  // A second key event can arrive before React publishes the first new tile.
  // The Scene document is synchronous and reserves that exact occupied space.
  const positions = live.map((entry) => ({ ...(cached.find((next) => next.i === entry.i) ?? entry) }));
  positions.push(
    ...cached.filter((entry) => !positions.some((next) => next.i === entry.i)).map((entry) => ({ ...entry }))
  );
  const position = pastedPosition(positions, id, copied.size);
  const json = cloneDeep(copied.json);
  json.id = id;
  // Native fallback positions remain 24-column data; exact Wall dimensions live separately.
  if (!json.gridPos) {
    throw new Error('복사한 패널의 원본 Grid 설정이 없습니다.');
  }
  // DashboardModel sorts expanded rows by native y on reload. Anchor the new
  // native model to its Row so it can never spill into the following tab. Wall's
  // independent 48-column position is the authoritative non-overlapping layout.
  json.gridPos = { ...json.gridPos, x: 0, y: row.state.y ?? 0 };
  const item = buildGridItemForPanel(new PanelModel(json));
  dashboard.onEnterEditMode();
  row.setState({ children: [...row.state.children, item] });
  dashboard.setState({
    wallModern: {
      ...doc,
      layouts: { ...doc.layouts, [region]: [...positions, position] },
      panelSources: { ...doc.panelSources, [id]: copied.presentationId },
    },
  });
  manager.state.grid.forceRender();
  dashboard.setState({ isDirty: getDashboardChangesFromScene(dashboard).hasChanges });
  return id;
}

/** One panel insertion is one entry in the existing tab's layout history. */
export function pastePanelWithHistory(
  dashboard: DashboardScene,
  copied: CopiedPanel,
  target: ClipboardGrid,
  document?: WallDocument,
  history?: LayoutHistory
) {
  const region = wallRegionKey(target.key);
  const before: WallDocument = cloneDeep(
    dashboard.state.wallModern ?? document ?? { version: 1, layouts: {}, texts: {} }
  );
  before.layouts[region] ??= cloneDeep(target.positions());
  const id = pastePanelSettings(dashboard, copied, target, document);
  if (id === undefined || !history) {
    return id;
  }
  const after = cloneDeep(dashboard.state.wallModern!);
  const panel = dashboard.state.body.getVizPanels().find((panel) => getPanelIdForVizPanel(panel) === id)!;
  const json = cloneDeep(gridItemToPanel(panel.parent as DashboardGridItem));
  const rowId = workspaceTabs.find((tab) => tab.id === target.tab)!.rowId;
  const apply = (insert: boolean) => {
    if (dashboard.state.kioskMode || !dashboard.canEditDashboard()) {
      return false;
    }
    const manager = dashboard.state.body;
    if (!(manager instanceof DefaultGridLayoutManager)) {
      return false;
    }
    const row = manager.state.grid.state.children.find(
      (child): child is SceneGridRow => child instanceof SceneGridRow && getPanelIdForVizPanel(child) === rowId
    );
    const exists = row?.state.children.some((child) => child.state.key === `grid-item-${id}`);
    if (
      !row ||
      exists === insert ||
      (insert && manager.getVizPanels().some((panel) => getPanelIdForVizPanel(panel) === id))
    ) {
      return false;
    }
    dashboard.onEnterEditMode();
    row.setState({
      children: insert
        ? [...row.state.children, buildGridItemForPanel(new PanelModel(cloneDeep(json)))]
        : row.state.children.filter((child) => child.state.key !== `grid-item-${id}`),
    });
    const current = dashboard.state.wallModern ?? before;
    const sources = { ...current.panelSources };
    if (insert) {
      sources[id] = copied.presentationId;
    } else {
      delete sources[id];
    }
    const next: WallDocument = {
      ...current,
      layouts: { ...current.layouts, [region]: cloneDeep((insert ? after : before).layouts[region]) },
    };
    if (Object.keys(sources).length) {
      next.panelSources = sources;
    } else {
      delete next.panelSources;
    }
    dashboard.setState({
      wallModern: normalizeWallDocument(
        next,
        wallDocument((dashboard.getInitialSaveModel() as { wallModern?: unknown })?.wallModern),
        before
      ),
    });
    manager.state.grid.forceRender();
    dashboard.setState({ isDirty: getDashboardChangesFromScene(dashboard).hasChanges });
    return true;
  };
  history.recordCommand(target.key, { undo: () => apply(false), redo: () => apply(true) });
  return id;
}
