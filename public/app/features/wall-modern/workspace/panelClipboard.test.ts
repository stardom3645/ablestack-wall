import { fireEvent, render, screen } from '@testing-library/react';
import { createElement, useEffect, useRef } from 'react';

import { locationService } from '@grafana/runtime';
import { SceneGridLayout, SceneGridRow, SceneTimeRange } from '@grafana/scenes';
import { RowPanel } from '@grafana/schema';
import { PanelModel } from 'app/features/dashboard/state';
import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';
import { DefaultGridLayoutManager } from 'app/features/dashboard-scene/scene/layout-default/DefaultGridLayoutManager';
import {
  buildGridItemForPanel,
  transformSaveModelToScene,
} from 'app/features/dashboard-scene/serialization/transformSaveModelToScene';
import {
  gridItemToPanel,
  transformSceneToSaveModel,
} from 'app/features/dashboard-scene/serialization/transformSceneToSaveModel';

import { PanelClipboardProvider, usePanelClipboard, allowsPanelClipboard } from './PanelClipboardContext';
import { createLayoutHistory } from './layoutHistory';
import {
  ClipboardGrid,
  copyPanelSettings,
  pastePanelSettings,
  pastePanelWithHistory,
  pastedPosition,
} from './panelClipboard';

function setup() {
  const source = buildGridItemForPanel(
    new PanelModel({
      id: 28,
      type: 'stat',
      title: '메모리',
      gridPos: { x: 0, y: 1, w: 4, h: 4 },
      datasource: { type: 'prometheus', uid: 'source' },
      targets: [{ refId: 'A', expr: 'node_memory', datasource: { uid: 'source' } }],
      options: { reduceOptions: { calcs: ['lastNotNull'], fields: '', values: false } },
      fieldConfig: {
        defaults: { unit: 'bytes', thresholds: { mode: 'absolute', steps: [{ value: 0, color: 'green' }] } },
        overrides: [{ matcher: { id: 'byName', options: 'A' }, properties: [{ id: 'decimals', value: 2 }] }],
      },
      transformations: [{ id: 'organize', options: { excludeByName: { Time: true } } }],
    })
  );
  const overview = new SceneGridRow({ key: 'panel-24', title: '개요', children: [source] });
  const network = new SceneGridRow({ key: 'panel-178', title: '네트워크', y: 100, children: [] });
  const scene = new DashboardScene({
    uid: 'aec03x1adsi68f',
    wallModern: undefined,
    isDirty: false,
    title: 'Wall',
    meta: { canEdit: true, canSave: true },
    $timeRange: new SceneTimeRange({}),
    body: new DefaultGridLayoutManager({ grid: new SceneGridLayout({ children: [overview, network] }) }),
  });
  scene.setInitialSaveModel(transformSceneToSaveModel(scene));
  let positions = [{ i: '28', x: 1, y: 30, w: 11, h: 57 }];
  const target: ClipboardGrid = {
    key: ':tab:overview:free-layout',
    tab: 'overview',
    positions: () => positions,
    selected: () => ['28'],
    busy: () => false,
    root: () => null,
  };
  return {
    scene,
    source,
    overview,
    network,
    target,
    setPositions: (next: typeof positions) => {
      positions = next;
    },
  };
}

it('copies a deep snapshot without dirtying or sharing query/options objects', () => {
  const { scene, source, target } = setup();
  const before = gridItemToPanel(source);
  const copied = copyPanelSettings(scene, source.state.body, target.positions());
  expect(scene.state.isDirty).toBeFalsy();
  expect(copied.size).toEqual({ w: 11, h: 57 });
  copied.json.targets![0].refId = 'changed';
  expect(gridItemToPanel(source)).toEqual(before);
});

it('pastes repeatedly into native target Rows with unique IDs and exact Wall sizes, then serializes/reloads', () => {
  const { scene, source, target, overview, network, setPositions } = setup();
  const original = gridItemToPanel(source);
  const copied = copyPanelSettings(scene, source.state.body, target.positions());
  const first = pastePanelSettings(scene, copied, target)!;
  expect(first).toBeGreaterThan(178);
  expect(overview.state.children).toHaveLength(2);
  const sameTab = scene.state.wallModern!.layouts[target.key];
  expect(sameTab[0]).toEqual(target.positions()[0]);
  expect(sameTab[1]).toMatchObject({ i: String(first), w: 11, h: 57, y: 87 });
  setPositions(sameTab);
  const second = pastePanelSettings(scene, copied, target)!;
  expect(second).toBeGreaterThan(first);
  expect(scene.state.wallModern!.layouts[target.key][2].y).toBe(144);
  const cross: ClipboardGrid = {
    ...target,
    tab: 'network',
    key: ':region:network:wall-workspace-detail-grid',
    positions: () => [],
  };
  const third = pastePanelSettings(scene, copied, cross)!;
  expect(third).toBeGreaterThan(second);
  expect(network.state.children).toHaveLength(1);
  expect(scene.state.isDirty).toBe(true);
  expect(gridItemToPanel(source)).toEqual(original);
  const copy = gridItemToPanel(network.state.children[0] as typeof source);
  for (const key of ['targets', 'datasource', 'options', 'fieldConfig', 'transformations'] as const) {
    expect(copy[key]).toEqual(original[key]);
  }
  const saved = transformSceneToSaveModel(scene);
  const restored = transformSaveModelToScene({
    dashboard: { ...saved, uid: saved.uid!, title: saved.title! },
    meta: {},
  });
  expect(restored.state.wallModern).toEqual(scene.state.wallModern);
  const rows = (restored.state.body as DefaultGridLayoutManager).state.grid.state.children;
  const row = rows.find((row) => row.state.key === 'panel-178') as SceneGridRow;
  expect(row.state.children).toHaveLength(1);
  expect(row.state.children[0].state.key).toBe(`grid-item-${third}`);
});

it('native cancel removes pasted panels and restores metadata; cross-dashboard paste is rejected', () => {
  const { scene, source, target } = setup();
  const copied = copyPanelSettings(scene, source.state.body, target.positions());
  expect(pastePanelSettings(scene, { ...copied, uid: 'other' }, target)).toBeUndefined();
  pastePanelSettings(scene, copied, target);
  scene.exitEditMode({ skipConfirm: true, restoreInitialState: true });
  expect(scene.state.body.getVizPanels()).toHaveLength(1);
  expect(scene.state.wallModern).toBeUndefined();
  expect(scene.state.isDirty).toBe(false);
});

it('appends below all occupied extents without moving any existing entry', () => {
  const layout = [{ i: 'a', x: 30, y: 15, w: 18, h: 70 }];
  expect(pastedPosition(layout, 300, { w: 11, h: 57 })).toEqual({ i: '300', x: 0, y: 85, w: 11, h: 57 });
  expect(layout[0].y).toBe(15);
});

it('protects input, code, menus and ordinary text selections from clipboard shortcuts', () => {
  const workspace = document.createElement('div');
  workspace.className = 'wall-dashboard-workspace';
  const input = document.createElement('input');
  workspace.append(input);
  document.body.append(workspace);
  const event = (target: Element) => {
    const e = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true, bubbles: true });
    Object.defineProperty(e, 'target', { value: target });
    return e;
  };
  expect(allowsPanelClipboard(event(input), document)).toBe(false);
  expect(allowsPanelClipboard(event(workspace), document)).toBe(true);
  const selection = jest.spyOn(document, 'getSelection').mockReturnValue({ toString: () => '메모리' } as Selection);
  expect(allowsPanelClipboard(event(workspace), document)).toBe(false);
  selection.mockRestore();
  workspace.remove();
});

it('does not rewrite nested Row panel version or base threshold representation during a layout-only save', () => {
  const { scene, source, overview } = setup();
  overview.setState({ isCollapsed: true });
  const baseline = JSON.parse(JSON.stringify(transformSceneToSaveModel(scene)));
  const original = baseline.panels[0].panels[0];
  original.pluginVersion = '11.3.0-pre';
  delete original.fieldConfig.defaults.thresholds.steps[0].value;
  scene.setInitialSaveModel(baseline);
  const fieldConfig = source.state.body.state.fieldConfig;
  source.state.body.setState({
    fieldConfig: {
      ...fieldConfig,
      defaults: {
        ...fieldConfig.defaults,
        thresholds: { ...fieldConfig.defaults.thresholds!, steps: [{ color: 'green', value: NaN }] },
      },
    },
  });
  expect((transformSceneToSaveModel(scene).panels![0] as RowPanel).panels![0]).toEqual(original);
  source.state.body.setState({
    fieldConfig: {
      ...source.state.body.state.fieldConfig,
      defaults: {
        ...source.state.body.state.fieldConfig.defaults,
        unit: 'percent',
      },
    },
  });
  expect((transformSceneToSaveModel(scene).panels![0] as RowPanel).panels![0].fieldConfig?.defaults.unit).toBe(
    'percent'
  );
});

it('handles real keyboard events only with an internal buffer and protects input/kiosk defaults', () => {
  const { scene, source, target } = setup();
  locationService.replace('/d/aec03x1adsi68f/wall');
  function WorkArea() {
    const clipboard = usePanelClipboard()!;
    const root = useRef<HTMLDivElement>(null);
    useEffect(
      () =>
        clipboard.register({
          ...target,
          root: () => root.current,
          positions: () => scene.state.wallModern?.layouts[target.key] ?? target.positions(),
        }),
      [clipboard]
    );
    return createElement(
      'div',
      { className: 'wall-dashboard-workspace' },
      createElement('div', { ref: root, tabIndex: 0, 'data-testid': 'clipboard-root' }),
      createElement('input', { 'aria-label': 'query input' })
    );
  }
  const view = (enabled: boolean) =>
    createElement(PanelClipboardProvider, { dashboard: scene, enabled }, createElement(WorkArea));
  const { rerender } = render(view(true));
  const root = screen.getByTestId('clipboard-root');
  const press = (node: Element, key: string, meta = false) => {
    const event = new KeyboardEvent('keydown', { key, ctrlKey: !meta, metaKey: meta, bubbles: true, cancelable: true });
    fireEvent(node, event);
    return event;
  };
  expect(press(root, 'v').defaultPrevented).toBe(false);
  expect(scene.state.body.getVizPanels()).toHaveLength(1);
  expect(press(root, 'c', true).defaultPrevented).toBe(true);
  expect(scene.state.isDirty).toBe(false);
  expect(press(screen.getByRole('textbox', { name: 'query input' }), 'v').defaultPrevented).toBe(false);
  const selection = jest.spyOn(document, 'getSelection').mockReturnValue({ toString: () => 'text' } as Selection);
  expect(press(root, 'v').defaultPrevented).toBe(false);
  selection.mockRestore();
  expect(press(root, 'v', true).defaultPrevented).toBe(true);
  expect(scene.state.body.getVizPanels()).toHaveLength(2);
  expect(source.state.body.state.key).toBe('panel-28');
  rerender(view(false));
  expect(press(screen.getByTestId('clipboard-root'), 'v').defaultPrevented).toBe(false);
  expect(scene.state.body.getVizPanels()).toHaveLength(2);
});

it.each([null, undefined])('keeps the raw loaded threshold base representation (%s) for unchanged panels', (base) => {
  const { scene, overview } = setup();
  overview.setState({ isCollapsed: true });
  const wire = JSON.parse(JSON.stringify(transformSceneToSaveModel(scene)));
  wire.panels[0].panels[0].pluginVersion = '11.3.0-pre';
  wire.panels[0].panels[0].fieldConfig.defaults.thresholds.steps[0].value = base;
  const pristine = JSON.parse(JSON.stringify(wire));
  const restored = transformSaveModelToScene({ dashboard: wire, meta: {} });
  expect((transformSceneToSaveModel(restored).panels![0] as RowPanel).panels![0]).toEqual(pristine.panels[0].panels[0]);
});

it('reserves repeated pastes atomically before a Grid render publishes its next layout', () => {
  const { scene, source, target } = setup();
  const copied = copyPanelSettings(scene, source.state.body, target.positions());
  const first = pastePanelSettings(scene, copied, target);
  const second = pastePanelSettings(scene, copied, target);
  expect(first).not.toBe(second);
  const positions = scene.state.wallModern!.layouts[target.key];
  expect(positions.map((entry) => entry.y)).toEqual([30, 87, 144]);
  expect(positions.map((entry) => entry.h)).toEqual([57, 57, 57]);
});

it('does not create a dirty panel reorder when reloading a saved Row-anchored copy', () => {
  const { scene, source, target } = setup();
  const copied = copyPanelSettings(scene, source.state.body, target.positions());
  pastePanelSettings(scene, copied, target);
  const wire = transformSceneToSaveModel(scene);
  const restored = transformSaveModelToScene({ dashboard: { ...wire, uid: wire.uid!, title: wire.title! }, meta: {} });
  expect(transformSceneToSaveModel(restored).panels).toEqual(wire.panels);
});

it('undoes and redoes panel insertions with the same IDs, restoring the exact saved baseline', () => {
  const { scene, source, target, overview } = setup();
  const wire = transformSceneToSaveModel(scene);
  const history = createLayoutHistory();
  const connect = () =>
    history.connect(target.key, {
      apply: () => true,
      validate: () => undefined,
      blocked: () => false,
    });
  connect();
  const copied = copyPanelSettings(scene, source.state.body, target.positions());
  const first = pastePanelWithHistory(scene, copied, target, undefined, history);
  const second = pastePanelWithHistory(scene, copied, target, undefined, history);
  // Reconnecting the Grid with added/removed IDs must preserve command history.
  connect();
  expect(history.getSnapshot().canUndo).toBe(true);
  expect(history.undo()).toBe(true);
  expect(overview.state.children.map((child) => child.state.key)).toEqual(['grid-item-28', `grid-item-${first}`]);
  expect(scene.state.isDirty).toBe(true);
  expect(history.undo()).toBe(true);
  expect(scene.state.isDirty).toBe(false);
  expect(transformSceneToSaveModel(scene)).toEqual(wire);
  expect(history.redo()).toBe(true);
  expect(history.redo()).toBe(true);
  expect(overview.state.children.map((child) => child.state.key)).toEqual([
    'grid-item-28',
    `grid-item-${first}`,
    `grid-item-${second}`,
  ]);
  expect(scene.state.wallModern?.layouts[target.key].map((item) => item.y)).toEqual([30, 87, 144]);
  expect(scene.state.isDirty).toBe(true);
});
