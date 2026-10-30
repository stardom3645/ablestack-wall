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
    (Object.keys(overviewSections) as Array<keyof typeof overviewSections>).find((key) =>
      overviewSections[key].includes(id)
    ) ?? 'additional'
  );
}

/** These tokens override only the overview provider, never another tab or saved field configuration. */
export function overviewChartTokens(theme: GrafanaTheme2) {
  return {
    ...wallTimeSeriesTokens(theme),
    palette: theme.isDark
      ? ['#7caaff', '#48d2bb', '#b9a0ff', '#efbd7c', '#f395b5', '#79c5e7', '#abbdd8', '#b2d78c']
      : ['#1677ff', '#0e9387', '#7c5ce7', '#bd7b24', '#cb4874', '#2389b5', '#687b96', '#698632'],
    lineWidth: 2.2,
    fillOpacity: 6,
    gridDash: [],
    axisFontSize: wallTypography.roles.axis.size,
    legendFontSize: wallTypography.roles.legend.size,
    legendCellPadding: '5px 8px',
    tooltipHeaderBackground: theme.isDark ? '#202e42' : '#f3f7ff',
    tooltipRowGap: 10,
    tooltipPadding: wallSurfaceTokens.padding,
  };
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
}: {
  id: number;
  children: ReactNode;
  preserveTimeSeries?: boolean;
}) {
  const theme = useTheme2();
  const fontStatus = useContext(WallFontStatusContext);
  const role = overviewPanelRole(id);
  const chrome = useMemo(
    () => ({
      hideMenu: true,
      contentPadding: {
        horizontal: wallSurfaceTokens.padding,
        vertical: ['kpi', 'usage', 'service', 'counts'].includes(displayKinds[id])
          ? wallSurfaceTokens.compactPadding
          : wallSurfaceTokens.padding,
      },
      headerHeight:
        role === 'services' || role === 'usage'
          ? 0
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
        role === 'services' || role === 'usage' ? (
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
    [id, role]
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
  return (
    <PanelChromePresentationContext.Provider value={chrome}>
      <VizPresentationContext.Provider value={viz}>
        {preserveTimeSeries ? (
          children
        ) : (
          <TimeSeriesStyleConfigContext.Provider value={overviewChartTokens(theme)}>
            {children}
          </TimeSeriesStyleConfigContext.Provider>
        )}
      </VizPresentationContext.Provider>
    </PanelChromePresentationContext.Provider>
  );
}
