import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom-v5-compat';

import { locationService } from '@grafana/runtime';

import type { DashboardSearchItem } from '../search/types';

import { WallNavigation } from './WallNavigation';
import { useNetdiveURL } from './useNetdiveURL';

jest.mock('./assets/ablestack-mark.png', () => 'wall-mark.png');
jest.mock('./useNetdiveURL', () => ({ useNetdiveURL: jest.fn() }));

it('adds one general Netdive entry only with explicit configuration, using the existing primary item', () => {
  jest.mocked(useNetdiveURL).mockReturnValue('http://netdive.test:8082/ui_v2/');
  const { rerender } = render(ui());
  expect(screen.getAllByRole('link', { name: 'Netdive' })).toHaveLength(1);
  expect(screen.getByRole('link', { name: 'Netdive' })).toHaveAttribute('target', '_blank');
  jest.mocked(useNetdiveURL).mockReturnValue(undefined);
  rerender(ui());
  expect(screen.queryByRole('link', { name: 'Netdive' })).not.toBeInTheDocument();
});
const vm: DashboardSearchItem = {
  uid: 'vm',
  title: '가상머신 상세',
  url: '/d/vm/details',
  uri: '',
  type: 'dash-db',
  tags: [],
  isStarred: true,
};
const host: DashboardSearchItem = {
  ...vm,
  uid: 'host',
  title: '호스트 현황',
  url: '/d/host/details',
  isStarred: false,
};
const items = [vm, host];
const ui = (search = '', pathname = '/dashboards', dashboards = items, adminHref?: string) => (
  <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <WallNavigation
      dashboards={dashboards}
      pathname={pathname}
      search={search}
      managementGroups={
        adminHref
          ? [{ id: 'system', label: '시스템 관리', items: [{ id: 'settings', label: '서버 설정', href: adminHref }] }]
          : []
      }
      alertHref="/alerting/list"
    />
  </MemoryRouter>
);

it('shows one symbol and nine primary scopes, with text-only contextual dashboard links', () => {
  const { container } = render(ui('', '/d/vm/details'));
  expect(container.querySelectorAll('img')).toHaveLength(1);
  const primary = within(screen.getByRole('navigation', { name: '주 기능' }));
  for (const name of [
    '대시보드',
    '즐겨찾기',
    '종합 현황',
    '호스트',
    '가상머신',
    '자원 예측',
    '로그',
    '경보',
    '보고서',
  ]) {
    expect(primary.getByRole('link', { name })).toBeInTheDocument();
  }
  expect(primary.getByRole('link', { name: '가상머신' })).toHaveAttribute('aria-current', 'page');
  expect(container.querySelectorAll('.wall-navigation-primary .wall-nav-item[aria-current="page"]')).toHaveLength(1);
  const list = within(screen.getByRole('navigation', { name: '가상머신 목록' }));
  expect(list.getByRole('link', { name: vm.title })).toHaveAttribute('href', '/d/vm/details?wallNav=vms');
  expect(list.queryByRole('link', { name: host.title })).not.toBeInTheDocument();
  expect(container.querySelectorAll('.wall-context-list svg')).toHaveLength(0);
});

it('restores favorite scope from URL, keeps folding functional, and reflects unstarred results', async () => {
  const { rerender } = render(ui('?starred'));
  await userEvent.click(screen.getByRole('link', { name: '즐겨찾기' }));
  await userEvent.click(screen.getByRole('link', { name: '즐겨찾기' }));
  expect(
    within(screen.getByRole('navigation', { name: '즐겨찾기 목록' })).getByRole('link', { name: vm.title })
  ).toBeVisible();
  rerender(ui('?starred', '/dashboards', [{ ...vm, isStarred: false }, host]));
  expect(screen.getByText('즐겨찾기가 없습니다.')).toBeVisible();
});

it('opens the secondary rail without resetting the active dashboard, and changes other scopes through URL state', async () => {
  const expand = jest.fn();
  const partial = jest.spyOn(locationService, 'partial').mockImplementation(() => {});
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WallNavigation dashboards={items} pathname="/d/vm/details" onExpand={expand} />
    </MemoryRouter>
  );
  await userEvent.click(screen.getByRole('link', { name: '가상머신' }));
  expect(expand).toHaveBeenCalledTimes(1);
  expect(partial).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('link', { name: '호스트' }));
  expect(partial).toHaveBeenCalledWith({ wallNav: 'hosts' });
  partial.mockRestore();
});

it('keeps category lists free of duplicate folder/search controls and preserves permission-filtered destinations', () => {
  const { rerender } = render(ui());
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /폴더 탐색/ })).not.toBeInTheDocument();
  const list = within(screen.getByRole('navigation', { name: '전체 대시보드 목록' }));
  expect(list.getByRole('link', { name: host.title })).toBeVisible();
  expect(list.getByRole('link', { name: vm.title })).toBeVisible();
  expect(screen.queryByRole('link', { name: '관리' })).not.toBeInTheDocument();
  rerender(ui('?category=alerts', '/dashboards', items, '/admin'));
  expect(screen.getByRole('link', { name: '관리' })).toHaveAttribute('href', '/admin');
  expect(screen.getByRole('link', { name: '경보 관리' })).toHaveAttribute('href', '/alerting/list');
});

it('places the context under its owner and keeps that branch mounted when globally collapsed', () => {
  const navigation = (search: string, collapsed = false) => (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WallNavigation dashboards={items} pathname="/dashboards" search={search} collapsed={collapsed} />
    </MemoryRouter>
  );
  const { rerender, container } = render(navigation('?category=hosts'));
  expect(screen.getByRole('navigation', { name: '호스트 목록' }).closest('[data-navigation-branch]')).toHaveAttribute(
    'data-navigation-branch',
    'hosts'
  );
  rerender(navigation('?category=vms'));
  const list = screen.getByRole('navigation', { name: '가상머신 목록' });
  const panel = container.querySelector('#wall-nav-panel-vms');
  expect(list.closest('[data-navigation-branch]')).toHaveAttribute('data-navigation-branch', 'vms');
  rerender(navigation('?category=vms', true));
  expect(panel).toHaveAttribute('inert');
  expect(panel).toHaveAttribute('aria-hidden', 'true');
  rerender(navigation('?category=vms'));
  expect(screen.getByRole('navigation', { name: '가상머신 목록' })).toBe(list);
  expect(panel).not.toHaveAttribute('inert');
});

it('shows management groups and the longest matching active destination, preserving dashboard navigation', async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WallNavigation
        dashboards={items}
        pathname="/connections/datasources/edit/test"
        managementGroups={[
          {
            id: 'data',
            label: '데이터 및 확장',
            items: [
              { id: 'ds', label: '데이터 소스', href: '/connections/datasources' },
              { id: 'plugins', label: '플러그인', href: '/plugins' },
            ],
          },
        ]}
      />
    </MemoryRouter>
  );
  expect(screen.getByRole('link', { name: '관리' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: '데이터 소스' })).toHaveAttribute('aria-current', 'page');
  expect(screen.queryByRole('textbox', { name: '메뉴 대시보드 검색' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: '대시보드' })).not.toHaveAttribute('aria-current');
  await userEvent.click(screen.getByRole('button', { name: '데이터 및 확장' }));
});

it('keeps advanced management links collapsed initially and reveals the current destination', async () => {
  const groups = [
    { id: 'access', label: '사용자 및 접근', items: [{ id: 'users', label: '사용자', href: '/admin/users' }] },
    {
      id: 'advanced',
      label: '고급',
      items: [
        { id: 'teams', label: '팀', href: '/org/teams' },
        { id: 'correlations', label: '상관관계', href: '/datasources/correlations' },
      ],
    },
  ];
  const view = (pathname: string) => (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WallNavigation dashboards={items} managementGroups={groups} pathname={pathname} />
    </MemoryRouter>
  );
  const { rerender } = render(view('/admin/users'));
  expect(screen.getByRole('link', { name: '사용자' })).toBeVisible();
  expect(screen.queryByRole('link', { name: '팀' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: '고급' }));
  expect(await screen.findByRole('link', { name: '팀' })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: '고급' }));
  rerender(view('/org/teams/edit/123'));
  expect(await screen.findByRole('link', { name: '팀' })).toHaveAttribute('aria-current', 'page');
});

it('uses the same icon-and-label links when expanded and hides only their labels when collapsed', async () => {
  const view = (collapsed: boolean) => (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WallNavigation dashboards={items} pathname="/dashboards" collapsed={collapsed} />
    </MemoryRouter>
  );
  const { rerender, container } = render(view(false));
  const link = screen.getByRole('link', { name: '호스트' });
  const label = within(link).getByText('호스트');
  expect(label).not.toHaveAttribute('aria-hidden');
  expect(container.querySelectorAll('.wall-navigation-brand img')).toHaveLength(1);
  rerender(view(true));
  expect(screen.getByRole('link', { name: '호스트' })).toBe(link);
  expect(label).toHaveAttribute('aria-hidden', 'true');
  rerender(view(false));
  expect(screen.getByRole('link', { name: '호스트' })).toBe(link);
});

it('preserves the existing folder URL scope without repeating folder controls inside categories', () => {
  const folder = { ...host, uid: 'folder', title: '운영', url: '/dashboards/f/folder/operations' };
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WallNavigation
        dashboards={[{ ...host, folderUid: 'folder' }, vm]}
        folders={[folder]}
        pathname="/dashboards/f/folder/operations"
        search="?category=hosts&query=cpu"
      />
    </MemoryRouter>
  );
  expect(screen.getByRole('link', { name: '호스트' })).toHaveAttribute(
    'href',
    '/dashboards/f/folder/operations?category=hosts&query=cpu'
  );
  expect(screen.getByRole('navigation', { name: '호스트 목록' })).toHaveTextContent(host.title);
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});

it('keeps native alert routes selected and dismisses only navigation-owned Escape events', async () => {
  const close = jest.fn();
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WallNavigation dashboards={items} pathname="/alerting/list" onCollapse={close} />
    </MemoryRouter>
  );
  expect(screen.getByRole('link', { name: '경보' })).toHaveAttribute('aria-current', 'page');
  await userEvent.click(screen.getByRole('link', { name: '경보' }));
  await userEvent.keyboard('{Escape}');
  expect(close).toHaveBeenCalledTimes(1);
});

it('keeps management scrolling separate from the dashboard scope', () => {
  const { container, rerender } = render(ui('', '/dashboards', items, '/admin/users'));
  const scroll = container.querySelector<HTMLDivElement>('.wall-navigation-body')!;
  scroll.scrollTop = 80;
  fireEvent.scroll(scroll);
  rerender(ui('', '/admin/users', items, '/admin/users'));
  const managementScroll = container.querySelector<HTMLDivElement>('.wall-navigation-body')!;
  expect(managementScroll.scrollTop).toBe(0);
  managementScroll.scrollTop = 20;
  fireEvent.scroll(managementScroll);
  rerender(ui('', '/dashboards', items, '/admin/users'));
  expect(container.querySelector<HTMLDivElement>('.wall-navigation-body')?.scrollTop).toBe(80);
});

it('navigates back to dashboards from management instead of treating the default scope as an active library', async () => {
  const Location = () => {
    const location = useLocation();
    return <output aria-label="현재 경로">{location.pathname}</output>;
  };
  render(
    <MemoryRouter initialEntries={['/admin/users']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WallNavigation dashboards={items} pathname="/admin/users" />
      <Location />
    </MemoryRouter>
  );
  await userEvent.click(screen.getByRole('link', { name: '대시보드' }));
  expect(screen.getByLabelText('현재 경로')).toHaveTextContent('/dashboards');
});

it('toggles the selected branch without changing its route and nests management under its own row', async () => {
  const { container, rerender } = render(ui('?category=hosts'));
  const host = screen.getByRole('link', { name: '호스트' });
  expect(host).toHaveAttribute('aria-expanded', 'true');
  await userEvent.click(host);
  expect(host).toHaveAttribute('aria-expanded', 'false');
  expect(container.querySelector('#wall-nav-panel-hosts')).toHaveAttribute('inert');
  await userEvent.click(host);
  expect(host).toHaveAttribute('aria-expanded', 'true');
  rerender(ui('', '/admin/users', items, '/admin/users'));
  expect(screen.getByRole('navigation', { name: '관리 메뉴' }).closest('[data-navigation-branch]')).toHaveAttribute(
    'data-navigation-branch',
    'management'
  );
  const management = screen.getByRole('link', { name: '관리' });
  await userEvent.click(management);
  expect(management).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(management);
  expect(management).toHaveAttribute('aria-expanded', 'true');
});
