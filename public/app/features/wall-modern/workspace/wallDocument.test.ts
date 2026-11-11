import { SceneTimeRange, VizPanel } from '@grafana/scenes';
import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';
import { DefaultGridLayoutManager } from 'app/features/dashboard-scene/scene/layout-default/DefaultGridLayoutManager';
import { transformSaveModelToScene } from 'app/features/dashboard-scene/serialization/transformSaveModelToScene';
import { transformSceneToSaveModel } from 'app/features/dashboard-scene/serialization/transformSceneToSaveModel';

import { WallDocument, wallRegionKey, normalizeWallDocument, reconcileWallLayout } from './wallDocument';

it('round-trips exact odd 48-column coordinates and text through native dashboard serialization', () => {
  const document: WallDocument = {
    version: 1,
    layouts: { ':tab:overview:free-layout': [{ i: '28', x: 1, y: 63, w: 11, h: 57 }] },
    texts: { ':text-content:trends': { title: '성능 추이', description: 'CPU · 메모리' } },
  };
  const scene = new DashboardScene({
    uid: 'aec03x1adsi68f',
    title: 'Wall',
    wallModern: document,
    $timeRange: new SceneTimeRange({}),
    body: DefaultGridLayoutManager.fromVizPanels([]),
  });
  const saved = transformSceneToSaveModel(scene);
  const restored = transformSaveModelToScene({
    dashboard: { ...saved, title: saved.title!, uid: saved.uid! },
    meta: {},
  });
  expect(restored.state.wallModern).toEqual(document);
  expect(saved.panels).toEqual([]);
  expect(wallRegionKey('wall-modern:kpi-layout:v1:aec03x1adsi68f:1:1:tab:overview:free-layout')).toBe(
    ':tab:overview:free-layout'
  );
});

it('removes metadata-only dirty state after Undo while retaining a real size change', () => {
  const defaults: WallDocument = {
    version: 1,
    layouts: { overview: [{ i: '28', x: 0, y: 0, w: 11, h: 57 }] },
    texts: {},
  };
  expect(normalizeWallDocument(defaults, undefined, defaults)).toBeUndefined();
  const changed = { ...defaults, layouts: { overview: [{ ...defaults.layouts.overview[0], w: 13 }] } };
  expect(normalizeWallDocument(changed, undefined, defaults)).toEqual(changed);
  expect(normalizeWallDocument(defaults, defaults, defaults)).toBe(defaults);
});

it('advances the saved baseline without cloning the active save drawer, then cancels to that baseline', () => {
  const uid = 'aec03x1adsi68f';
  const doc: WallDocument = { version: 1, layouts: { overview: [{ i: '28', x: 0, y: 0, w: 11, h: 57 }] }, texts: {} };
  const scene = new DashboardScene({ uid, title: 'Wall', version: 1, wallModern: doc });
  scene.setInitialSaveModel(transformSceneToSaveModel(scene));
  scene.onEnterEditMode();
  scene.openSaveDrawer({});
  expect(() =>
    scene.saveCompleted(transformSceneToSaveModel(scene), {
      uid,
      id: 1,
      url: `/d/${uid}/wall`,
      slug: 'wall',
      version: 2,
      status: 'success',
    })
  ).not.toThrow();
  expect(scene.getInitialState()?.overlay).toBeUndefined();
  scene.setState({ wallModern: { ...doc, layouts: {} }, isDirty: true });
  scene.exitEditMode({ skipConfirm: true, restoreInitialState: true });
  expect(scene.state.wallModern).toEqual(doc);
});

it('keeps existing odd coordinates while native panel IDs are added or removed', () => {
  const items = [
    { i: '28', x: 1, y: 63, w: 11, h: 57 },
    { i: '30', x: 12, y: 0, w: 12, h: 40 },
  ];
  const next = reconcileWallLayout(
    items,
    [
      { id: 28, width: 12, height: 8 },
      { id: 901, width: 12, height: 8 },
    ],
    2,
    12
  );
  expect(next[0]).toEqual(items[0]);
  expect(next.map((item) => item.i)).toEqual(['28', '901']);
  expect(next[1]).toMatchObject({ x: 0, y: 120, w: 24 });
});

it.each(['aec03x1adsi68f', 'another-dashboard'])(
  'removes deleted Wall metadata across dashboards and restores it on cancel: %s',
  (uid) => {
    const doc: WallDocument = {
      version: 1,
      layouts: {
        network: [
          { i: '252', x: 1, y: 63, w: 11, h: 57 },
          { i: '28', x: 12, y: 0, w: 12, h: 54 },
        ],
        overview: [{ i: '-1001', x: 0, y: 0, w: 48, h: 24 }],
      },
      panelSources: { 252: 28 },
      texts: { heading: { title: 'Heading', description: '' } },
    };
    const panel = new VizPanel({ key: 'panel-252', pluginId: 'stat', title: 'Temporary copy' });
    const scene = new DashboardScene({
      uid,
      title: 'Wall',
      wallModern: doc,
      body: DefaultGridLayoutManager.fromVizPanels([panel]),
    });
    scene.setInitialSaveModel(transformSceneToSaveModel(scene));
    scene.onEnterEditMode();
    scene.removePanel(panel);
    const saved = transformSceneToSaveModel(scene);
    expect(saved.panels).toEqual([]);
    expect(scene.state.wallModern?.layouts.network).toEqual([doc.layouts.network[1]]);
    expect(scene.state.wallModern?.layouts.overview).toEqual(doc.layouts.overview);
    expect(scene.state.wallModern?.texts).toEqual(doc.texts);
    expect(scene.state.wallModern?.panelSources).toBeUndefined();
    scene.exitEditMode({ skipConfirm: true, restoreInitialState: true });
    expect(scene.state.wallModern).toEqual(doc);
    expect(scene.state.body.getVizPanels().map((item) => item.state.key)).toEqual(['panel-252']);
  }
);

it('does not mark a layout dirty solely because native item order or transient engine flags differ', () => {
  const defaults: WallDocument = {
    version: 1,
    layouts: {
      overview: [
        { i: '1', x: 0, y: 0, w: 12, h: 48 },
        { i: '2', x: 12, y: 0, w: 12, h: 48 },
      ],
    },
    texts: {},
  };
  const reordered = {
    ...defaults,
    layouts: { overview: [...defaults.layouts.overview].reverse().map((item) => ({ ...item, moved: false })) },
  };
  expect(normalizeWallDocument(reordered, undefined, defaults)).toBeUndefined();
  expect(normalizeWallDocument(reordered, defaults, defaults)).toBe(defaults);
  const changed = {
    ...reordered,
    layouts: { overview: reordered.layouts.overview.map((item) => ({ ...item, w: 11 })) },
  };
  expect(normalizeWallDocument(changed, defaults, defaults)).toBe(changed);
  expect(
    normalizeWallDocument(
      { ...reordered, texts: { section: { title: 'Changed', description: '' } } },
      defaults,
      defaults
    )
  ).toBeDefined();
});
