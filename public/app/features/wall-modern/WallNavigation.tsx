import { Tooltip } from '@base-ui/react/tooltip';
import {
  Activity,
  Bell,
  ChartColumn,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  Cpu,
  Network,
  LayoutGrid,
  ScrollText,
  Server,
  Settings,
  Star,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactElement } from 'react';
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
import { useNetdiveURL } from './useNetdiveURL';

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
  collapsed = false,
  expanded,
  controls,
  count,
}: {
  label: string;
  icon: LucideIcon;
  to: string;
  current?: boolean;
  external?: boolean;
  collapsed?: boolean;
  expanded?: boolean;
  controls?: string;
  count?: number | string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}) {
  const theme = useTheme2();
  const target: ReactElement = external ? (
    <a href={to} target="_blank" rel="noopener noreferrer" aria-label={label} />
  ) : (
    <Link to={to} />
  );
  return (
    <Tooltip.Root disabled={!collapsed}>
      <Tooltip.Trigger
        render={target}
        className={`wall-nav-item ${current ? 'is-current' : ''}`}
        aria-label={label}
        aria-current={current ? 'page' : undefined}
        aria-expanded={expanded}
        aria-controls={controls}
        onClick={onClick}
      >
        <Icon size={19} aria-hidden="true" />
        <span className="wall-nav-item-label" aria-hidden={collapsed || undefined}>
          {label}
        </span>
        {expanded !== undefined && (
          <span className="wall-nav-disclosure" aria-hidden="true">
            {count !== undefined && <span className="wall-nav-group-count">{count}</span>}
            <ChevronDown size={14} />
          </span>
        )}
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

/** The existing link owns routing/disclosure; Base UI owns the panel height lifecycle. */
function NavigationBranch({
  id,
  open,
  trigger,
  children,
}: {
  id: string;
  open: boolean;
  trigger: ReactElement;
  children?: ReactElement;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    panel.current?.toggleAttribute('inert', !open);
  }, [open]);
  return (
    <Collapsible.Root open={open} className="wall-nav-branch" data-navigation-branch={id}>
      {trigger}
      <Collapsible.Panel ref={panel} id={`wall-nav-panel-${id}`} aria-hidden={!open || undefined}>
        {children}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

function ManagementSection({
  group,
  activeHref,
  onNavigate,
}: {
  group: ManagementGroup;
  activeHref?: string;
  onNavigate?: (event: MouseEvent<HTMLElement>) => void;
}) {
  const active = group.items.some((item) => item.href === activeHref);
  const [open, setOpen] = useState(group.id !== 'advanced' || active);
  useLayoutEffect(() => {
    if (active) {
      setOpen(true);
    }
  }, [active]);
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="wall-nav-section">
      <h3 className="wall-nav-group-heading">
        <Collapsible.Trigger render={<Button variant="ghost" />} className="wall-nav-group-trigger">
          <span className="wall-nav-group-text">{group.label}</span>
          <ChevronDown size={13} />
        </Collapsible.Trigger>
      </h3>
      <Collapsible.Panel>
        {group.items.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            title={item.label}
            onClick={onNavigate}
            className={`wall-secondary-item ${activeHref === item.href ? 'is-current' : ''}`}
            aria-current={activeHref === item.href ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

export function WallNavigation({
  dashboards,
  folders = [],
  pathname,
  search = '',
  loading = false,
  collapsed = false,
  compact = false,
  onExpand,
  onCollapse,
  alertHref,
  managementGroups = [],
}: {
  dashboards: DashboardSearchItem[];
  folders?: DashboardSearchItem[];
  pathname: string;
  search?: string;
  loading?: boolean;
  collapsed?: boolean;
  compact?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  alertHref?: string;
  managementGroups?: ManagementGroup[];
}) {
  const management = isWallManagementRoute(pathname);
  const netdiveURL = useNetdiveURL();
  const activeAdmin = activeManagementHref(managementGroups, pathname);
  const adminHref = managementGroups[0]?.items[0]?.href;
  const isLibrary = pathname.startsWith('/dashboards');
  const folderId = isLibrary && pathname.split('/')[2] === 'f' ? pathname.split('/')[3] : undefined;
  const currentFolder = folders.find((folder) => folder.uid === folderId);
  const context = navigationContext(pathname, search, dashboards);
  const title = context === 'favorites' ? '즐겨찾기' : categories.find((category) => category.id === context)!.label;
  const [folded, setFolded] = useState<Record<string, boolean>>({});
  const contextKey = `${context}:${folderId ?? ''}`;
  const scrollKey = management ? 'management' : contextKey;
  const visible = navigationItems(dashboards, context, folderId);
  const scroll = useRef<HTMLDivElement>(null);

  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        !collapsed &&
        event.target instanceof Node &&
        navigation.current?.contains(event.target)
      ) {
        onCollapse?.();
      }
    };
    const element = navigation.current;
    element?.addEventListener('keydown', dismiss);
    return () => element?.removeEventListener('keydown', dismiss);
  }, [collapsed, onCollapse]);
  const scrollPositions = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    if (scroll.current) {
      scroll.current.scrollTop = scrollPositions.current.get(scrollKey) ?? 0;
    }
  }, [scrollKey]);

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
    const sameScope = !management && context === value;
    const key = `${value}:${folderId ?? ''}`;
    setFolded((previous) => ({ ...previous, [key]: sameScope && !collapsed ? !previous[key] : false }));
    onExpand?.();
    if (pathname.startsWith('/d/')) {
      event.preventDefault();
      if (context !== value) {
        locationService.partial({ wallNav: value });
      }
    } else if (isLibrary && context === value) {
      event.preventDefault();
    }
  };
  const closeOnNavigate = (event: MouseEvent<HTMLElement>) => {
    if (
      !event.defaultPrevented &&
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      (compact || window.matchMedia('(max-width: 900px)').matches)
    ) {
      onCollapse?.();
    }
  };
  const branchOpen = !collapsed && !folded[scrollKey];
  const details = (
    <section
      id="wall-secondary-nav"
      className="wall-navigation-context wall-inline-context"
      aria-label="상세 탐색"
      aria-hidden={collapsed || undefined}
    >
      <div className="wall-sidebar-scroll">
        {management ? (
          <nav className="wall-secondary-context wall-management-nav" aria-label="관리 메뉴">
            {managementGroups.map((group) => (
              <ManagementSection key={group.id} group={group} activeHref={activeAdmin} onNavigate={closeOnNavigate} />
            ))}
          </nav>
        ) : (
          <div className="wall-secondary-context" data-navigation-context={context}>
            <nav className="wall-context-list" aria-label={`${title} 목록`} aria-busy={loading}>
              {loading ? (
                <p className="wall-nav-empty" role="status">
                  <Trans i18nKey="wall.wall-navigation.text-fe85291a">대시보드를 불러오는 중</Trans>
                </p>
              ) : (
                visible.map((item) => (
                  <Link
                    key={item.uid}
                    onClick={closeOnNavigate}
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
                  {context === 'favorites' ? '즐겨찾기가 없습니다.' : '이 범위의 대시보드가 없습니다.'}
                </p>
              )}
            </nav>

            {context === 'alerts' && alertHref && (
              <Link className="wall-secondary-item wall-native-navigation" to={alertHref} onClick={closeOnNavigate}>
                <Trans i18nKey="wall.wall-navigation.text-fa117646">경보 관리</Trans>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
  const branch = (value: NavigationContext, label: string, Icon: LucideIcon) => {
    const active = !management && context === value;
    const open = active && branchOpen;
    return (
      <NavigationBranch
        key={value}
        id={value}
        open={open}
        trigger={
          <PrimaryItem
            collapsed={collapsed}
            to={scopeHref(value)}
            label={label}
            icon={Icon}
            current={active}
            expanded={open}
            controls={`wall-nav-panel-${value}`}
            count={active ? (loading ? '…' : visible.length) : undefined}
            onClick={selectContext(value)}
          />
        }
      >
        {active ? details : undefined}
      </NavigationBranch>
    );
  };
  return (
    <Tooltip.Provider delay={300}>
      <div className="wall-navigation-frame">
        <aside ref={navigation} id="wall-sidebar" className="wall-navigation" aria-label="Wall 내비게이션">
          <Link to="/dashboards" className="wall-navigation-brand" aria-label="ABLESTACK Wall 홈">
            <img src={brandMark} alt="" />
            <span className="wall-brand-text" aria-hidden={collapsed || undefined}>
              <strong>
                <Trans i18nKey="wall.wall-navigation.text-d2883732">ABLESTACK</Trans>
              </strong>
              <small>
                <Trans i18nKey="wall.wall-navigation.text-ab8c5783">Wall Monitoring</Trans>
              </small>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="wall-navigation-mobile-close"
            aria-label="탐색 닫기"
            onClick={onCollapse}
          >
            <X size={17} />
          </Button>
          <div
            className="wall-navigation-body"
            role="region"
            ref={scroll}
            aria-label="메뉴 탐색"
            onScroll={(event) => scrollPositions.current.set(scrollKey, event.currentTarget.scrollTop)}
          >
            <nav className="wall-navigation-primary" aria-label="주 기능">
              <h2 className="wall-navigation-section-label" aria-hidden={collapsed || undefined}>
                <Trans i18nKey="wall.enterprise.text-22c51cdb">모니터링</Trans>
              </h2>
              {branch('all', '대시보드', LayoutGrid)}
              {branch('favorites', '즐겨찾기', Star)}
              {categories
                .filter((category) => category.id !== 'all')
                .map((category) => branch(category.id, category.label, icons[category.id]))}
              {(netdiveURL || adminHref) && (
                <h2 className="wall-navigation-section-label" aria-hidden={collapsed || undefined}>
                  <Trans i18nKey="wall.enterprise.text-60c6f1f9">연계 및 관리</Trans>
                </h2>
              )}
              {netdiveURL && (
                <PrimaryItem collapsed={collapsed} to={netdiveURL} external label="Netdive" icon={Network} />
              )}
              {adminHref && (
                <NavigationBranch
                  id="management"
                  open={management && branchOpen}
                  trigger={
                    <PrimaryItem
                      collapsed={collapsed}
                      to={adminHref}
                      label="관리"
                      icon={Settings}
                      current={management}
                      expanded={management && branchOpen}
                      controls="wall-nav-panel-management"
                      onClick={(event) => {
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
                        setFolded((previous) => ({
                          ...previous,
                          management: management && !collapsed ? !previous.management : false,
                        }));
                        onExpand?.();
                        if (management) {
                          event.preventDefault();
                        }
                      }}
                    />
                  }
                >
                  {management ? details : undefined}
                </NavigationBranch>
              )}
            </nav>
          </div>
          <footer className="wall-navigation-footer">
            <h2 className="wall-navigation-section-label" aria-hidden={collapsed || undefined}>
              <Trans i18nKey="wall.enterprise.text-3397eb88">지원</Trans>
            </h2>
            <PrimaryItem
              collapsed={collapsed}
              to="https://docs.ablecloud.io/"
              external
              label="도움말"
              icon={CircleHelp}
            />
          </footer>
        </aside>
        <button
          type="button"
          className="wall-navigation-backdrop"
          aria-label="탐색 닫기"
          tabIndex={-1}
          onClick={onCollapse}
        />
      </div>
    </Tooltip.Provider>
  );
}
