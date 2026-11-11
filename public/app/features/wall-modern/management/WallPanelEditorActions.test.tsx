import { fireEvent, screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import { locationService } from '@grafana/runtime';
import { SceneGridLayout, VizPanel } from '@grafana/scenes';
import { PanelEditor } from 'app/features/dashboard-scene/panel-edit/PanelEditor';
import { DashboardGridItem } from 'app/features/dashboard-scene/scene/DashboardGridItem';
import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';
import { DefaultGridLayoutManager } from 'app/features/dashboard-scene/scene/layout-default/DefaultGridLayoutManager';
import { KioskMode } from 'app/types';

import { WallManagementActions } from './WallManagement';

const setup = (kiosk = false, panelDirty = true) => {
  const panel = new VizPanel({ key: 'panel-1', title: 'Test', pluginId: 'timeseries' });
  const dashboard = new DashboardScene({
    body: new DefaultGridLayoutManager({
      grid: new SceneGridLayout({ children: [new DashboardGridItem({ body: panel })] }),
    }),
    meta: { canSave: true },
    isEditing: true,
    isDirty: true,
    kioskMode: kiosk ? KioskMode.Full : undefined,
  });
  const editor = new PanelEditor({ panelRef: panel.getRef(), isDirty: panelDirty });
  const save = jest.spyOn(dashboard, 'openSaveDrawer').mockImplementation(() => {});
  const cancel = jest.spyOn(editor, 'onDiscard').mockImplementation(() => {});
  render(<WallManagementActions dashboard={dashboard} editor={editor} />);
  return { save, cancel };
};
afterEach(() => jest.restoreAllMocks());

it('applies through the existing editor exit and never treats Apply as a permanent save', () => {
  const { save, cancel } = setup();
  const partial = jest.spyOn(locationService, 'partial').mockImplementation(() => {});
  fireEvent.click(screen.getByRole('button', { name: '적용' }));
  expect(partial).toHaveBeenCalledWith({ editPanel: null });
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(cancel).toHaveBeenCalledTimes(1);
});
it('retains the dashboard pending indicator even when the current panel is clean', () => {
  setup(false, false);
  expect(screen.getByRole('status')).toHaveTextContent('대시보드 미저장 변경');
});
it('hides edit, apply, cancel and save controls in kiosk mode', () => {
  setup(true);
  expect(screen.queryByRole('button', { name: '적용' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '취소' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '저장 옵션' })).not.toBeInTheDocument();
});
