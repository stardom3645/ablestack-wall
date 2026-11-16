import type { NavIndex } from '@grafana/data';

import { activeManagementHref, managementNavigation, isWallManagementRoute } from './managementNavigation';

const tree: NavIndex = {
  connections: {
    text: 'Connections',
    children: [{ id: 'connections-datasources', text: 'Data sources', url: '/connections/datasources' }],
  },
  cfg: {
    text: 'Administration',
    children: [
      { id: 'cfg/plugins', text: 'Plugins and data', children: [{ id: 'plugins', text: 'Plugins', url: '/plugins' }] },
      { id: 'cfg/access', text: 'Access', children: [{ id: 'teams', text: 'Teams', url: '/org/teams' }] },
      { id: 'cfg/general', text: 'General', children: [{ id: 'org-settings', text: 'Preferences', url: '/org' }] },
    ],
  },
};
it('restores cfg and connections without inventing server-admin or enterprise destinations', () => {
  const groups = managementNavigation(tree);
  expect(groups.map((g) => g.id)).toEqual(['data', 'system', 'advanced']);
  expect(groups.flatMap((g) => g.items).map((i) => i.href)).toEqual([
    '/connections/datasources',
    '/plugins',
    '/org',
    '/org/teams',
  ]);
  expect(JSON.stringify(groups)).not.toContain('/admin/orgs');
  expect(activeManagementHref(groups, '/org/teams/edit/123')).toBe('/org/teams');
});
it('preserves server-provided additional administration leaves, suppresses hidden/external/duplicate links', () => {
  const groups = managementNavigation({
    admin: {
      text: 'Server',
      children: [
        { id: 'global-orgs', text: 'Organizations', url: '/admin/orgs' },
        { id: 'server-settings', text: 'Settings', url: '/admin/settings' },
        { id: 'future', text: 'Future', url: '/admin/future' },
        { id: 'dup', text: 'duplicate', url: '/admin/future' },
        { id: 'external', text: 'external', url: 'https://example.com/' },
      ],
    },
  });
  expect(groups.flatMap((g) => g.items).map((i) => i.href)).toEqual([
    '/admin/orgs',
    '/admin/settings',
    '/admin/future',
  ]);
});
it('does not manufacture management access for a filtered empty tree', () => {
  expect(managementNavigation({ home: { text: 'Home', url: '/' } })).toEqual([]);
  expect(isWallManagementRoute('/d/admin/stats')).toBe(false);
  expect(isWallManagementRoute('/connections/datasources/edit/abc')).toBe(true);
});

it('moves only existing team and correlation links to advanced without expanding permissions', () => {
  const groups = managementNavigation({
    connections: {
      text: 'Connections',
      children: [{ id: 'correlations', text: 'Correlations', url: '/datasources/correlations' }],
    },
    cfg: tree.cfg,
  });
  expect(groups.find((group) => group.id === 'advanced')?.items.map((item) => item.href)).toEqual([
    '/datasources/correlations',
    '/org/teams',
  ]);
  expect(
    groups
      .filter((group) => group.id !== 'advanced')
      .flatMap((group) => group.items)
      .map((item) => item.href)
  ).not.toContain('/org/teams');
  const hiddenTeam = { id: 'teams', text: 'Teams', url: '/org/teams', hideFromMenu: true };
  expect(
    managementNavigation({
      cfg: { text: 'Admin', children: [hiddenTeam] },
    }).some((group) => group.id === 'advanced')
  ).toBe(false);
});
