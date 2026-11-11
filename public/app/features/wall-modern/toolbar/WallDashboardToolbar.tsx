import { Menu } from '@base-ui/react/menu';
import {
  ChevronDown,
  ExternalLink,
  Info,
  Settings,
  RefreshCw,
  Share2,
  Square,
  Star,
  TimerReset,
  ZoomOut,
} from 'lucide-react';
import { useContext, useEffect } from 'react';

import { sanitizeUrl } from '@grafana/data/src/text/sanitize';
import { config, locationService } from '@grafana/runtime';
import { sceneGraph } from '@grafana/scenes';
import { DashboardLink } from '@grafana/schema';
import { useTheme2 } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';
import { contextSrv } from 'app/core/services/context_srv';
import { shareDashboardType } from 'app/features/dashboard/components/ShareModal/utils';
import { getDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';
import { buildPanelEditScene } from 'app/features/dashboard-scene/panel-edit/PanelEditor';
import { DashboardControls } from 'app/features/dashboard-scene/scene/DashboardControls';
import { DashboardLinksControls } from 'app/features/dashboard-scene/scene/DashboardLinksControls';
import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';
import ExportMenu from 'app/features/dashboard-scene/sharing/ExportButton/ExportMenu';
import ShareMenu from 'app/features/dashboard-scene/sharing/ShareButton/ShareMenu';
import { DashboardInteractions } from 'app/features/dashboard-scene/utils/interactions';
import { dynamicDashNavActions } from 'app/features/dashboard-scene/utils/registerDynamicDashNavAction';
import { activateInActiveParents } from 'app/features/dashboard-scene/utils/utils';
import { getLinkSrv } from 'app/features/panel/panellinks/link_srv';
import { playlistSrv } from 'app/features/playlist/PlaylistSrv';

import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { WallTypographyContext, wallTypographyVariables } from '../typography';
import { Button } from '../ui';
import { canAdjustKpiLayout } from '../workspace/kpiLayout';

import { WallLayoutHistoryControls } from './WallLayoutHistoryControls';
import { WallScopeControl } from './WallScopeControl';
import { WallTimeRangeControl } from './WallTimeRangeControl';

import './toolbar.css';

export function retainedToolbarLinks(links: DashboardLink[]) {
  return links.filter((link) => !['home', '대시보드 목록', 'dashboard list'].includes(link.title.trim().toLowerCase()));
}

/** New toolbar structure; the original Scene time range, refresh timer, variables and actions remain the owners. */
export function WallDashboardToolbar({
  dashboard,
  controls,
  analysisOnly = false,
}: {
  dashboard: DashboardScene;
  controls: DashboardControls;
  analysisOnly?: boolean;
}) {
  const typography = useContext(WallTypographyContext);
  const { uid, links, meta, kioskMode } = dashboard.useState();
  const { timePicker, refreshPicker, hideTimeControls, hideVariableControls, hideLinksControls } = controls.useState();
  const { refresh, intervals, autoEnabled, autoValue } = refreshPicker.useState();
  const timeRange = sceneGraph.getTimeRange(dashboard);
  timeRange.useState(); // Resolve keepTime/variable links again when the range changes.
  const { isPlaying } = playlistSrv.useState();
  const queryController = sceneGraph.getQueryController(dashboard);
  // This dashboard always owns a SceneQueryController; absent controllers use a small separate fallback component.
  const theme = useTheme2();
  useEffect(() => {
    const stopControls = activateInActiveParents(controls);
    const stopTime = activateInActiveParents(timePicker);
    const stopRefresh = activateInActiveParents(refreshPicker);
    return () => {
      stopRefresh?.();
      stopTime?.();
      stopControls?.();
    };
  }, [controls, timePicker, refreshPicker]);

  const canShare = Boolean(uid && !meta.isSnapshot && !isPlaying);
  const canEdit = dashboard.canEditDashboard() && !isPlaying && !kioskMode;
  const canAdjustLayout = canAdjustKpiLayout(contextSrv.user, canEdit);
  const visibleLinks = retainedToolbarLinks(links ?? []);
  const netdive = visibleLinks.find(
    (link) => link.type === 'link' && /netdive|skydive|넷다이브|스카이다이브|네트다이브/i.test(link.title)
  );
  const remainingLinks = visibleLinks.filter((link) => link !== netdive);
  const anchor = netdive ? getLinkSrv().getAnchorInfo(netdive) : undefined;
  const openShare = () => {
    DashboardInteractions.toolbarShareClick();
    locationService.partial({ shareView: shareDashboardType.link });
  };

  return (
    <div
      className="wall-dashboard-toolbar"
      data-testid="wall-dashboard-toolbar"
      role="region"
      aria-label="대시보드 도구 모음"
    >
      <div className="wall-toolbar-primary" role="group" aria-label="분석 도구">
        {!hideVariableControls && <WallScopeControl controls={controls} />}
        <div className="wall-toolbar-query" role="group" aria-label="시간 및 갱신">
          {!hideTimeControls && (
            <>
              <WallTimeRangeControl model={timePicker} />
              <div className="wall-toolbar-group" role="group" aria-label="데이터 갱신">
                <Menu.Root>
                  <Menu.Trigger
                    render={<Button className="wall-toolbar-control" />}
                    aria-label="자동 갱신 간격 선택"
                    title="자동 갱신 간격 선택"
                  >
                    <TimerReset size={15} />
                    <span>{refresh === 'auto' ? `자동${autoValue ? ` · ${autoValue}` : ''}` : refresh || '꺼짐'}</span>
                    <ChevronDown size={14} />
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner align="start" sideOffset={8} className="wall-toolbar-positioner">
                      <Menu.Popup
                        className="wall-modern wall-toolbar-popover wall-interval-menu"
                        data-wall-theme={theme.isDark ? 'dark' : 'light'}
                        aria-label="자동 갱신 간격"
                        data-wall-typography={typography ? 'storage-vm' : undefined}
                        style={typography ? wallTypographyVariables : undefined}
                      >
                        <div className="wall-toolbar-menu-label">
                          <Trans i18nKey="wall.wall-dashboard-toolbar.text-76e01834">자동 갱신 간격</Trans>
                        </div>
                        <Menu.RadioGroup value={refresh ?? ''} onValueChange={refreshPicker.onIntervalChanged}>
                          {[
                            { value: '', label: '꺼짐' },
                            ...(autoEnabled ? [{ value: 'auto', label: '자동' }] : []),
                            ...(intervals ?? []).map((value) => ({ value, label: value })),
                          ].map(({ value, label }) => (
                            <Menu.RadioItem key={value} value={value} closeOnClick className="wall-toolbar-menu-item">
                              <span>{label}</span>
                              <Menu.RadioItemIndicator>
                                <span className="wall-interval-dot" />
                              </Menu.RadioItemIndicator>
                            </Menu.RadioItem>
                          ))}
                        </Menu.RadioGroup>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
                <RefreshButton controller={queryController} onRefresh={refreshPicker.onRefresh} />
              </div>
            </>
          )}
          <Popover>
            <PopoverTrigger
              render={<Button className="wall-toolbar-control wall-toolbar-icon" size="icon" />}
              aria-label="대시보드 정보"
              title="대시보드 정보"
            >
              <Info size={16} />
            </PopoverTrigger>
            <PopoverContent aria-label="대시보드 정보" title="대시보드 정보" className="wall-scope-popover">
              <div className="wall-scope-heading">{dashboard.state.title}</div>
              <p className="wall-toolbar-help">
                <Trans i18nKey="wall.wall-dashboard-toolbar.text-99396757">
                  선택한 객체와 시간 범위에 따라 기존 패널을 조회합니다.
                </Trans>
              </p>
              {!hideTimeControls && (
                <Button variant="ghost" size="sm" onClick={timePicker.onZoom}>
                  <ZoomOut size={15} />
                  <Trans i18nKey="wall.wall-dashboard-toolbar.text-531e4e96">시간 범위 축소</Trans>
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {!analysisOnly && (
        <div className="wall-toolbar-secondary" role="group" aria-label="대시보드 작업">
          {canAdjustLayout && <WallLayoutHistoryControls />}
          {!hideLinksControls && netdive && anchor && (
            <Button
              render={
                <a
                  href={sanitizeUrl(anchor.href)}
                  target={netdive.targetBlank ? '_blank' : undefined}
                  rel="noreferrer"
                  aria-label="Netdive"
                />
              }
              nativeButton={false}
              role="link"
              variant="ghost"
            >
              <ExternalLink size={16} />
              <Trans i18nKey="wall.wall-dashboard-toolbar.text-4bee20e1">Netdive</Trans>
            </Button>
          )}
          {!hideLinksControls && remainingLinks.length > 0 && (
            <DashboardLinksControls links={remainingLinks} dashboard={dashboard} />
          )}
          {uid && meta.canStar && (
            <Button
              size="icon"
              variant="ghost"
              aria-label={meta.isStarred ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              title={meta.isStarred ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              aria-pressed={Boolean(meta.isStarred)}
              onClick={() => {
                DashboardInteractions.toolbarFavoritesClick();
                dashboard.onStarDashboard();
              }}
            >
              <Star size={17} fill={meta.isStarred ? 'currentColor' : 'none'} />
            </Button>
          )}
          <DynamicActions />
          {canShare && (
            <>
              <Button variant="ghost" onClick={openShare}>
                <Share2 size={16} />
                <Trans i18nKey="wall.wall-dashboard-toolbar.text-0f20245b">공유</Trans>
              </Button>
              {config.featureToggles.newDashboardSharingComponent && (
                <Popover>
                  <PopoverTrigger render={<Button size="icon" variant="ghost" />} aria-label="추가 공유 및 내보내기">
                    <ChevronDown size={14} />
                  </PopoverTrigger>
                  <PopoverContent aria-label="추가 공유 및 내보내기">
                    <ShareMenu dashboard={dashboard} />
                    <ExportMenu dashboard={dashboard} />
                  </PopoverContent>
                </Popover>
              )}
            </>
          )}
          {canEdit && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  dashboard.onEnterEditMode();
                  dashboard.urlSync?.updateFromUrl({ editview: 'settings' });
                  dashboard.onOpenSettings();
                }}
              >
                <Settings size={15} />
                <Trans i18nKey="wall.wall-dashboard-toolbar.text-25a90dcf">대시보드 설정</Trans>
              </Button>
              <Menu.Root>
                <Menu.Trigger
                  render={<Button variant="outline" size="icon" />}
                  aria-label="대시보드 관리"
                  title="대시보드 관리"
                >
                  <ChevronDown size={14} />
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner className="wall-toolbar-positioner">
                    <Menu.Popup
                      className="wall-modern wall-toolbar-popover wall-interval-menu"
                      data-wall-theme={theme.isDark ? 'dark' : 'light'}
                    >
                      <Menu.Item
                        className="wall-toolbar-menu-item"
                        onClick={() => {
                          dashboard.onEnterEditMode();
                          dashboard.setState({ editPanel: buildPanelEditScene(dashboard.onCreateNewPanel(), true) });
                        }}
                      >
                        <Trans i18nKey="wall.wall-dashboard-toolbar.text-4e76e6e4">패널 추가</Trans>
                      </Menu.Item>
                      <Menu.Item
                        className="wall-toolbar-menu-item"
                        onClick={() => {
                          dashboard.onEnterEditMode();
                          dashboard.onShowAddLibraryPanelDrawer();
                        }}
                      >
                        <Trans i18nKey="wall.wall-dashboard-toolbar.text-f455c2a9">라이브러리에서 추가</Trans>
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function RefreshButton({
  controller,
  onRefresh,
}: {
  controller: ReturnType<typeof sceneGraph.getQueryController>;
  onRefresh: () => void;
}) {
  return controller ? (
    <ControlledRefreshButton controller={controller} onRefresh={onRefresh} />
  ) : (
    <Button
      className="wall-toolbar-control wall-toolbar-icon"
      size="icon"
      onClick={onRefresh}
      aria-label="새로고침"
      title="새로고침"
    >
      <RefreshCw size={16} />
    </Button>
  );
}

function ControlledRefreshButton({
  controller,
  onRefresh,
}: {
  controller: NonNullable<ReturnType<typeof sceneGraph.getQueryController>>;
  onRefresh: () => void;
}) {
  const { isRunning } = controller.useState();
  return (
    <Button
      className="wall-toolbar-control wall-toolbar-icon"
      size="icon"
      onClick={onRefresh}
      aria-label={isRunning ? '진행 중인 쿼리 취소' : '새로고침'}
      title={isRunning ? '진행 중인 쿼리 취소' : '새로고침'}
    >
      {isRunning ? <Square size={14} /> : <RefreshCw size={16} />}
    </Button>
  );
}

function DynamicActions() {
  const dashboard = getDashboardSrv().getCurrent()!;
  return (
    <>
      {[...dynamicDashNavActions.left, ...dynamicDashNavActions.right]
        .filter((action) => action.show({ dashboard }))
        .map((action, index) => (
          <action.component key={index} dashboard={dashboard} />
        ))}
    </>
  );
}
