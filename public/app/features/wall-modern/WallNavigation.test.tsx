import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom-v5-compat';

import { locationService } from '@grafana/runtime';

import type { DashboardSearchItem } from '../search/types';

import { WallNavigation } from './WallNavigation';

jest.mock('./assets/ablestack-mark.png', () => 'wall-mark.png');
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
  expect(container.querySelectorAll('.wall-primary-rail [aria-current="page"]')).toHaveLength(1);
  const list = within(screen.getByRole('navigation', { name: '가상머신 목록' }));
  expect(list.getByRole('link', { name: vm.title })).toHaveAttribute('href', '/d/vm/details?wallNav=vms');
  expect(list.queryByRole('link', { name: host.title })).not.toBeInTheDocument();
  expect(container.querySelectorAll('.wall-context-list svg')).toHaveLength(0);
});

it('restores favorite scope from URL, keeps folding functional, and reflects unstarred results', async () => {
  const { rerender } = render(ui('?starred'));
  await userEvent.click(screen.getByRole('button', { name: /즐겨찾기 1/ }));
  await userEvent.click(screen.getByRole('button', { name: /즐겨찾기 1/ }));
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

it('filters only the detailed list and preserves permission-filtered management destinations', async () => {
  const { rerender } = render(ui());
  await userEvent.type(screen.getByRole('textbox', { name: '메뉴 대시보드 검색' }), '호스트');
  const list = within(screen.getByRole('navigation', { name: '전체 대시보드 목록' }));
  expect(list.getByRole('link', { name: host.title })).toBeVisible();
  expect(list.queryByRole('link', { name: vm.title })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: '관리' })).not.toBeInTheDocument();
  rerender(ui('?category=alerts', '/dashboards', items, '/admin'));
  expect(screen.getByRole('link', { name: '관리' })).toHaveAttribute('href', '/admin');
  expect(screen.getByRole('link', { name: '경보 관리' })).toHaveAttribute('href', '/alerting/list');
});

it('keeps the navigation subtree stable across scopes and disables closed rail interaction without unmounting', () => {
  const navigation = (search: string, collapsed = false) => (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WallNavigation dashboards={items} pathname="/dashboards" search={search} collapsed={collapsed} />
    </MemoryRouter>
  );
  const { rerender, container } = render(navigation('?category=hosts'));
  const input = screen.getByRole('textbox', { name: '메뉴 대시보드 검색' });
  const secondary = container.querySelector('#wall-secondary-nav')!;
  rerender(navigation('?category=vms'));
  expect(screen.getByRole('textbox', { name: '메뉴 대시보드 검색' })).toBe(input);
  expect(screen.getByRole('navigation', { name: '가상머신 목록' })).toBeVisible();
  rerender(navigation('?category=vms', true));
  expect(container.querySelector('#wall-secondary-nav')).toBe(secondary);
  expect(secondary).toHaveAttribute('inert');
  expect(secondary).toHaveAttribute('aria-hidden', 'true');
  rerender(navigation('?category=vms'));
  expect(screen.getByRole('textbox', { name: '메뉴 대시보드 검색' })).toBe(input);
  expect(secondary).not.toHaveAttribute('inert');
  expect(secondary).not.toHaveAttribute('aria-hidden');
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
  expect(screen.getByRole('link', { name: '대시보드', exact: true })).not.toHaveAttribute('aria-current');
  await userEvent.click(screen.getByRole('button', { name: '데이터 및 확장' }));
});
