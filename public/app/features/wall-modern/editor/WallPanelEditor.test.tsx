import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { editor } from 'monaco-editor';

import { createTheme, ThemeContext } from '@grafana/data';
import { SceneObjectBase, SceneObjectState, VizPanel } from '@grafana/scenes';
import defineThemes from '@grafana/ui/src/components/Monaco/theme';
import { PanelDataPane } from 'app/features/dashboard-scene/panel-edit/PanelDataPane/PanelDataPane';
import {
  PanelDataPaneTab,
  PanelDataTabHeaderProps,
  TabId,
} from 'app/features/dashboard-scene/panel-edit/PanelDataPane/types';

import { WallEditorDataTab, WallPanelEditorFrame } from './WallPanelEditor';

jest.mock('monaco-editor', () => ({ editor: { setTheme: jest.fn() } }));
jest.mock('@grafana/ui/src/components/Monaco/theme', () => ({ __esModule: true, default: jest.fn() }));

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
  expect(screen.getByRole('tab', { name: 'Queries 1' })).toHaveAttribute('aria-selected', 'true');
  await user.click(screen.getByRole('tab', { name: 'Transformations 1' }));
  expect(model.getUrlState()).toEqual({ tab: TabId.Transformations });
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Transformations native editor');
  await user.keyboard('{ArrowLeft}{Enter}');
  expect(model.getUrlState()).toEqual({ tab: TabId.Queries });
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Queries native editor');
  act(() => model.updateFromUrl({ tab: TabId.Transformations }));
  expect(screen.getByRole('tab', { name: 'Transformations 1' })).toHaveAttribute('aria-selected', 'true');
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
