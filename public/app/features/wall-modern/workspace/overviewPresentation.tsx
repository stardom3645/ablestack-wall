import { ReactNode, useContext, useMemo } from 'react';

import { DisplayValue, GrafanaTheme2 } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { FormattedValueDisplay } from '@grafana/ui/src/components/FormattedValueDisplay/FormattedValueDisplay';
import { PanelChromePresentationContext } from '@grafana/ui/src/components/PanelChrome/PanelChromePresentation';
import { TimeSeriesStyleConfigContext } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { presentValueColor, VizPresentationContext } from '@grafana/ui/src/components/VizPresentation/VizPresentation';

import { wallTimeSeriesTokens } from '../chartTokens';
import { CardHeader, CardTitle } from '../components/ui/card';
import { wallSurfaceTokens } from '../surfaceTokens';
import { WallFontStatusContext, wallTypography } from '../typography';
import { wallVisualization } from '../visualization';
import { displayKinds } from '../visualizations/model';

import { WallPanelHeader } from './PanelActionDock';
import { compactResourceTokens } from './compactResourceTokens';
import { overviewSections } from './model';

export type OverviewRole = keyof typeof overviewSections | 'additional';
export function overviewPanelRole(id: number): OverviewRole {
  return (
    Object.keys(overviewSections)
      .filter((key): key is keyof typeof overviewSections => key in overviewSections)
      .find((key) => overviewSections[key].includes(id)) ?? 'additional'
  );
}

/** These tokens override only the overview provider, never another tab or saved field configuration. */
/** The editor, overview and every dashboard use the same time-series contract. */
export function overviewChartTokens(theme: GrafanaTheme2) {
  return wallTimeSeriesTokens(theme);
}

function OverviewGaugeReadout({ value, explicitSize }: { value: DisplayValue; explicitSize?: number }) {
  const theme = useTheme2();
  const tokens = wallVisualization(theme, wallTypography.family);
  return (
    <FormattedValueDisplay
      value={value}
      unitStyle={
        explicitSize === undefined
          ? { fontSize: wallTypography.roles.unit.size, fontWeight: wallTypography.roles.unit.weight }
          : undefined
      }
      className="wall-overview-gauge-value"
      title={value.title}
      style={{
        fontSize: explicitSize ?? wallTypography.roles.gauge.size,
        color: presentValueColor(value.color, tokens),
      }}
    />
  );
}

export function OverviewPanelPresentation({
  id,
  children,
  preserveTimeSeries = false,
  pluginId,
}: {
  id?: number;
  children: ReactNode;
  preserveTimeSeries?: boolean;
  pluginId?: string;
}) {
  const theme = useTheme2();
  const fontStatus = useContext(WallFontStatusContext);
  // Generic editor previews have no dashboard-specific semantic ID.
  // An ID such as 32 in another dashboard must not inherit the 05 usage-card role.
  const role = id === undefined ? 'additional' : overviewPanelRole(id);
  const displayKind = id === undefined ? undefined : displayKinds[id];
  const chrome = useMemo(
    () => ({
      hideMenu: true,
      contentPadding: {
        horizontal: pluginId === 'stat' ? 0 : wallSurfaceTokens.padding,
        vertical:
          pluginId === 'stat'
            ? 0
            : displayKind && ['kpi', 'usage', 'service', 'counts'].includes(displayKind)
              ? wallSurfaceTokens.compactPadding
              : wallSurfaceTokens.padding,
      },
      headerHeight:
        (role === 'services' && pluginId !== 'stat') || role === 'usage'
          ? 0
          : role === 'services' && pluginId === 'stat'
            ? wallSurfaceTokens.compactHeaderHeight
            : role === 'resources'
              ? compactResourceTokens.kpi.headerHeight
              : wallSurfaceTokens.headerHeight,
      renderHeader: ({
        title,
        titleId,
        children: actions,
      }: {
        title: ReactNode;
        titleId: string;
        children: ReactNode;
      }) =>
        (role === 'services' && pluginId !== 'stat') || role === 'usage' ? (
          <span id={titleId} className="wall-panel-a11y-title">
            {title}
          </span>
        ) : (
          <CardHeader className={`wall-overview-panel-header wall-overview-header-${role} `}>
            <WallPanelHeader
              titleId={titleId}
              title={<CardTitle className="wall-overview-panel-title">{title}</CardTitle>}
            >
              {actions}
            </WallPanelHeader>
          </CardHeader>
        ),
    }),
    [displayKind, role, pluginId]
  );
  const viz = useMemo(
    () => ({
      ...wallVisualization(theme, wallTypography.family),
      fontLoadRevision: fontStatus,
      gaugeThickness: 8,
      renderGaugeValue: (value: DisplayValue, explicitSize?: number) => (
        <OverviewGaugeReadout value={value} explicitSize={explicitSize} />
      ),
    }),
    [theme, fontStatus]
  );
  const chart = useMemo(() => ({ ...overviewChartTokens(theme), fontLoadRevision: fontStatus }), [theme, fontStatus]);
  return (
    <PanelChromePresentationContext.Provider value={chrome}>
      <VizPresentationContext.Provider value={viz}>
        {preserveTimeSeries ? (
          children
        ) : (
          <TimeSeriesStyleConfigContext.Provider value={chart}>{children}</TimeSeriesStyleConfigContext.Provider>
        )}
      </VizPresentationContext.Provider>
    </PanelChromePresentationContext.Provider>
  );
}
