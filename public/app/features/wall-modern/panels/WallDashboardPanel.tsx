import { AlertCircle, GripVertical } from 'lucide-react';
import { PropsWithChildren, SyntheticEvent, useContext, useMemo } from 'react';

import { locationService } from '@grafana/runtime';
import { sceneGraph, VizPanel } from '@grafana/scenes';
import { StatCardPresentationContext } from '@grafana/ui/src/components/BigValue/StatCardPresentation';
import {
  PanelChromePresentation,
  PanelChromePresentationContext,
  PanelHeaderPresentationProps,
} from '@grafana/ui/src/components/PanelChrome/PanelChromePresentation';
import { getDashboardSceneFor } from 'app/features/dashboard-scene/utils/utils';

import { CardHeader, CardTitle } from '../components/ui/card';
import { wallSurfaceTokens } from '../surfaceTokens';
import { WallTypographyContext } from '../typography';
import { Button } from '../ui';
import { PanelActionsProvider, WallPanelHeader } from '../workspace/PanelActionDock';
import { WallPanelActions } from '../workspace/WallPanelActions';

import { WallPanelState } from './WallPanelState';
import { panelContentPadding, panelDisplayState, panelHeaderHeight } from './panelPresentation';
import { safeQueryError } from './safeQueryError';
import './panels.css';

/** Opt in at the native Grid/view boundary; never replace its layout or panel model. */
export function WallDashboardPanel({ panel, children }: PropsWithChildren<{ panel: VizPanel }>) {
  const enabled = useContext(WallTypographyContext);
  return enabled ? <PresentedPanel panel={panel}>{children}</PresentedPanel> : <>{children}</>;
}

function PresentedPanel({ panel, children }: PropsWithChildren<{ panel: VizPanel }>) {
  const { pluginId, displayMode, title, _pluginLoadError } = panel.useState();
  const dashboard = getDashboardSceneFor(panel);
  const { kioskMode } = dashboard.useState();
  const kiosk = Boolean(kioskMode);
  const policy = { readOnly: kiosk || !dashboard.canEditDashboard(), kiosk };
  const { data } = sceneGraph.getData(panel).useState();
  const plugin = panel.getPlugin();
  const pluginUnavailable = !plugin?.panel;
  const state = _pluginLoadError ? 'error' : panelDisplayState(data, plugin?.meta.skipDataQuery);
  const stat = useContext(StatCardPresentationContext);
  const metricTokens = useMemo(() => stat && { ...stat, compactVerticalPadding: 0 }, [stat]);
  const inspectError = (event: SyntheticEvent) => {
    event.stopPropagation();
    panel.onStatusMessageClick();
    locationService.partial({ inspect: panel.state.key, inspectTab: 'diagnostic' });
  };
  const renderHeader = ({ title, titleId, children, dragClass, dragClassCancel }: PanelHeaderPresentationProps) => (
    <PanelActionsProvider
      move={
        !policy.readOnly && dragClass ? (
          <Button
            className={`wall-kpi-move ${dragClass}`}
            variant="ghost"
            size="icon"
            aria-label="패널 이동"
            title="패널 이동"
          >
            <GripVertical size={15} aria-hidden="true" />
          </Button>
        ) : undefined
      }
      actions={
        <span className={dragClassCancel}>
          <WallPanelActions panel={panel} policy={policy} />
        </span>
      }
    >
      <CardHeader className="wall-common-panel-heading">
        <WallPanelHeader
          title={<CardTitle title={typeof title === 'string' ? title : undefined}>{title}</CardTitle>}
          titleId={titleId}
        >
          {children}
        </WallPanelHeader>
      </CardHeader>
    </PanelActionsProvider>
  );
  const presentation: PanelChromePresentation = {
    name: 'common',
    fitToContainer: true,
    headerHeight: wallSurfaceTokens.headerHeight,
    getHeaderHeight: ({ height }) => panelHeaderHeight(pluginId, height),
    contentPadding: panelContentPadding(pluginId, plugin?.noPadding),
    hideMenu: true,
    renderStatus: ({ message }) =>
      kiosk ? (
        <span
          className="wall-panel-error-action"
          role="img"
          aria-label="패널 오류"
          title={message ? safeQueryError(message) : undefined}
        >
          <AlertCircle size={14} aria-hidden="true" />
        </span>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="wall-panel-error-action"
          aria-label="패널 오류"
          title={message ? safeQueryError(message) : undefined}
          onClick={inspectError}
        >
          <AlertCircle size={14} aria-hidden="true" />
        </Button>
      ),
    renderHeader,
    renderHoverHeader: (props) => <div className="wall-common-hover-heading">{renderHeader(props)}</div>,
    renderContent: (content) => (
      <div className="wall-common-panel-body">
        <div
          className="wall-common-native-content"
          style={state ? { visibility: 'hidden' } : undefined}
          aria-hidden={state ? true : undefined}
        >
          {content}
        </div>
        <WallPanelState
          state={state}
          message={state === 'error' ? _pluginLoadError || data?.error?.message : undefined}
          onInspect={!kiosk ? inspectError : undefined}
        />
      </div>
    ),
  };
  return (
    <div
      className="wall-dashboard-panel"
      data-wall-panel-kind={pluginId}
      data-wall-transparent={displayMode === 'transparent' || pluginId === 'text' || undefined}
    >
      <StatCardPresentationContext.Provider value={metricTokens}>
        <PanelChromePresentationContext.Provider value={presentation}>
          {/* Keep the native subtree alive even while its plugin is loading/unavailable. */}
          <div
            className="wall-common-native-panel"
            style={pluginUnavailable ? { visibility: 'hidden' } : undefined}
            aria-hidden={pluginUnavailable || undefined}
          >
            {children}
          </div>
          {pluginUnavailable && (
            <section className="wall-common-plugin-state" data-wall-panel-chrome="common" aria-label={title}>
              {renderHeader({
                title: panel.interpolate(title, undefined, 'text'),
                titleId: `${panel.state.key}-plugin-title`,
                children: null,
              })}
              <WallPanelState
                state={_pluginLoadError || plugin ? 'error' : 'loading'}
                message={_pluginLoadError || (plugin ? '플러그인에 표시 컴포넌트가 없습니다.' : undefined)}
                onInspect={!kiosk ? inspectError : undefined}
              />
            </section>
          )}
        </PanelChromePresentationContext.Provider>
      </StatCardPresentationContext.Provider>
    </div>
  );
}
