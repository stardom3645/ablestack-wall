import { Menu } from '@base-ui/react/menu';
import { Bell, ChevronDown, Moon, PanelLeftClose, PanelLeftOpen, Search, Sun, X } from 'lucide-react';
import { useMemo, useState, type PropsWithChildren, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom-v5-compat';
import { useLocalStorage } from 'react-use';

import { locationUtil } from '@grafana/data';
import { config } from '@grafana/runtime';
import { useTheme2 } from '@grafana/ui';
import { StatCardPresentationContext } from '@grafana/ui/src/components/BigValue/StatCardPresentation';
import { PortalPresentationContext } from '@grafana/ui/src/components/Portal/PortalPresentationContext';
import { TimeSeriesStyleConfigContext } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { VizPresentationContext } from '@grafana/ui/src/components/VizPresentation/VizPresentation';
import { Trans } from 'app/core/internationalization';
import { contextSrv } from 'app/core/services/context_srv';
import { toggleTheme } from 'app/core/services/theme';
import { useSelector } from 'app/types';

import { WallNavigation } from './WallNavigation';
import { isWallTimeSeriesRoute, wallTimeSeriesTokens } from './chartTokens';
import { managementNavigation, isWallManagementRoute } from './managementNavigation';
import { isWallDashboardPanelRoute, isWallModernRoute } from './model';
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
import './application.css';
import './managementNavigation.css';

const wallPortalMotion = {};

export function WallChrome({
  children,
  actions,
  embedded = false,
}: PropsWithChildren<{ actions?: ReactNode; embedded?: boolean }>) {
  const source = useWallDashboardSource();
  const theme = useTheme2();
  const location = useLocation();
  const statPilot = isStorageStatPilot(location.pathname, location.search);
  const panelPresentation = isWallDashboardPanelRoute(location.pathname, location.search);
  const fontStatus = useWallTypographyFonts(true);
  const visualization = useMemo(
    () => ({
      ...wallVisualization(theme, panelPresentation ? wallTypography.family : undefined),
      fontLoadRevision: fontStatus,
    }),
    [theme, panelPresentation, fontStatus]
  );
  const statCard = useMemo(
    () => ({ ...wallStatCardPresentation(theme), fontLoadRevision: fontStatus }),
    [theme, fontStatus]
  );
  const chartTokens = useMemo(
    () => ({ ...wallTimeSeriesTokens(theme), fontLoadRevision: fontStatus }),
    [theme, fontStatus]
  );
  const navigate = useNavigate();
  const navIndex = useSelector((state) => state.navIndex);
  const [collapsed, setCollapsed] = useLocalStorage('wall:sidebar:collapsed', false);
  const [search, setSearch] = useState('');
  const dashboards = source.items.filter((item) => item.type === 'dash-db');
  const isLibrary = location.pathname.startsWith('/dashboards');
  const canAlert = Boolean(navIndex['alerting']);
  const managementGroups = useMemo(() => managementNavigation(navIndex), [navIndex]);
  const management = isWallManagementRoute(location.pathname);
  const user = contextSrv.user;

  return (
    <PortalPresentationContext.Provider value={wallPortalMotion}>
      <WallFontStatusContext.Provider value={fontStatus}>
        <WallTypographyContext.Provider value={panelPresentation}>
          <WallDashboardContext.Provider value={source}>
            <VizPresentationContext.Provider
              value={
                panelPresentation || isWallModernRoute(location.pathname, location.search) ? visualization : undefined
              }
            >
              <div
                className={`wall-modern wall-shell ${embedded ? 'wall-embedded' : ''}`}
                data-wall-theme={theme.isDark ? 'dark' : 'light'}
                data-testid="wall-modern-shell"
                data-wall-typography="storage-vm"
                data-sidebar-collapsed={Boolean(collapsed)}
                data-wall-font-status={fontStatus}
                data-wall-stat-pilot={statPilot ? 'storage-vm' : undefined}
                style={{
                  ...wallTypographyVariables,
                  ...wallSurfaceVariables(theme.isDark),
                  '--wall-stat-foreground': statCard.foreground,
                  '--wall-stat-muted': statCard.muted,
                  '--wall-stat-border': statCard.border,
                  '--wall-stat-shadow': statCard.shadow,
                  '--wall-stat-radius': `${statCard.radius}px`,
                }}
              >
                <a className="wall-skip-link" href="#pageContent">
                  <Trans i18nKey="wall.wall-chrome.text-de30eb55">본문으로 이동</Trans>
                </a>
                <WallNavigation
                  dashboards={dashboards}
                  folders={source.items.filter((item) => item.type === 'dash-folder')}
                  pathname={location.pathname}
                  search={location.search}
                  loading={source.loading}
                  collapsed={Boolean(collapsed)}
                  onExpand={() => setCollapsed(false)}
                  alertHref={
                    canAlert ? locationUtil.stripBaseFromUrl(navIndex['alerting'].url || '/alerting/list') : undefined
                  }
                  managementGroups={embedded ? [] : managementGroups}
                />
                <div className="wall-workspace">
                  <header className="wall-topbar" aria-label="글로벌 도구 모음">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="wall-navigation-toggle"
                      aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
                      aria-expanded={!collapsed}
                      aria-controls="wall-secondary-nav"
                      onClick={() => setCollapsed(!collapsed)}
                    >
                      {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
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
                        placeholder="대시보드 검색"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                      {search ? (
                        <button type="button" aria-label="검색어 지우기" onClick={() => setSearch('')}>
                          <X size={14} />
                        </button>
                      ) : (
                        <kbd>
                          <Trans i18nKey="wall.wall-chrome.text-687ebe22">↵</Trans>
                        </kbd>
                      )}
                    </form>
                    {actions && !isLibrary && !embedded && (
                      <div className="wall-global-actions" role="region" aria-label="대시보드 작업">
                        {actions}
                      </div>
                    )}
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
                          <span className="wall-avatar">
                            {(user.name || user.login || 'W').charAt(0).toUpperCase()}
                          </span>
                          <span className="wall-account-name">{user.name || user.login || 'Viewer'}</span>
                          <ChevronDown size={13} />
                        </Menu.Trigger>
                        <Menu.Portal>
                          <Menu.Positioner sideOffset={8} align="end" className="wall-menu-positioner">
                            <Menu.Popup
                              className="wall-modern wall-menu"
                              style={{ ...wallTypographyVariables, ...wallSurfaceVariables(theme.isDark) }}
                              data-wall-theme={theme.isDark ? 'dark' : 'light'}
                            >
                              <div className="wall-menu-label">
                                <strong>{user.name || user.login || 'Viewer'}</strong>
                                <span>{user.orgName || 'ABLESTACK Wall'}</span>
                              </div>
                              {user.isSignedIn ? (
                                <Menu.Item
                                  render={<a href={`${config.appSubUrl}/profile`} aria-label="프로필 및 환경설정" />}
                                  className="wall-menu-item"
                                >
                                  <Trans i18nKey="wall.wall-chrome.text-563bff56">프로필 및 환경설정</Trans>
                                </Menu.Item>
                              ) : (
                                <Menu.Item
                                  render={<a href={`${config.appSubUrl}/login`} aria-label="로그인" />}
                                  className="wall-menu-item"
                                >
                                  <Trans i18nKey="wall.wall-chrome.text-e225a6fd">로그인</Trans>
                                </Menu.Item>
                              )}
                              {user.isSignedIn && (
                                <Menu.Item
                                  render={<a href={`${config.appSubUrl}/logout`} aria-label="로그아웃" />}
                                  className="wall-menu-item"
                                >
                                  <Trans i18nKey="wall.wall-chrome.text-3879f078">로그아웃</Trans>
                                </Menu.Item>
                              )}
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.Root>
                    </div>
                  </header>
                  <main
                    id="pageContent"
                    className={`wall-content ${management ? 'wall-admin-content' : isLibrary ? 'wall-library-content' : 'wall-dashboard-content'}`}
                  >
                    <StatCardPresentationContext.Provider value={panelPresentation ? statCard : undefined}>
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
    </PortalPresentationContext.Provider>
  );
}
