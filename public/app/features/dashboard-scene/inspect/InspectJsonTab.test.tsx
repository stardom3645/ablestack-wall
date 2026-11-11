import { of } from 'rxjs';

import {
  FieldType,
  getDefaultTimeRange,
  LoadingState,
  PanelData,
  PanelPlugin,
  PluginType,
  standardTransformersRegistry,
  toDataFrame,
} from '@grafana/data';
import { getPanelPlugin } from '@grafana/data/test/__mocks__/pluginMocks';
import { setPluginImportUtils, setRunRequest } from '@grafana/runtime';
import { SceneCanvasText, SceneDataTransformer, SceneQueryRunner, VizPanel } from '@grafana/scenes';
import * as libpanels from 'app/features/library-panels/state/api';
import { getStandardTransformers } from 'app/features/transformers/standardTransformers';

import { DashboardGridItem } from '../scene/DashboardGridItem';
import { DashboardScene } from '../scene/DashboardScene';
import { LibraryPanelBehavior } from '../scene/LibraryPanelBehavior';
import { VizPanelLinks, VizPanelLinksMenu } from '../scene/PanelLinks';
import { DefaultGridLayoutManager } from '../scene/layout-default/DefaultGridLayoutManager';
import * as nativePanelBuilder from '../serialization/transformSaveModelToScene';
import { vizPanelToPanel } from '../serialization/transformSceneToSaveModel';
import { activateFullSceneTree } from '../utils/test-utils';
import { findVizPanelByKey } from '../utils/utils';

import { InspectJsonTab } from './InspectJsonTab';
import { PanelInspectDrawer } from './PanelInspectDrawer';

standardTransformersRegistry.setInit(getStandardTransformers);
const panelPlugin: PanelPlugin = new PanelPlugin(() => null);
panelPlugin.meta = {
  id: 'table',
  name: 'Table',
  sort: 1,
  type: PluginType.panel,
  info: {
    author: {
      name: 'name',
    },
    description: '',
    links: [],
    logos: {
      large: '',
      small: '',
    },
    screenshots: [],
    updated: '',
    version: '1.0.',
  },
  module: '',
  baseUrl: '',
};

setPluginImportUtils({
  importPanelPlugin: (id: string) => Promise.resolve(getPanelPlugin({})),
  getPanelPluginFromCache: (id: string) => panelPlugin,
});

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  setPluginExtensionGetter: jest.fn(),
  getPluginLinkExtensions: jest.fn(() => ({
    extensions: [],
  })),
  getDataSourceSrv: () => {
    return {
      get: jest.fn().mockResolvedValue({
        getRef: () => ({ uid: 'ds1' }),
      }),
      getInstanceSettings: jest.fn().mockResolvedValue({ uid: 'ds1' }),
    };
  },
}));

const runRequestMock = jest.fn().mockReturnValue(
  of<PanelData>({
    state: LoadingState.Done,
    timeRange: getDefaultTimeRange(),
    series: [
      toDataFrame({
        fields: [{ name: 'value', type: FieldType.number, values: [1, 2, 3] }],
      }),
    ],
    request: {
      app: 'dashboard',
      requestId: 'request-id',
      dashboardUID: 'asd',
      interval: '1s',
      panelId: 1,
      range: getDefaultTimeRange(),
      targets: [],
      timezone: 'utc',
      intervalMs: 1000,
      startTime: 1,
      scopedVars: {
        __sceneObject: { value: new SceneCanvasText({ text: 'asd' }) },
      },
    },
  })
);

setRunRequest(runRequestMock);

describe('InspectJsonTab', () => {
  it('Can show panel json', async () => {
    const { tab } = await buildTestScene();

    const obj = JSON.parse(tab.state.jsonText);
    expect(obj.gridPos).toEqual({ x: 0, y: 0, w: 8, h: 10 });
    expect(tab.isEditable()).toBe(true);
  });

  it('Can show panel json for library panels', async () => {
    const { tab } = await buildTestSceneWithLibraryPanel();

    const obj = JSON.parse(tab.state.jsonText);
    expect(obj.gridPos).toEqual({ x: 0, y: 0, w: 8, h: 10 });
    expect(obj.type).toEqual('table');
    expect(tab.isEditable()).toBe(false);
  });

  it('Can show panel data with field config', async () => {
    const { tab } = await buildTestScene();
    tab.onChangeSource({ value: 'panel-data' });
    expect(tab.isEditable()).toBe(false);

    const obj = JSON.parse(tab.state.jsonText);
    expect(obj.series.length).toBe(1);
    expect(obj.state).toBe(LoadingState.Done);

    // verify scopedVars __sceneObject is filtered out
    expect(obj.request.scopedVars.__sceneObject).toEqual('Filtered out in JSON serialization');
  });

  it('Can show raw data frames', async () => {
    const { tab } = await buildTestScene();
    tab.onChangeSource({ value: 'data-frames' });

    const obj = JSON.parse(tab.state.jsonText);
    expect(Array.isArray(obj)).toBe(true);
    expect(obj[0].schema.fields.length).toBe(1);
    expect(tab.isEditable()).toBe(false);
  });

  it('keeps invalid JSON in the inspector and does not apply or close it', async () => {
    const { tab, panel } = await buildTestScene();
    tab.onCodeEditorBlur('{invalid');
    expect(() => tab.onApplyChange()).not.toThrow();
    expect(tab.state.jsonError).toBeTruthy();
    expect(tab.state.onClose).not.toHaveBeenCalled();
    expect(panel.state.title).toBe('Panel A');
  });

  it('does not apply noneditable data JSON', async () => {
    const { tab } = await buildTestScene();
    tab.onChangeSource({ value: 'panel-data' });
    tab.onApplyChange();
    expect(tab.state.onClose).not.toHaveBeenCalled();
  });

  it('retains the panel draft and original snapshot across source switches without applying it', async () => {
    const { tab, panel } = await buildTestScene();
    const original = tab.state.originalText;
    const edited = JSON.stringify({ ...JSON.parse(original), title: 'Not applied' });
    tab.onCodeEditorBlur(edited);
    tab.onChangeSource({ value: 'data-frames' });
    expect(tab.isEditable()).toBe(false);
    tab.onChangeSource({ value: 'panel-json' });
    expect(tab.state.jsonText).toBe(edited);
    expect(tab.state.originalText).toBe(original);
    expect(panel.state.title).toBe('Panel A');
    tab.onRestore();
    expect(tab.state.jsonText).toBe(original);
    expect(tab.state.onClose).not.toHaveBeenCalled();
  });

  it('keeps a native model-conversion failure in the workspace before changing the panel', async () => {
    const { tab, panel } = await buildTestScene();
    const failure = jest.spyOn(nativePanelBuilder, 'buildGridItemForPanel').mockImplementationOnce(() => {
      throw new Error('Native conversion failed');
    });
    tab.onCodeEditorBlur(JSON.stringify({ ...JSON.parse(tab.state.jsonText), title: 'Not applied' }));
    expect(() => tab.onApplyChange()).not.toThrow();
    expect(tab.state.jsonError).toContain('Native conversion failed');
    failure.mockRestore();
    expect(panel.state.title).toBe('Panel A');
    expect(tab.state.onClose).not.toHaveBeenCalled();
  });

  it('clears the Scene inspect key when closing without clearing prior dashboard dirty state', async () => {
    const { scene, panel } = await buildTestScene();
    const drawer = new PanelInspectDrawer({ panelRef: panel.getRef() });
    scene.setState({ overlay: drawer, inspectPanelKey: panel.state.key, isDirty: true });
    drawer.onClose();
    expect(scene.state.overlay).toBeUndefined();
    expect(scene.urlSync?.getUrlState().inspect).toBeUndefined();
    expect(scene.state.isDirty).toBe(true);
  });

  it('Can update model', async () => {
    const { tab, panel, scene } = await buildTestScene();

    tab.onCodeEditorBlur(`{
      "id": 12,
      "type": "table",
      "title": "New title",
      "gridPos": {
        "x": 1,
        "y": 2,
        "w": 3,
        "h": 4
      },
      "options": {},
      "fieldConfig": {},
      "transformations": [],
      "transparent": false
    }`);

    const close = jest.fn(() => expect(findVizPanelByKey(scene, panel.state.key)!.state.title).toBe('New title'));
    tab.setState({ onClose: close });
    tab.onApplyChange();

    const panel2 = findVizPanelByKey(scene, panel.state.key)!;
    expect(panel2.state.title).toBe('New title');
    expect((panel2.parent as DashboardGridItem).state.width!).toBe(3);

    expect(tab.state.onClose).toHaveBeenCalled();
  });
});

function buildTestPanel() {
  return new VizPanel({
    title: 'Panel A',
    pluginId: 'table',
    key: 'panel-12',
    titleItems: [new VizPanelLinks({ menu: new VizPanelLinksMenu({}) })],
    $data: new SceneDataTransformer({
      transformations: [
        {
          id: 'reduce',
          options: {
            reducers: ['last'],
          },
        },
      ],
      $data: new SceneQueryRunner({
        datasource: { uid: 'abcdef' },
        queries: [{ refId: 'A' }],
      }),
    }),
  });
}

async function buildTestScene() {
  const panel = buildTestPanel();
  const scene = new DashboardScene({
    title: 'hello',
    uid: 'dash-1',
    meta: {
      canEdit: true,
    },
    body: DefaultGridLayoutManager.fromVizPanels([panel]),
  });

  activateFullSceneTree(scene);

  await new Promise((r) => setTimeout(r, 1));

  const tab = new InspectJsonTab({
    panelRef: panel.getRef(),
    onClose: jest.fn(),
  });

  return { scene, tab, panel };
}

async function buildTestSceneWithLibraryPanel() {
  const libraryPanel = new VizPanel({
    title: 'Panel A',
    pluginId: 'table',
    key: 'panel-12',
    $behaviors: [new LibraryPanelBehavior({ title: 'LibraryPanel A title', name: 'LibraryPanel A', uid: '111' })],
    titleItems: [new VizPanelLinks({ menu: new VizPanelLinksMenu({}) })],
    $data: new SceneDataTransformer({
      transformations: [
        {
          id: 'reduce',
          options: {
            reducers: ['last'],
          },
        },
      ],
      $data: new SceneQueryRunner({
        datasource: { uid: 'abcdef' },
        queries: [{ refId: 'A' }],
      }),
    }),
  });

  const panel = vizPanelToPanel(libraryPanel.clone({ $behaviors: undefined }));

  const libraryPanelState = {
    name: 'LibraryPanel A',
    title: 'LibraryPanel A title',
    uid: '111',
    panelKey: 'panel-22',
    model: panel,
    type: 'table',
    version: 1,
  };

  jest.spyOn(libpanels, 'getLibraryPanel').mockResolvedValue({ ...libraryPanelState, ...panel });

  const scene = new DashboardScene({
    title: 'hello',
    uid: 'dash-1',
    meta: {
      canEdit: true,
    },
    body: DefaultGridLayoutManager.fromVizPanels([libraryPanel]),
  });

  activateFullSceneTree(scene);

  await new Promise((r) => setTimeout(r, 1));

  const tab = new InspectJsonTab({
    panelRef: libraryPanel.getRef(),
    onClose: jest.fn(),
  });

  return { scene, tab, panel };
}
