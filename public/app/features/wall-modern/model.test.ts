import type { DashboardSearchItem } from '../search/types';

import { categoryOf, filterDashboards, isWallModernRoute } from './model';

const dashboard = (uid: string, title: string, extra: Partial<DashboardSearchItem> = {}): DashboardSearchItem => ({
  uid,
  title,
  type: 'dash-db',
  uri: '',
  url: `/d/${uid}`,
  tags: [],
  isStarred: false,
  ...extra,
});

describe('Wall route boundaries', () => {
  it.each([
    '/dashboards',
    '/dashboards/f/production',
    '/dashboards/f/production/hosts',
    '/d/overview',
    '/d/overview/summary',
  ])('modernizes %s', (path) => {
    expect(isWallModernRoute(path)).toBe(true);
  });
  it.each([
    '/login',
    '/alerting/list',
    '/dashboard/new',
    '/d-solo/overview',
    '/dashboards/f/production/hosts/alerting',
  ])('leaves %s unchanged', (path) => {
    expect(isWallModernRoute(path)).toBe(false);
  });
  it.each(['?kiosk', '?kiosk=tv', '?editPanel=7', '?viewPanel=7', '?editview=settings', '?fullscreen'])(
    'preserves embedded and editing layout %s',
    (query) => {
      expect(isWallModernRoute('/d/overview', query)).toBe(false);
    }
  );
  it('keeps ordinary variable, refresh and time parameters on the modern dashboard', () => {
    expect(isWallModernRoute('/d/overview', '?var-host=host1&from=now-6h&to=now&refresh=1m')).toBe(true);
  });
});

describe('Wall dashboard filtering', () => {
  const items = [
    dashboard('overview', '01. 종합 대시보드'),
    dashboard('host', '02. 호스트 종합 현황', { folderUid: 'infra', folderTitle: '인프라', isStarred: true }),
    dashboard('forecast', '09. 호스트 자원 사용량 추이 예측', { tags: ['capacity'] }),
    dashboard('folder', '인프라', { type: 'dash-folder' }),
  ];
  it('classifies forecasts before hosts without mutating saved tags or titles', () => {
    expect(categoryOf(items[2])).toBe('forecast');
    expect(items[2].tags).toEqual(['capacity']);
  });
  it('combines category, folder and favorites while excluding folders', () => {
    expect(filterDashboards(items, '인프라', 'hosts', true, 'infra').map((item) => item.uid)).toEqual(['host']);
  });
  it('searches actual tags and returns no invented dashboard for a miss', () => {
    expect(filterDashboards(items, 'CAPACITY', 'all', false).map((item) => item.uid)).toEqual(['forecast']);
    expect(filterDashboards(items, 'no such dashboard', 'all', false)).toEqual([]);
  });
});
