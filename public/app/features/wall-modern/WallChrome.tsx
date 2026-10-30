import { Menu } from '@base-ui/react/menu';
import {
  Activity,
  Bell,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Cpu,
  Database,
  FileText,
  LayoutGrid,
  ListFilter,
  Menu as MenuIcon,
  Moon,
  Search,
  Server,
  Settings,
  Star,
  Sun,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties, type PropsWithChildren, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom-v5-compat';

import { locationUtil } from '@grafana/data';
import { config } from '@grafana/runtime';
import { useTheme2 } from '@grafana/ui';
import { StatCardPresentationContext } from '@grafana/ui/src/components/BigValue/StatCardPresentation';
import { TimeSeriesStyleConfigContext } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { VizPresentationContext } from '@grafana/ui/src/components/VizPresentation/VizPresentation';
import { contextSrv } from 'app/core/services/context_srv';
import { toggleTheme } from 'app/core/services/theme';
import { useSelector } from 'app/types';

import brandMark from './assets/ablestack-mark.png';
import { isWallTimeSeriesRoute, wallTimeSeriesTokens } from './chartTokens';
import { categories, categoryOf, isWallModernRoute, type WallCategory } from './model';
import { isStorageStatPilot, wallStatCardPresentation } from './statPresentation';
import { wallSurfaceVariables } from './surfaceTokens';
import {
  WallFontStatusContext,
  WallTypographyContext,
  wallTypography,
  wallTypographyVariables,
  useWallTypographyFonts,
} from './typography';
import { Button } from './ui';
import { WallDashboardContext, useWallDashboardSource } from './useWallDashboards';
import './typography.css';
import { wallVisualization } from './visualization';

import './modern.css';
import './motion.css';

const categoryIcons = {
  all: LayoutGrid,
  overview: Activity,
  hosts: Server,
  vms: Cpu,
  forecast: Database,
  logs: FileText,
  alerts: Bell,
  reports: FileText,
};

export function WallChrome({
  children,
  actions,
  embedded = false,
}: PropsWithChildren<{ actions?: ReactNode; embedded?: boolean }>) {
  const source = useWallDashboardSource();
  const theme = useTheme2();
  const location = useLocation();
  const statPilot = isStorageStatPilot(location.pathname, location.search);
  const fontStatus = useWallTypographyFonts(statPilot);
  const visualization = useMemo(
    () => ({
      ...wallVisualization(theme, statPilot ? wallTypography.family : undefined),
      fontLoadRevision: fontStatus,
    }),
    [theme, statPilot, fontStatus]
  );
  const statCard = useMemo(() => wallStatCardPresentation(theme), [theme]);
  const chartTokens = useMemo(
    () => ({ ...wallTimeSeriesTokens(theme), fontLoadRevision: fontStatus }),
    [theme, fontStatus]
  );
  const navigate = useNavigate();
  const navIndex = useSelector((state) => state.navIndex);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  useEffect(() => {
    if (!mobileOpen) {
      return;
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);
  const params = new URLSearchParams(location.search);
  const category = params.get('category') ?? 'all';
  const starred = params.has('starred');
  const dashboards = source.items.filter((item) => item.type === 'dash-db');
  const favorites = dashboards.filter((item) => item.isStarred);
  const isLibrary = location.pathname.startsWith('/dashboards');
  const canAlert = Boolean(navIndex['alerting']);
  const canAdmin = Boolean(navIndex['administration']);
  const user = contextSrv.user;
  const href = (value: WallCategory) => (value === 'all' ? '/dashboards' : `/dashboards?category=${value}`);

  return (
    <WallFontStatusContext.Provider value={fontStatus}>
      <WallTypographyContext.Provider value={statPilot}>
        <WallDashboardContext.Provider value={source}>
          <VizPresentationContext.Provider
            value={isWallModernRoute(location.pathname, location.search) ? visualization : undefined}
          >
            <div
              className={`wall-modern wall-shell ${embedded ? 'wall-embedded' : ''}`}
              data-wall-theme={theme.isDark ? 'dark' : 'light'}
              data-testid="wall-modern-shell"
              data-wall-typography={statPilot ? 'storage-vm' : undefined}
              data-wall-font-status={fontStatus}
              data-wall-stat-pilot={statPilot ? 'storage-vm' : undefined}
              style={
                statPilot
                  ? ({
                      ...wallTypographyVariables,
                      ...wallSurfaceVariables(theme.isDark),
                      '--wall-stat-foreground': statCard.foreground,
                      '--wall-stat-muted': statCard.muted,
                      '--wall-stat-border': statCard.border,
                      '--wall-stat-shadow': statCard.shadow,
                      '--wall-stat-radius': `${statCard.radius}px`,
                    } as CSSProperties)
                  : undefined
              }
            >
              <a className="wall-skip-link" href="#pageContent">
                본문으로 이동
              </a>
              {mobileOpen && (
                <button className="wall-sidebar-backdrop" aria-label="메뉴 닫기" onClick={() => setMobileOpen(false)} />
              )}
              <aside
                id="wall-sidebar"
                className={`wall-sidebar ${mobileOpen ? 'is-open' : ''}`}
                aria-label="Wall 내비게이션"
              >
                <Link className="wall-brand" to="/dashboards" onClick={() => setMobileOpen(false)}>
                  <img className="wall-brand-mark" src={brandMark} alt="" />
                  <span>
                    <strong>ABLESTACK</strong>
                    <small>
                      Wall <span>MONITORING</span>
                    </small>
                  </span>
                </Link>
                <nav className="wall-primary-nav" aria-label="주 메뉴">
                  <Link
                    to="/dashboards"
                    className="wall-nav-item is-active"
                    aria-current="page"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutGrid size={18} />
                    대시보드
                  </Link>
                  {canAlert && (
                    <Link
                      to={locationUtil.stripBaseFromUrl(navIndex['alerting'].url || '/alerting/list')}
                      className="wall-nav-item"
                    >
                      <Bell size={18} />
                      경보
                      <ChevronRight size={14} className="wall-nav-end" />
                    </Link>
                  )}
                </nav>
                <div className="wall-sidebar-scroll">
                  <section className="wall-nav-section">
                    <div className="wall-nav-label">
                      즐겨찾기 <Star size={12} />
                    </div>
                    {favorites.length === 0 && (
                      <p className="wall-nav-empty">
                        자주 보는 대시보드의
                        <br />
                        별표를 눌러 추가하세요.
                      </p>
                    )}
                    {favorites.map((item) => (
                      <Link
                        key={item.uid}
                        to={locationUtil.stripBaseFromUrl(item.url)}
                        className={`wall-nav-item wall-favorite ${location.pathname === locationUtil.stripBaseFromUrl(item.url) ? 'is-current' : ''}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Star size={15} fill="currentColor" />
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </section>
                  <section className="wall-nav-section">
                    <div className="wall-nav-label">
                      분류별 보기 <ListFilter size={13} />
                    </div>
                    {categories
                      .filter((item) => item.id !== 'all')
                      .map((item) => {
                        const Icon = categoryIcons[item.id];
                        const count = dashboards.filter((dashboard) => categoryOf(dashboard) === item.id).length;
                        return (
                          <Link
                            key={item.id}
                            to={href(item.id)}
                            className={`wall-nav-item ${isLibrary && category === item.id && !starred ? 'is-current' : ''}`}
                            onClick={() => setMobileOpen(false)}
                          >
                            <Icon size={17} />
                            <span>{item.label}</span>
                            <span className="wall-count">{count}</span>
                          </Link>
                        );
                      })}
                  </section>
                </div>
                <div className="wall-sidebar-footer">
                  {canAdmin && (
                    <Link
                      className="wall-nav-item"
                      to={locationUtil.stripBaseFromUrl(navIndex['administration'].url || '/admin')}
                    >
                      <Settings size={17} />
                      환경설정
                    </Link>
                  )}
                  <a className="wall-nav-item" href="https://docs.ablecloud.io/" target="_blank" rel="noreferrer">
                    <CircleHelp size={17} />
                    도움말
                  </a>
                  <div className="wall-product-caption">
                    <span className="wall-product-dot" />
                    ABLESTACK PLATFORM
                  </div>
                </div>
              </aside>
              <div className="wall-workspace">
                <header className="wall-topbar">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="wall-mobile-toggle"
                    aria-label="메뉴 열기"
                    aria-expanded={mobileOpen}
                    aria-controls="wall-sidebar"
                    onClick={() => setMobileOpen(true)}
                  >
                    <MenuIcon size={19} />
                  </Button>
                  <form
                    className="wall-global-search"
                    role="search"
                    onSubmit={(event) => {
                      event.preventDefault();
                      navigate(`/dashboards?query=${encodeURIComponent(search)}`);
                    }}
                  >
                    <Search size={17} />
                    <input
                      aria-label="전체 대시보드 검색"
                      placeholder="대시보드, 폴더, 태그 검색..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                    {search ? (
                      <button type="button" aria-label="검색어 지우기" onClick={() => setSearch('')}>
                        <X size={14} />
                      </button>
                    ) : (
                      <kbd>↵</kbd>
                    )}
                  </form>
                  <div className="wall-topbar-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={theme.isDark ? '라이트 테마로 변경' : '다크 테마로 변경'}
                      onClick={() => toggleTheme(true)}
                    >
                      {theme.isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </Button>
                    {canAlert && (
                      <Link
                        className="wall-icon-link"
                        to={locationUtil.stripBaseFromUrl(navIndex['alerting'].url || '/alerting/list')}
                        aria-label="경보 보기"
                      >
                        <Bell size={18} />
                      </Link>
                    )}
                    <span className="wall-topbar-divider" />
                    <Menu.Root>
                      <Menu.Trigger className="wall-account">
                        <span className="wall-avatar">{(user.name || user.login || 'W').charAt(0).toUpperCase()}</span>
                        <span>{user.login || 'Viewer'}</span>
                        <ChevronDown size={13} />
                      </Menu.Trigger>
                      <Menu.Portal>
                        <Menu.Positioner sideOffset={8} align="end" className="wall-menu-positioner">
                          <Menu.Popup
                            className="wall-modern wall-menu"
                            data-wall-theme={theme.isDark ? 'dark' : 'light'}
                          >
                            <div className="wall-menu-label">{user.orgName || 'ABLESTACK Wall'}</div>
                            {user.isSignedIn ? (
                              <Menu.Item
                                render={<a href={`${config.appSubUrl}/profile`} aria-label="프로필 및 환경설정" />}
                                className="wall-menu-item"
                              >
                                프로필 및 환경설정
                              </Menu.Item>
                            ) : (
                              <Menu.Item
                                render={<a href={`${config.appSubUrl}/login`} aria-label="로그인" />}
                                className="wall-menu-item"
                              >
                                로그인
                              </Menu.Item>
                            )}
                            {user.isSignedIn && (
                              <Menu.Item
                                render={<a href={`${config.appSubUrl}/logout`} aria-label="로그아웃" />}
                                className="wall-menu-item"
                              >
                                로그아웃
                              </Menu.Item>
                            )}
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.Root>
                  </div>
                </header>
                {actions && !isLibrary && !embedded && (
                  <div className="wall-native-toolbar" role="region" aria-label="대시보드 작업 및 시간 설정">
                    {actions}
                  </div>
                )}
                <main
                  id="pageContent"
                  className={`wall-content ${isLibrary ? 'wall-library-content' : 'wall-dashboard-content'}`}
                >
                  <StatCardPresentationContext.Provider value={statPilot ? statCard : undefined}>
                    <TimeSeriesStyleConfigContext.Provider
                      value={isWallTimeSeriesRoute(location.pathname, location.search) ? chartTokens : undefined}
                    >
                      {children}
                    </TimeSeriesStyleConfigContext.Provider>
                  </StatCardPresentationContext.Provider>
                </main>
              </div>
            </div>
          </VizPresentationContext.Provider>
        </WallDashboardContext.Provider>
      </WallTypographyContext.Provider>
    </WallFontStatusContext.Provider>
  );
}
