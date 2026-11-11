import type { DashboardSearchItem } from '../search/types';

import { dashboardNavigationHref, navigationContext, navigationItems } from './navigationModel';
const host: DashboardSearchItem = {
  uid: 'host',
  title: '호스트 현황',
  url: '/d/host/view',
  uri: '',
  tags: [],
  type: 'dash-db',
  isStarred: true,
  folderUid: 'ops',
};
const unknown = { ...host, uid: 'custom', title: '사용자 정의 화면', folderUid: 'other' };
it('resolves direct/reloaded dashboard, explicit exploration and library scopes from URLs', () => {
  expect(navigationContext('/d/host/view', '', [host])).toBe('hosts');
  expect(navigationContext('/d/host/view', '?wallNav=favorites', [host])).toBe('favorites');
  expect(navigationContext('/d/host/view', '?wallNav=logs', [host])).toBe('logs');
  expect(navigationContext('/d/host/view', '?wallNav=invalid', [host])).toBe('hosts');
  expect(navigationContext('/dashboards', '?category=logs', [host])).toBe('logs');
  expect(navigationContext('/dashboards', '?starred&category=hosts', [host])).toBe('favorites');
  expect(navigationContext('/d/not-in-search/view', '', [])).toBe('all');
});
it('includes every item in all scope and filters category/folder/favorites/search without mutating data', () => {
  const items = [host, { ...unknown, isStarred: false }];
  const original = JSON.stringify(items);
  expect(navigationItems(items, 'all')).toEqual(items);
  expect(navigationItems(items, 'favorites')).toEqual([host]);
  expect(navigationItems(items, 'hosts', 'ops', '호스트')).toEqual([host]);
  expect(navigationItems(items, 'vms')).toEqual([]);
  expect(JSON.stringify(items)).toBe(original);
});
it('preserves native target URL parameters when carrying exploration scope', () => {
  expect(dashboardNavigationHref('/d/host/view?orgId=2', 'favorites')).toBe('/d/host/view?orgId=2&wallNav=favorites');
});
