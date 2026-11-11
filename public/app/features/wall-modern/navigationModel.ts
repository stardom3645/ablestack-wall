import type { DashboardSearchItem } from '../search/types';

import { categories, categoryOf, type WallCategory } from './model';

export type NavigationContext = WallCategory | 'favorites';
export function isNavigationContext(value: string | null): value is NavigationContext {
  return value === 'favorites' || categories.some((category) => category.id === value);
}

/** URL-owned scope. Direct dashboard links infer their category; explicit exploration stays in context. */
export function navigationContext(
  pathname: string,
  search: string,
  dashboards: DashboardSearchItem[]
): NavigationContext {
  const params = new URLSearchParams(search);
  if (pathname.startsWith('/dashboards')) {
    if (params.has('starred')) {
      return 'favorites';
    }
    const category = params.get('category');
    return isNavigationContext(category) ? category : 'all';
  }
  const explicit = params.get('wallNav');
  if (isNavigationContext(explicit)) {
    return explicit;
  }
  const dashboard = dashboards.find((item) => item.uid === pathname.split('/')[2]);
  return dashboard ? categoryOf(dashboard) : 'all';
}

export function navigationItems(
  items: DashboardSearchItem[],
  context: NavigationContext,
  folderUid?: string,
  query = ''
) {
  const needle = query.trim().toLocaleLowerCase();
  return items.filter(
    (item) =>
      (!folderUid || item.folderUid === folderUid) &&
      (context === 'all' || (context === 'favorites' ? item.isStarred : categoryOf(item) === context)) &&
      (!needle ||
        `${item.title} ${item.folderTitle ?? ''} ${(item.tags ?? []).join(' ')}`.toLocaleLowerCase().includes(needle))
  );
}

export function dashboardNavigationHref(url: string, context: NavigationContext) {
  const [path, search] = url.split('?');
  const params = new URLSearchParams(search);
  params.set('wallNav', context);
  return `${path}?${params}`;
}
