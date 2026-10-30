import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';

import { SceneGridLayout, SceneGridRow, SceneGridItem, VizPanel, SceneQueryRunner } from '@grafana/scenes';
import { DashboardGridItem } from 'app/features/dashboard-scene/scene/DashboardGridItem';
import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';
import { DefaultGridLayoutManager } from 'app/features/dashboard-scene/scene/layout-default/DefaultGridLayoutManager';
import { transformSceneToSaveModel } from 'app/features/dashboard-scene/serialization/transformSceneToSaveModel';

import { STORAGE_VM_DASHBOARD_UID } from '../statPresentation';

import { DashboardWorkspace } from './DashboardWorkspace';
import { activateWorkspaceParents, getWorkspaceGroups } from './StorageDashboardWorkspace';
import { panelsForTab, selectedWorkspaceTab, usesStorageWorkspaceRenderer, WorkspaceTab, workspaceTabs } from './model';

const rows = [
  { id: 24, panels: [28, 138, 30, 32, 34, 38, 36, 40, 8, 242, 241, 237, 239, 251, 240, 236, 250, 140, 142, 144, 146] },
  { id: 178, panels: [224, 226, 228, 230, 176, 174, 172, 170, 168, 166, 164, 162, 160, 158, 156, 154, 152, 150, 148] },
  { id: 196, panels: [244, 192, 194, 188, 190, 184, 186] },
  { id: 136, panels: [246, 249, 131, 132, 133, 134] },
  { id: 210, panels: [212, 214, 216, 218, 220, 222] },
];

function setupScene() {
  const sceneRows = rows.map(
    (row, rowIndex) =>
      new SceneGridRow({
        key: `panel-${row.id}`,
        title: `Row ${row.id}`,
        isCollapsed: rowIndex !== 0,
        y: rowIndex * 30,
        children: row.panels.map(
          (id, index) =>
            new DashboardGridItem({
              key: `grid-item-${id}`,
              x: (index % 2) * 12,
              y: rowIndex * 30 + index * 4,
              width: 12,
              height: 8,
              body: new VizPanel({
                key: `panel-${id}`,
                title: `Metric ${id}`,
                pluginId: 'stat',
                options: { graphMode: 'none' },
                fieldConfig: { defaults: { unit: 'bytes' }, overrides: [] },
                $data: new SceneQueryRunner({ queries: [{ refId: 'A', expr: 'up' }], datasource: { uid: 'fixture' } }),
              }),
            })
        ),
      })
  );
  const layout = new DefaultGridLayoutManager({ grid: new SceneGridLayout({ children: sceneRows }) });
  const scene = new DashboardScene({ uid: STORAGE_VM_DASHBOARD_UID, title: 'Storage', body: layout });
  return { scene, layout, sceneRows };
}

it('projects all 59 original panel objects once without changing IDs, rows, queries, options or saved geometry', () => {
  const { scene, layout, sceneRows } = setupScene();
  const original = JSON.stringify(transformSceneToSaveModel(scene));
  const groups = getWorkspaceGroups(layout);
  expect(workspaceTabs.map((tab) => panelsForTab(groups, tab.id).length)).toEqual([21, 19, 7, 6, 6]);
  expect(new Set(groups.flatMap((group) => group.panels.map((panel) => panel.id))).size).toBe(59);
  groups.forEach((group, rowIndex) =>
    group.panels.forEach((panel, index) => {
      expect(panel.model).toBe((sceneRows[rowIndex].state.children[index] as DashboardGridItem).state.body);
    })
  );
  expect(JSON.stringify(transformSceneToSaveModel(scene))).toBe(original);
  expect(sceneRows.map((row) => row.state.isCollapsed)).toEqual([false, true, true, true, true]);
  expect(sceneRows.every((row) => !row.isActive)).toBe(true);
});

it('activates parents even when a child is already active and balances shared ancestor references', () => {
  const a = new SceneGridItem({ body: new VizPanel({ key: 'a', pluginId: 'stat' }) });
  const b = new SceneGridItem({ body: new VizPanel({ key: 'b', pluginId: 'stat' }) });
  const grid = new SceneGridLayout({ children: [a, b] });
  const childStop = a.activate();
  const stopA = activateWorkspaceParents(a);
  const stopB = activateWorkspaceParents(b);
  expect(grid.isActive).toBe(true);
  stopA();
  expect(grid.isActive).toBe(true);
  stopB();
  expect(grid.isActive).toBe(false);
  childStop();
});

it('preserves additional panels in unrecognised rows instead of silently omitting them', () => {
  const { layout } = setupScene();
  const unknown = new SceneGridRow({
    key: 'panel-900',
    title: 'New section',
    isCollapsed: true,
    children: [new DashboardGridItem({ body: new VizPanel({ key: 'panel-901', title: 'Extra', pluginId: 'stat' }) })],
  });
  layout.state.grid.setState({ children: [...layout.state.grid.state.children, unknown] });
  expect(panelsForTab(getWorkspaceGroups(layout), 'overview').some((panel) => panel.id === 901)).toBe(true);
});

it('uses actual Base UI tab panels and mounts only the selected section, including keyboard navigation', async () => {
  const { layout } = setupScene();
  const groups = getWorkspaceGroups(layout);
  const mounts = jest.fn();
  const unmounts = jest.fn();
  function NativePanelPlaceholder({ id }: { id: number }) {
    useEffect(() => {
      mounts(id);
      return () => unmounts(id);
    }, [id]);
    return <span data-testid={`native-${id}`}>Native {id}</span>;
  }
  function Host() {
    const [active, setActive] = useState<WorkspaceTab>('overview');
    return (
      <DashboardWorkspace
        groups={groups}
        activeTab={active}
        onTabChange={setActive}
        renderPanel={(panel) => <NativePanelPlaceholder id={panel.id} />}
      />
    );
  }
  const { container } = render(<Host />);
  expect(screen.getAllByRole('tab')).toHaveLength(5);
  expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  expect(screen.getByTestId('native-28')).toBeInTheDocument();
  expect(screen.queryByTestId('native-224')).not.toBeInTheDocument();
  expect(container.querySelectorAll('[data-slot="card"][data-wall-panel-id]')).toHaveLength(10);
  expect(container.querySelectorAll('[data-wall-overview-role]')).toHaveLength(21);
  const user = userEvent.setup();
  await user.click(screen.getByRole('tab', { name: /네트워크/ }));
  expect(screen.getByRole('tab', { name: /네트워크/ })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByTestId('native-224')).toBeInTheDocument();
  expect(screen.queryByTestId('native-28')).not.toBeInTheDocument();
  expect(unmounts).toHaveBeenCalledWith(28);
  expect(container.querySelectorAll('[data-wall-panel-id]')).toHaveLength(19);
  expect(container.querySelectorAll('[data-wall-overview-role]')).toHaveLength(0);
  expect(container.querySelectorAll('[data-wall-panel-chrome]')).toHaveLength(0);
  await user.keyboard('{ArrowRight}{Enter}');
  await waitFor(() => expect(screen.getByRole('tab', { name: /스토리지/ })).toHaveAttribute('aria-selected', 'true'));
  expect(screen.getByTestId('native-244')).toBeInTheDocument();
  expect(screen.queryByTestId('native-224')).not.toBeInTheDocument();
});

it('validates tab URL values and scopes renderer selection to the selected UID', () => {
  expect(selectedWorkspaceTab('?from=now-6h&wallTab=network&var-scvm=node')).toBe('network');
  expect(selectedWorkspaceTab('?wallTab=devices')).toBe('devices');
  expect(selectedWorkspaceTab('?wallTab=unsupported')).toBe('overview');
  expect(usesStorageWorkspaceRenderer(STORAGE_VM_DASHBOARD_UID, false)).toBe(true);
  expect(usesStorageWorkspaceRenderer(STORAGE_VM_DASHBOARD_UID, true)).toBe(false);
  expect(usesStorageWorkspaceRenderer('fec03giqwtw5cf', false)).toBe(false);
});
