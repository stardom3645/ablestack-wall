import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { editor } from 'monaco-editor';
import { useContext } from 'react';

import { createTheme, ThemeContext } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { SceneObjectBase, SceneObjectState, VizPanel } from '@grafana/scenes';
import { StatCardPresentationContext } from '@grafana/ui/src/components/BigValue/StatCardPresentation';
import defineThemes from '@grafana/ui/src/components/Monaco/theme';
import { PanelDataPane } from 'app/features/dashboard-scene/panel-edit/PanelDataPane/PanelDataPane';
import {
  PanelDataPaneTab,
  PanelDataTabHeaderProps,
  TabId,
} from 'app/features/dashboard-scene/panel-edit/PanelDataPane/types';

import { WallEditorDataTab, WallEditorPreview, WallPanelEditorContext, WallPanelEditorFrame } from './WallPanelEditor';

jest.mock('monaco-editor', () => ({ editor: { setTheme: jest.fn() } }));
jest.mock('@grafana/ui/src/components/Monaco/theme', () => ({ __esModule: true, default: jest.fn() }));

it('connects the editor preview to the same Stat content and spacing contract as dashboard panels', () => {
  function Probe() {
    const stat = useContext(StatCardPresentationContext);
    return (
      <div role="status">
        {stat?.renderContent
          ? `Wall:${stat.compactVerticalPadding}:${stat.minimumItemWidth}:${stat.minimumItemHeight}`
          : 'native'}
      </div>
    );
  }
  const { rerender } = render(
    <WallPanelEditorContext.Provider value>
      <WallEditorPreview tableView={false} hasData onToggleTableView={jest.fn()}>
        <Probe />
      </WallEditorPreview>
    </WallPanelEditorContext.Provider>
  );
  expect(screen.getByRole('status')).toHaveTextContent('Wall:0:120:80');
  rerender(
    <WallEditorPreview tableView={false} hasData onToggleTableView={jest.fn()}>
      <Probe />
    </WallEditorPreview>
  );
  expect(screen.getByRole('status')).toHaveTextContent('native');
});

class DataTab extends SceneObjectBase<SceneObjectState> implements PanelDataPaneTab {
  static Component = ({ model }: { model: DataTab }) => <div>{model.getTabLabel()} native editor</div>;
  constructor(public tabId: TabId) {
    super({});
  }
  getTabLabel() {
    return this.tabId === TabId.Queries ? 'Queries' : 'Transformations';
  }
  renderTab(props: PanelDataTabHeaderProps) {
    return <WallEditorDataTab key={this.tabId} value={this.tabId} label={this.getTabLabel()} counter={1} {...props} />;
  }
}

it('connects Base UI click and keyboard selection to the native data pane model and URL state', async () => {
  const user = userEvent.setup();
  const panel = new VizPanel({ title: 'Example', pluginId: 'stat' });
  const model = new PanelDataPane({
    panelRef: panel.getRef(),
    tabs: [new DataTab(TabId.Queries), new DataTab(TabId.Transformations)],
    tab: TabId.Queries,
  });
  render(
    <WallPanelEditorFrame enabled title="Example">
      <model.Component model={model} />
    </WallPanelEditorFrame>
  );
  expect(screen.getByRole('tab', { name: '쿼리 1' })).toHaveAttribute('aria-selected', 'true');
  await user.click(screen.getByRole('tab', { name: '변환 1' }));
  expect(model.getUrlState()).toEqual({ tab: TabId.Transformations });
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Transformations native editor');
  await user.keyboard('{ArrowLeft}{Enter}');
  expect(model.getUrlState()).toEqual({ tab: TabId.Queries });
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Queries native editor');
  act(() => model.updateFromUrl({ tab: TabId.Transformations }));
  expect(screen.getByRole('tab', { name: '변환 1' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Transformations native editor');
});

it('retains the native tab callback outside the opted-in editor and adds no Wall shell', async () => {
  const user = userEvent.setup();
  const onChangeTab = jest.fn();
  render(
    <WallPanelEditorFrame enabled={false} title="Other dashboard">
      <WallEditorDataTab value="queries" label="Queries" counter={2} active onChangeTab={onChangeTab} />
    </WallPanelEditorFrame>
  );
  await user.click(screen.getByRole('tab', { name: 'Queries 2' }));
  expect(onChangeTab).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('heading', { name: 'Other dashboard' })).not.toBeInTheDocument();
});

it('updates native Monaco colors on a live theme change without remounting the edit buffer', async () => {
  const user = userEvent.setup();
  const light = createTheme({ colors: { mode: 'light' } });
  const dark = createTheme({ colors: { mode: 'dark' } });
  const view = (theme: typeof light) => (
    <ThemeContext.Provider value={theme}>
      <WallPanelEditorFrame enabled title="Theme test">
        <textarea aria-label="Unsaved query" defaultValue="original" />
      </WallPanelEditorFrame>
    </ThemeContext.Provider>
  );
  const { rerender } = render(view(light));
  const buffer = screen.getByRole('textbox', { name: 'Unsaved query' });
  await user.clear(buffer);
  await user.type(buffer, 'unsaved query');
  await waitFor(() => expect(defineThemes).toHaveBeenLastCalledWith(expect.anything(), light));
  rerender(view(dark));
  await waitFor(() => expect(defineThemes).toHaveBeenLastCalledWith(expect.anything(), dark));
  expect(editor.setTheme).toHaveBeenLastCalledWith('grafana-dark');
  expect(screen.getByRole('textbox', { name: 'Unsaved query' })).toBe(buffer);
  expect(buffer).toHaveValue('unsaved query');
});

it('uses live dashboard/panel/plugin names and the existing editor exit without discarding its buffer', async () => {
  const user = userEvent.setup();
  const partial = jest.spyOn(locationService, 'partial').mockImplementation(() => {});
  const view = (dashboardTitle: string, title: string, visualizationName: string) => (
    <WallPanelEditorFrame
      enabled
      dashboardTitle={dashboardTitle}
      title={title}
      visualizationName={visualizationName}
      dirty
    >
      <textarea aria-label="Panel draft" defaultValue="original" />
    </WallPanelEditorFrame>
  );
  try {
    const { rerender } = render(view('Overview', 'Host count', 'Stat'));
    const draft = screen.getByRole('textbox', { name: 'Panel draft' });
    await user.type(draft, ' unsaved');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Host count');
    expect(screen.getByText(/Stat/)).toHaveAttribute('title', 'Stat');
    const back = screen.getByRole('button', { name: /Overview/ });
    expect(back).toHaveAttribute('title', 'Overview');
    await user.click(back);
    expect(partial).toHaveBeenCalledWith({ editPanel: null, editview: null, editIndex: null, viewPanel: null });
    expect(draft).toHaveValue('original unsaved');
    rerender(view('Long / dashboard <title> '.repeat(8), 'Changed panel title', 'Gauge'));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Changed panel title');
    expect(screen.getByText(/Gauge/)).toHaveAttribute('title', 'Gauge');
    expect(screen.getByRole('button', { name: /Long \/ dashboard <title>/ })).toHaveAttribute(
      'title',
      'Long / dashboard <title> '.repeat(8)
    );
    expect(screen.getByRole('button', { name: /Long \/ dashboard <title>/ }).getAttribute('aria-label')).not.toContain(
      '&#'
    );
    expect(screen.getByRole('textbox', { name: 'Panel draft' })).toBe(draft);
    expect(draft).toHaveValue('original unsaved');
  } finally {
    partial.mockRestore();
  }
});
