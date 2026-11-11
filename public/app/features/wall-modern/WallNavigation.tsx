import { Input } from '@base-ui/react/input';
import { Menu } from '@base-ui/react/menu';
import { Tooltip } from '@base-ui/react/tooltip';
import {
  Activity,
  Bell,
  ChartColumn,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  Cpu,
  Folder,
  LayoutGrid,
  Search,
  ScrollText,
  Server,
  Settings,
  Star,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useLayoutEffect, useRef, useState, type MouseEvent, type ReactElement } from 'react';
import { Link } from 'react-router-dom-v5-compat';

import { locationUtil } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { useTheme2 } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';
import type { DashboardSearchItem } from 'app/features/search/types';

import brandMark from './assets/ablestack-mark.png';
import { Collapsible } from './components/ui/collapsible';
import { activeManagementHref, isWallManagementRoute, type ManagementGroup } from './managementNavigation';
import { categories } from './model';
import { dashboardNavigationHref, navigationContext, navigationItems, type NavigationContext } from './navigationModel';
import { wallSurfaceVariables } from './surfaceTokens';
import { wallTypographyVariables } from './typography';
import { Button } from './ui';

const icons = {
  all: LayoutGrid,
  overview: Activity,
  hosts: Server,
  vms: Cpu,
  forecast: ChartNoAxesCombined,
  logs: ScrollText,
  alerts: Bell,
  reports: ChartColumn,
};

function PrimaryItem({
  label,
  icon: Icon,
  to,
  current = false,
  external,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  to: string;
  current?: boolean;
  external?: boolean;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}) {
  const theme = useTheme2();
  const target: ReactElement = external ? (
    <a href={to} target="_blank" rel="noreferrer" aria-label={label} />
  ) : (
    <Link to={to} />
  );
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={target}
        className={`wall-nav-item ${current ? 'is-current' : ''}`}
        aria-label={label}
        aria-current={current ? 'page' : undefined}
        onClick={onClick}
      >
        <Icon size={19} aria-hidden="true" />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner side="right" sideOffset={10} className="wall-menu-positioner">
          <Tooltip.Popup
            className="wall-modern wall-nav-tooltip"
            data-wall-theme={theme.isDark ? 'dark' : 'light'}
            style={{ ...wallTypographyVariables, ...wallSurfaceVariables(theme.isDark, true) }}
          >
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function WallNavigation({
  dashboards,
  folders = [],
  pathname,
  search = '',
  loading = false,
  collapsed = false,
  onExpand,
  alertHref,
  managementGroups = [],
}: {
  dashboards: DashboardSearchItem[];
  folders?: DashboardSearchItem[];
  pathname: string;
  search?: string;
  loading?: boolean;
  collapsed?: boolean;
  onExpand?: () => void;
  alertHref?: string;
  managementGroups?: ManagementGroup[];
}) {
  const theme = useTheme2();
  const management = isWallManagementRoute(pathname);
  const activeAdmin = activeManagementHref(managementGroups, pathname);
  const adminHref = managementGroups[0]?.items[0]?.href;
  const isLibrary = pathname.startsWith('/dashboards');
  const folderId = isLibrary && pathname.split('/')[2] === 'f' ? pathname.split('/')[3] : undefined;
  const currentFolder = folders.find((folder) => folder.uid === folderId);
  const context = navigationContext(pathname, search, dashboards);
  const title = context === 'favorites' ? '즐겨찾기' : categories.find((category) => category.id === context)!.label;
  const [queries, setQueries] = useState<Record<string, string>>({});
  const [folded, setFolded] = useState<Record<string, boolean>>({});
  const contextKey = `${context}:${folderId ?? ''}`;
  const query = queries[contextKey] ?? '';
  const scoped = navigationItems(dashboards, context, folderId);
  const visible = navigationItems(dashboards, context, folderId, query);
  const scroll = useRef<HTMLDivElement>(null);
  const secondary = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    // Keep the paint tree for its exit transition, but remove closed navigation
    // from keyboard/pointer interaction immediately.
    secondary.current?.toggleAttribute('inert', collapsed);
  }, [collapsed]);
  const scrollPositions = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    if (scroll.current) {
      scroll.current.scrollTop = scrollPositions.current.get(contextKey) ?? 0;
    }
  }, [contextKey]);

  const scopeHref = (value: NavigationContext, folder: DashboardSearchItem | null | undefined = currentFolder) => {
    const params = new URLSearchParams();
    if (value === 'favorites') {
      params.set('starred', '');
    } else if (value !== 'all') {
      params.set('category', value);
    }
    const globalQuery = isLibrary ? new URLSearchParams(search).get('query') : null;
    if (globalQuery) {
      params.set('query', globalQuery);
    }
    return `${folder ? locationUtil.stripBaseFromUrl(folder.url) : '/dashboards'}${params.toString() ? `?${params}` : ''}`;
  };
  const selectContext = (value: NavigationContext) => (event: MouseEvent<HTMLElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    onExpand?.();
    if (pathname.startsWith('/d/')) {
      event.preventDefault();
      if (context !== value) {
        locationService.partial({ wallNav: value });
      }
    } else if (context === value) {
      event.preventDefault();
    }
  };
  return (
    <Tooltip.Provider delay={300}>
      <div id="wall-sidebar" className="wall-dual-navigation" aria-label="Wall 내비게이션">
        <nav className="wall-primary-rail" aria-label="주 기능">
          <Link to="/dashboards" className="wall-rail-brand" aria-label="ABLESTACK Wall 홈">
            <img src={brandMark} alt="" />
          </Link>
          <div className="wall-primary-rail-scroll">
            <PrimaryItem
              to={scopeHref('all')}
              label="대시보드"
              icon={LayoutGrid}
              current={!management && context === 'all'}
              onClick={selectContext('all')}
            />
            <PrimaryItem
              to={scopeHref('favorites')}
              label="즐겨찾기"
              icon={Star}
              current={!management && context === 'favorites'}
              onClick={selectContext('favorites')}
            />
            {categories
              .filter((category) => category.id !== 'all')
              .map((category) => (
                <PrimaryItem
                  key={category.id}
                  to={scopeHref(category.id)}
                  label={category.label}
                  icon={icons[category.id]}
                  current={!management && context === category.id}
                  onClick={selectContext(category.id)}
                />
              ))}
          </div>
          <div className="wall-primary-rail-bottom">
            {adminHref && (
              <PrimaryItem
                to={adminHref}
                label="관리"
                icon={Settings}
                current={management}
                onClick={(event) => {
                  onExpand?.();
                  if (
                    management &&
                    event.button === 0 &&
                    !event.metaKey &&
                    !event.ctrlKey &&
                    !event.shiftKey &&
                    !event.altKey
                  ) {
                    event.preventDefault();
                  }
                }}
              />
            )}
            <PrimaryItem to="https://docs.ablecloud.io/" external label="도움말" icon={CircleHelp} />
          </div>
        </nav>
        <aside
          ref={secondary}
          id="wall-secondary-nav"
          className="wall-sidebar"
          aria-label="상세 탐색"
          aria-hidden={collapsed || undefined}
        >
          <Link className="wall-brand" to="/dashboards" aria-label="ABLESTACK Wall">
            <span className="wall-brand-text">
              <strong>
                <Trans i18nKey="wall.wall-navigation.text-d2883732">ABLESTACK</Trans>
              </strong>
              <small>
                <Trans i18nKey="wall.wall-navigation.text-ab8c5783">Wall Monitoring</Trans>
              </small>
            </span>
          </Link>
          {!management && (
            <div className="wall-navigation-scope">
              <Menu.Root>
                <Menu.Trigger
                  render={<Button variant="outline" />}
                  className="wall-folder-scope"
                  aria-label={`폴더 탐색: ${currentFolder?.title ?? '모든 폴더'}`}
                >
                  <Folder size={16} />
                  <span>{currentFolder?.title ?? '모든 폴더'}</span>
                  <ChevronDown size={14} />
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner sideOffset={6} align="start" className="wall-menu-positioner">
                    <Menu.Popup
                      className="wall-modern wall-menu"
                      data-wall-theme={theme.isDark ? 'dark' : 'light'}
                      style={{ ...wallTypographyVariables, ...wallSurfaceVariables(theme.isDark, true) }}
                      aria-label="폴더 탐색"
                    >
                      <Menu.Item className="wall-menu-item" render={<Link to={scopeHref(context, null)} />}>
                        <Trans i18nKey="wall.wall-navigation.text-c5f3da5f">모든 폴더</Trans>
                      </Menu.Item>
                      {folders.map((folder) => (
                        <Menu.Item
                          key={folder.uid}
                          className="wall-menu-item"
                          render={<Link to={scopeHref(context, folder)} />}
                        >
                          {folder.title}
                        </Menu.Item>
                      ))}
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </div>
          )}
          <div
            className="wall-sidebar-scroll"
            ref={scroll}
            onScroll={(event) => scrollPositions.current.set(contextKey, event.currentTarget.scrollTop)}
          >
            {management ? (
              <nav className="wall-secondary-context wall-management-nav" aria-label="관리 메뉴">
                {managementGroups.map((group) => (
                  <Collapsible.Root key={group.id} defaultOpen className="wall-nav-section">
                    <Collapsible.Trigger render={<Button variant="ghost" />} className="wall-nav-group-trigger">
                      <span className="wall-nav-group-text">{group.label}</span>
                      <ChevronDown size={13} />
                    </Collapsible.Trigger>
                    <Collapsible.Panel>
                      {group.items.map((item) => (
                        <Link
                          key={item.id}
                          to={item.href}
                          className={`wall-secondary-item ${activeAdmin === item.href ? 'is-current' : ''}`}
                          aria-current={activeAdmin === item.href ? 'page' : undefined}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </Collapsible.Panel>
                  </Collapsible.Root>
                ))}
              </nav>
            ) : (
              <div className="wall-secondary-context" data-navigation-context={context}>
                <div className="wall-nav-search">
                  <Search size={15} aria-hidden="true" />
                  <Input
                    aria-label="메뉴 대시보드 검색"
                    placeholder="대시보드 찾기"
                    value={query}
                    onValueChange={(value) => setQueries((previous) => ({ ...previous, [contextKey]: value }))}
                  />
                  {query && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="메뉴 검색어 지우기"
                      onClick={() => setQueries((previous) => ({ ...previous, [contextKey]: '' }))}
                    >
                      <X size={13} />
                    </Button>
                  )}
                </div>
                <Collapsible.Root
                  open={!folded[contextKey]}
                  onOpenChange={(open) => setFolded((previous) => ({ ...previous, [contextKey]: !open }))}
                  className="wall-nav-section wall-context-section"
                >
                  <Collapsible.Trigger render={<Button variant="ghost" />} className="wall-nav-group-trigger">
                    <span className="wall-nav-group-text">{title}</span>
                    <span className="wall-nav-group-count">{loading ? '…' : visible.length}</span>
                    <ChevronDown size={13} />
                  </Collapsible.Trigger>
                  <Collapsible.Panel>
                    <nav className="wall-context-list" aria-label={`${title} 목록`} aria-busy={loading}>
                      {loading ? (
                        <p className="wall-nav-empty" role="status">
                          <Trans i18nKey="wall.wall-navigation.text-fe85291a">대시보드를 불러오는 중</Trans>
                        </p>
                      ) : (
                        visible.map((item) => (
                          <Link
                            key={item.uid}
                            to={dashboardNavigationHref(locationUtil.stripBaseFromUrl(item.url), context)}
                            className={`wall-secondary-item ${pathname.split('/')[2] === item.uid ? 'is-current' : ''}`}
                            aria-current={pathname.split('/')[2] === item.uid ? 'page' : undefined}
                            title={item.title}
                          >
                            {item.title}
                          </Link>
                        ))
                      )}
                      {!loading && !visible.length && (
                        <p className="wall-nav-empty">
                          {query
                            ? '검색 결과가 없습니다.'
                            : context === 'favorites'
                              ? '즐겨찾기가 없습니다.'
                              : '이 범위의 대시보드가 없습니다.'}
                        </p>
                      )}
                    </nav>
                  </Collapsible.Panel>
                </Collapsible.Root>
                {context === 'alerts' && alertHref && (
                  <Link className="wall-secondary-item wall-native-navigation" to={alertHref}>
                    <Trans i18nKey="wall.wall-navigation.text-fa117646">경보 관리</Trans>
                  </Link>
                )}
                {!loading && query && (
                  <p className="wall-nav-results">
                    {scoped.length}
                    <Trans i18nKey="wall.wall-navigation.text-c9795acd">개 중 </Trans>
                    {visible.length}
                    <Trans i18nKey="wall.wall-navigation.text-91be2e44">개 표시</Trans>
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </Tooltip.Provider>
  );
}
