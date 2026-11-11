import { locationUtil, type NavIndex, type NavModelItem } from '@grafana/data';

export interface ManagementGroup {
  id: string;
  label: string;
  items: Array<{ id: string; label: string; href: string }>;
}
export function isWallManagementRoute(path: string) {
  return /^\/(admin|org|plugins|datasources|connections)(\/|$)/.test(path);
}
const labels: Record<string, string> = {
  'connections-datasources': '데이터 소스',
  datasources: '데이터 소스',
  plugins: '플러그인',
  'connections-add-new-connection': '연결 추가',
  'global-users': '사용자',
  users: '조직 사용자',
  'global-orgs': '조직',
  teams: '팀',
  serviceaccounts: '서비스 계정',
  apikeys: 'API 키',
  'org-settings': '조직 기본 설정',
  'server-settings': '서버 설정',
  settings: '서버 설정',
  authentication: '인증',
  correlations: '상관관계',
  'feature-toggles': '기능 플래그',
};
/** Consume the server's permission/feature-filtered tree. Never infer access from a username. */
export function managementNavigation(index: NavIndex): ManagementGroup[] {
  const groups: ManagementGroup[] = [
    { id: 'data', label: '데이터 및 확장', items: [] },
    { id: 'access', label: '사용자 및 접근', items: [] },
    { id: 'system', label: '시스템 관리', items: [] },
  ];
  const seen = new Set<string>();
  function visit(node: NavModelItem, category: number) {
    if ('hideFromMenu' in node && node.hideFromMenu) {
      return;
    }
    const key = node.id ?? '';
    const next =
      key.includes('plugins') || key === 'connections'
        ? 0
        : key.includes('access') ||
            ['global-orgs', 'global-users', 'users', 'teams', 'serviceaccounts', 'apikeys'].includes(key)
          ? 1
          : category;
    if (node.children?.length) {
      node.children.forEach((child) => visit(child, next));
      return;
    }
    if (!node.url || node.url.startsWith('#') || /^cfg\//.test(key)) {
      return;
    }
    const href = locationUtil.stripBaseFromUrl(node.url);
    if (!isWallManagementRoute(href) || seen.has(href)) {
      return;
    }
    seen.add(href);
    groups[next].items.push({ id: key || href, label: labels[key] ?? node.text, href });
  }
  for (const key of ['connections', 'cfg', 'administration', 'admin']) {
    if (index[key]) {
      visit(index[key], key === 'connections' ? 0 : 2);
    }
  }
  const dataOrder: Record<string, number> = { 'connections-datasources': 0, datasources: 0, plugins: 1 };
  groups[0].items.sort((a, b) => (dataOrder[a.id] ?? 2) - (dataOrder[b.id] ?? 2));
  return groups.filter((group) => group.items.length);
}
export function activeManagementHref(groups: ManagementGroup[], pathname: string) {
  return groups
    .flatMap((group) => group.items)
    .filter(({ href }) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}
