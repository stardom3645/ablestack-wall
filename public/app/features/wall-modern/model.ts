import type { DashboardSearchItem } from '../search/types';

import { isWallManagementRoute } from './managementNavigation';

export type WallCategory = 'all' | 'overview' | 'hosts' | 'vms' | 'forecast' | 'logs' | 'alerts' | 'reports';
export const categories: Array<{ id: WallCategory; label: string; description: string }> = [
  { id: 'all', label: '전체 대시보드', description: '모든 운영 대시보드를 한곳에서 확인하세요.' },
  { id: 'overview', label: '종합 현황', description: '인프라의 주요 지표와 상태를 한눈에 확인합니다.' },
  { id: 'hosts', label: '호스트', description: '호스트 상태와 자원 사용 현황을 확인합니다.' },
  { id: 'vms', label: '가상머신', description: '클라우드와 스토리지센터의 가상머신을 확인합니다.' },
  { id: 'forecast', label: '자원 예측', description: '자원 사용량 추이와 용량 예측을 확인합니다.' },
  { id: 'logs', label: '로그', description: '인프라의 로그를 확인합니다.' },
  { id: 'alerts', label: '경보', description: '운영 경보와 발생 현황을 확인합니다.' },
  { id: 'reports', label: '보고서', description: '클러스터와 가상머신 운영 보고서를 확인합니다.' },
];

// Presentation only: never write inferred categories back to dashboards or their tags.
export function categoryOf(item: Pick<DashboardSearchItem, 'title' | 'tags'>): WallCategory {
  const text = `${item.title} ${(item.tags ?? []).join(' ')}`;
  if (/보고서|report/i.test(text)) {
    return 'reports';
  }
  if (/경보|경고|alert/i.test(text)) {
    return 'alerts';
  }
  if (/로그|log/i.test(text)) {
    return 'logs';
  }
  if (/예측|forecast|prediction/i.test(text)) {
    return 'forecast';
  }
  if (/가상머신|가상 머신|\bvm\b/i.test(text)) {
    return 'vms';
  }
  if (/호스트|host/i.test(text)) {
    return 'hosts';
  }
  return 'overview';
}

/** Common dashboard presentation; query editors/settings keep their own frame. */
export function isWallDashboardPanelRoute(pathname: string, search = '') {
  const params = new URLSearchParams(search);
  return /^\/d\/[^/]+(?:\/[^/]+)?\/?$/.test(pathname) && !['editPanel', 'editview'].some((key) => params.has(key));
}

export function isWallModernRoute(pathname: string, search = '') {
  const path = pathname.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(search);
  // Embedded, solo, playlist and editing views retain their existing layout contract.
  if (['editPanel', 'viewPanel', 'editview', 'fullscreen'].some((key) => params.has(key))) {
    return false;
  }
  return (
    isWallManagementRoute(path) ||
    path === '/dashboards' ||
    /^\/dashboards\/f\/[^/]+(?:\/[^/]+)?$/.test(path) ||
    /^\/d\/[^/]+(?:\/[^/]+)?$/.test(path)
  );
}

export function filterDashboards(
  items: DashboardSearchItem[],
  query: string,
  category: string,
  starred: boolean,
  folder?: string
) {
  const needle = query.trim().toLocaleLowerCase();
  return items
    .filter(
      (item) =>
        item.type === 'dash-db' &&
        (!starred || item.isStarred) &&
        (!folder || item.folderUid === folder) &&
        (category === 'all' || categoryOf(item) === category) &&
        (!needle ||
          `${item.title} ${item.folderTitle ?? ''} ${(item.tags ?? []).join(' ')}`.toLocaleLowerCase().includes(needle))
    )
    .sort((a, b) => a.title.localeCompare(b.title, 'ko', { numeric: true }));
}
