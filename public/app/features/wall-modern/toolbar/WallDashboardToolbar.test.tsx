import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { VariableHide, OrgRole } from '@grafana/data';
import { config, locationService } from '@grafana/runtime';
import {
  TextBoxVariable,
  CustomVariable,
  SceneVariable,
  SceneRefreshPicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { DashboardLink } from '@grafana/schema';
import { contextSrv } from 'app/core/services/context_srv';
import { DashboardControls } from 'app/features/dashboard-scene/scene/DashboardControls';
import { DashboardDataLayerSet } from 'app/features/dashboard-scene/scene/DashboardDataLayerSet';
import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';

import { STORAGE_VM_DASHBOARD_UID } from '../statPresentation';

import { retainedToolbarLinks, WallDashboardToolbar } from './WallDashboardToolbar';
import { variableSelection, variableSelectionSummary } from './WallVariableControl';

jest.mock('app/features/dashboard-scene/utils/utils', () => ({
  ...jest.requireActual('app/features/dashboard-scene/utils/utils'),
  activateInActiveParents: jest.fn(), // Browser QA covers the real Scene/timer activation lifecycle.
}));
jest.mock('app/features/panel/panellinks/link_srv', () => ({
  getLinkSrv: () => ({ getAnchorInfo: (link: DashboardLink) => ({ href: link.url, title: link.title }) }),
}));

const link = (title: string, url = '/dashboards', type = 'link') => ({ title, url, type }) as DashboardLink;

function setup(canEdit = true, object?: SceneVariable) {
  const refresh = new SceneRefreshPicker({ refresh: '', intervals: ['5s', '1m'], minRefreshInterval: '10s' });
  const controls = new DashboardControls({
    refreshPicker: refresh,
    variableControls: [new VariableValueSelectors({})],
  });
  const time = new SceneTimeRange({ from: 'now-6h', to: 'now' });
  const dashboard = new DashboardScene({
    uid: STORAGE_VM_DASHBOARD_UID,
    title: 'Storage',
    controls,
    $timeRange: time,
    $variables: new SceneVariableSet({ variables: object ? [object] : [] }),
    $data: new DashboardDataLayerSet({ annotationLayers: [] }),
    meta: { canEdit },
    links: [
      link('Home'),
      link('대시보드 목록', '', 'dashboards'),
      { ...link('넷다이브', 'http://netdive.test:8082'), targetBlank: true },
    ],
  });
  const refreshClick = jest.spyOn(refresh, 'onRefresh').mockImplementation(() => {});
  const intervalChange = jest
    .spyOn(refresh, 'onIntervalChanged')
    .mockImplementation((value) => refresh.setState({ refresh: value }));
  const edit = jest
    .spyOn(dashboard, 'onEnterEditMode')
    .mockImplementation(() => dashboard.setState({ isEditing: true }));
  render(<WallDashboardToolbar dashboard={dashboard} controls={controls} />);
  return { dashboard, controls, refresh, time, edit, refreshClick, intervalChange, user: userEvent.setup() };
}

beforeEach(() => {
  contextSrv.user.orgRole = OrgRole.Viewer;
  contextSrv.user.isGrafanaAdmin = false;
  config.featureToggles.newDashboardSharingComponent = false;
  locationService.partial({
    wallTab: 'network',
    from: 'now-6h',
    to: 'now',
    'var-scvm': 'vm-a',
    refresh: null,
    shareView: null,
    wallLayout: null,
    editview: null,
  });
});

it('opens native dashboard settings without a separate layout mode or changing the active tab', async () => {
  contextSrv.user.orgRole = OrgRole.Admin;
  const { user, edit, dashboard } = setup();
  await user.click(screen.getByRole('button', { name: '대시보드 설정' }));
  expect(edit).toHaveBeenCalledTimes(1);
  expect(locationService.getSearchObject()).toMatchObject({
    editview: 'settings',
    wallTab: 'network',
    'var-scvm': 'vm-a',
  });
  expect(locationService.getSearchObject().wallLayout).toBeUndefined();
  expect(dashboard.state.editview).toBeDefined();
  expect(screen.queryByRole('button', { name: '편집' })).not.toBeInTheDocument();
});

it('renders one new toolbar with native Netdive destination/target and removes only duplicate navigation', () => {
  setup();
  expect(screen.getAllByTestId('wall-dashboard-toolbar')).toHaveLength(1);
  expect(screen.getByRole('link', { name: 'Netdive' })).toHaveAttribute('href', 'http://netdive.test:8082');
  expect(screen.getByRole('link', { name: 'Netdive' })).toHaveAttribute('target', '_blank');
  expect(screen.queryByText('Home')).not.toBeInTheDocument();
  expect(screen.queryByText('대시보드 목록')).not.toBeInTheDocument();
  expect(
    retainedToolbarLinks([link('Home'), link('대시보드 목록'), link('Runbook'), link('Netdive')]).map((l) => l.title)
  ).toEqual(['Runbook', 'Netdive']);
});

it('delegates refresh/edit to existing Scene actions, and sharing preserves unrelated URL parameters', async () => {
  const { user, refreshClick, edit } = setup();
  await user.click(screen.getByRole('button', { name: '새로고침' }));
  expect(refreshClick).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('button', { name: '대시보드 설정' }));
  expect(edit).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('button', { name: '공유' }));
  expect(locationService.getSearchObject()).toMatchObject({
    wallTab: 'network',
    'var-scvm': 'vm-a',
    from: 'now-6h',
    to: 'now',
    shareView: 'link',
  });
});

it('honors Viewer edit restrictions and native minimum refresh intervals, including Off and Auto', async () => {
  const { user, intervalChange } = setup(false);
  expect(screen.queryByRole('button', { name: '대시보드 설정' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '자동 갱신 간격 선택' }));
  expect(screen.queryByRole('menuitemradio', { name: '5s' })).not.toBeInTheDocument();
  expect(await screen.findByRole('menuitemradio', { name: '꺼짐' })).toBeInTheDocument();
  expect(screen.getByRole('menuitemradio', { name: '자동' })).toBeInTheDocument();
  await user.click(screen.getByRole('menuitemradio', { name: '1m' }));
  expect(intervalChange).toHaveBeenCalledWith('1m', expect.anything());
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  expect(screen.getByRole('button', { name: '자동 갱신 간격 선택' })).toHaveTextContent('1m');
});

it('uses the original time parser and Scene time range when a preset is selected', async () => {
  const { user, time } = setup();
  await user.click(screen.getByRole('button', { name: '시간 범위 선택' }));
  expect(screen.getByRole('dialog', { name: '시간 범위 설정' })).toBeInTheDocument();
  await user.click(screen.getByText('최근 1시간', { exact: true }));
  expect(time.state.from).toBe('now-1h');
  expect(time.state.to).toBe('now');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(locationService.getSearchObject()).toMatchObject({ wallTab: 'network', 'var-scvm': 'vm-a' });
});

it('keeps explicit hidden time/link/variable controls hidden while retaining actions', () => {
  const { controls } = setup();
  act(() => controls.setState({ hideTimeControls: true, hideLinksControls: true, hideVariableControls: true }));
  expect(screen.queryByRole('button', { name: '시간 범위 선택' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Netdive' })).not.toBeInTheDocument();
  expect(screen.queryByRole('group', { name: '대시보드 변수' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '대시보드 설정' })).toBeInTheDocument();
});

it('keeps both time movement buttons available for relative ranges and delegates to the same Scene handlers', async () => {
  const clock = jest.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 10, 5, 0));
  try {
    const { user, time } = setup();
    const before = time.state.value;
    await user.click(screen.getByRole('button', { name: '이전 시간 범위' }));
    expect(time.state.value.to.valueOf() - time.state.value.from.valueOf()).toBe(
      before.to.valueOf() - before.from.valueOf()
    );
    expect(time.state.value.to.valueOf()).toBeLessThan(before.to.valueOf());
    await user.click(screen.getByRole('button', { name: '다음 시간 범위' }));
    expect(time.state.value.to.valueOf()).toBe(before.to.valueOf());
  } finally {
    clock.mockRestore();
  }
});

it('retains all native custom-range/timezone/history tools behind advanced time settings', async () => {
  const { user } = setup();
  await user.click(screen.getByRole('button', { name: '시간 범위 선택' }));
  await user.click(screen.getByRole('button', { name: '고급 시간 설정' }));
  expect(screen.getByRole('textbox', { name: /From|부터/ })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: /To|까지/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Apply time range|시간 범위 적용/i })).toBeInTheDocument();
});

it('renders native variables directly, updates values and reacts to added, removed and hidden definitions', async () => {
  const variable = new TextBoxVariable({ name: 'scvm', label: '조회 대상', value: 'vm-a' });
  const { user, dashboard } = setup(true, variable);
  expect(screen.getByRole('group', { name: '대시보드 변수' })).toHaveTextContent('조회 대상');
  expect(screen.queryByRole('button', { name: '객체 선택' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '대시보드 필터' })).not.toBeInTheDocument();
  await user.clear(screen.getByDisplayValue('vm-a'));
  await user.type(screen.getByRole('textbox'), 'vm-b{Enter}');
  expect(variable.state.value).toBe('vm-b');

  const extra = new TextBoxVariable({ name: 'search', label: '검색', value: 'needle' });
  const variables = dashboard.state.$variables!;
  act(() => variables.setState({ variables: [variable, extra] }));
  expect(screen.getByDisplayValue('needle')).toBeInTheDocument();
  expect(screen.getByText('검색')).toBeInTheDocument();
  act(() => variable.setState({ hide: VariableHide.hideVariable }));
  expect(screen.queryByDisplayValue('vm-b')).not.toBeInTheDocument();
  act(() => extra.setState({ hide: VariableHide.hideLabel }));
  expect(screen.queryByText('검색')).not.toBeInTheDocument();
  expect(screen.getByDisplayValue('needle')).toBeInTheDocument();
  act(() => variables.setState({ variables: [] }));
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.queryByText('가상머신')).not.toBeInTheDocument();
});

it('summarizes actual labels, empty, multi and All values without modifying the variable', () => {
  const variable = new CustomVariable({ name: 'resource', value: '', text: '', options: [] });
  expect(variableSelectionSummary(variable)).toBe('미선택');
  variable.setState({ value: ['a', 'b'], text: ['Alpha', 'Beta'], isMulti: true });
  expect(variableSelectionSummary(variable)).toBe('Alpha 외 1개');
  expect(variable.state.value).toEqual(['a', 'b']);
  variable.setState({ value: ['$__all'], text: ['All'], includeAll: true });
  expect(variableSelectionSummary(variable)).toBe('전체');
  variable.setState({ value: 0, text: 'Zero' });
  expect(variableSelectionSummary(variable)).toBe('Zero');
});

it('uses a single shadcn trigger and the native selection callback, including reactive hidden/read-only settings', async () => {
  // jsdom's CSS resolver crashes on native Select selectors during Base UI focus checks.
  // Layout is validated in the browser; this test checks native selection and state wiring.
  const computedStyle = jest.spyOn(window, 'getComputedStyle').mockImplementation(() => {
    const style = document.createElement('div').style;
    style.display = 'block';
    style.visibility = 'visible';
    return style;
  });
  try {
    const variable = new CustomVariable({
      name: 'scvm',
      label: '자원',
      value: 'a',
      text: 'Alpha',
      options: [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Beta' },
      ],
    });
    const { user } = setup(true, variable);
    const overflowBefore = document.body.style.overflow;
    await user.click(screen.getByRole('button', { name: '자원: Alpha' }));
    expect(screen.getByRole('dialog', { name: '자원 선택' })).toBeInTheDocument();
    // The native list must live inside its host popup, without a second body portal/scroll lock.
    expect(screen.getByText('Beta', { exact: true }).closest('[role="dialog"]')).toBe(
      screen.getByRole('dialog', { name: '자원 선택' })
    );
    expect(document.body.style.overflow).toBe(overflowBefore);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Beta', { exact: true }));
    expect(variable.state.value).toBe('b');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: '자원: Beta' })).toBeInTheDocument();
    act(() => variable.setState({ isReadOnly: true }));
    expect(screen.getByRole('button', { name: '자원: Beta' })).toBeDisabled();
    act(() => variable.setState({ hide: VariableHide.hideVariable }));
    expect(screen.queryByRole('button', { name: '자원: Beta' })).not.toBeInTheDocument();
  } finally {
    cleanup();
    // Let the Base UI focus-return animation frame finish before restoring jsdom styles.
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    computedStyle.mockRestore();
  }
});

it('commits multiple choices on native blur and keeps the summary in sync', async () => {
  // Same jsdom-only CSS resolver workaround as the native single-select test.
  const computedStyle = jest.spyOn(window, 'getComputedStyle').mockImplementation(() => {
    const style = document.createElement('div').style;
    style.display = 'block';
    style.visibility = 'visible';
    return style;
  });
  try {
    const variable = new CustomVariable({
      name: 'resource',
      label: '자원',
      value: ['a'],
      text: ['Alpha'],
      isMulti: true,
      options: [
        { value: 'a', label: 'Alpha' },
        { value: 'b', label: 'Beta' },
      ],
    });
    const { user } = setup(true, variable);
    await user.click(screen.getByRole('button', { name: '자원: Alpha' }));
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Beta', { exact: true }));
    fireEvent.blur(screen.getByRole('combobox'));
    await waitFor(() => expect(variable.state.value).toEqual(['a', 'b']));
    expect(screen.getByRole('button', { name: '자원: Alpha 외 1개' })).toBeInTheDocument();
  } finally {
    cleanup();
    // Let the Base UI focus-return animation frame finish before restoring jsdom styles.
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    computedStyle.mockRestore();
  }
});

it('preserves native manual-all versus All semantics and resolves real option labels including valid empty values', () => {
  const variable = new CustomVariable({
    name: 'resource',
    isMulti: true,
    includeAll: true,
    options: [
      { value: '', label: '기본 자원' },
      { value: 'b', label: '긴 자원명 B' },
    ],
    value: ['', 'b'],
    text: ['', 'b'],
  });
  expect(variableSelection(variable)).toEqual({ all: false, labels: ['기본 자원', '긴 자원명 B'] });
  variable.setState({ value: ['$__all'], text: ['All'] });
  expect(variableSelection(variable)).toEqual({ all: true, labels: ['전체'] });
  variable.setState({ value: '', text: '', options: [] });
  expect(variableSelectionSummary(variable)).toBe('미선택');
});
