import { act, fireEvent, screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import { config } from '@grafana/runtime';
import { behaviors, SceneTimeRange } from '@grafana/scenes';
import { contextSrv } from 'app/core/services/context_srv';
import { DashboardControls } from 'app/features/dashboard-scene/scene/DashboardControls';
import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';
import { GeneralSettingsEditView } from 'app/features/dashboard-scene/settings/GeneralSettingsEditView';
import { activateFullSceneTree } from 'app/features/dashboard-scene/utils/test-utils';

import { WallGeneralSettings } from './WallGeneralSettings';

// Native domain pickers/confirmation are covered separately; this test exercises the new form controls.
jest.mock('@grafana/ui', () => ({
  ...jest.requireActual('@grafana/ui'),
  TimeZonePicker: () => <div>Native time zone picker</div>,
  WeekStartPicker: () => <div>Native week start picker</div>,
}));

jest.mock('app/core/components/Select/FolderPicker', () => ({ FolderPicker: () => <div>Native folder picker</div> }));
jest.mock('app/features/dashboard-scene/settings/DeleteDashboardButton', () => ({
  DeleteDashboardButton: () => <button>Native delete confirmation</button>,
}));

it('connects new inputs, switches and choices to native dashboard settings and rejects invalid refresh values', async () => {
  const previousMinimum = config.minRefreshInterval;
  const previousContextMinimum = contextSrv.minRefreshInterval;
  config.minRefreshInterval = '5s';
  contextSrv.minRefreshInterval = '5s';
  const settings = new GeneralSettingsEditView({});
  const dashboard = new DashboardScene({
    uid: 'aec03x1adsi68f',
    title: 'Original',
    controls: new DashboardControls({}),
    $timeRange: new SceneTimeRange({}),
    $behaviors: [new behaviors.CursorSync({ sync: 0 }), new behaviors.LiveNowTimer({ enabled: false })],
    editview: settings,
    meta: { canEdit: true },
  });
  const deactivate = activateFullSceneTree(dashboard);
  act(() => dashboard.onEnterEditMode());
  expect(dashboard.getInitialState()?.editview).toBeUndefined();
  render(<WallGeneralSettings model={settings} />);
  fireEvent.change(screen.getByLabelText('제목', { exact: true }), { target: { value: 'Edited title' } });
  expect(dashboard.state.title).toBe('Edited title');
  const tagInput = screen.getByLabelText('태그', { exact: true });
  fireEvent.change(tagInput, { target: { value: 'wall-test' } });
  fireEvent.keyDown(tagInput, { key: 'Enter' });
  expect(dashboard.state.tags).toEqual(['wall-test']);
  fireEvent.click(screen.getByLabelText('wall-test 태그 제거'));
  expect(dashboard.state.tags).toEqual([]);
  fireEvent.click(screen.getByRole('switch', { name: '시간 선택기 숨기기' }));
  expect(settings.getDashboardControls().state.hideTimeControls).toBe(true);
  fireEvent.click(screen.getByText('십자선', { exact: true }));
  expect(settings.getCursorSync()?.state.sync).toBe(1);
  const intervals = screen.getByLabelText('자동 갱신 간격', { exact: true });
  const original = settings.getRefreshPicker().state.intervals;
  fireEvent.change(intervals, { target: { value: 'invalid' } });
  fireEvent.blur(intervals);
  expect(intervals).toHaveAttribute('aria-invalid', 'true');
  expect(settings.getRefreshPicker().state.intervals).toEqual(original);
  fireEvent.change(intervals, { target: { value: '5s,1m' } });
  fireEvent.blur(intervals);
  expect(settings.getRefreshPicker().state.intervals).toEqual(['5s', '1m']);
  expect(screen.getByText('Native folder picker')).toBeInTheDocument();
  act(() => deactivate());
  config.minRefreshInterval = previousMinimum;
  contextSrv.minRefreshInterval = previousContextMinimum;
});
