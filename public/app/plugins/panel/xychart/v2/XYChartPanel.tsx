import { css } from '@emotion/css';
import { useMemo, useContext, useRef, useState, useEffect } from 'react';
import uPlot from 'uplot';

import { FALLBACK_COLOR, PanelProps, DataHoverEvent, DataHoverClearEvent } from '@grafana/data';
import { alpha } from '@grafana/data/src/themes/colorManipulator';
import { config } from '@grafana/runtime';
import { AxisPlacement } from '@grafana/schema';
import {
  TooltipDisplayMode,
  TooltipPlugin2,
  UPlotChart,
  VizLayout,
  VizLegend,
  VizLegendItem,
  useStyles2,
  useTheme2,
  usePanelContext,
} from '@grafana/ui';
import { TooltipHoverMode } from '@grafana/ui/src/components/uPlot/plugins/TooltipPlugin2';
import { getDisplayValuesForCalcs } from '@grafana/ui/src/components/uPlot/utils';
import { WallAnalyticActions } from 'app/features/wall-modern/charts/WallAnalyticActions';
import { WallAnalyticFrame } from 'app/features/wall-modern/charts/WallAnalyticFrame';
import {
  AnalyticHit,
  AnalyticInteraction,
  analyticFrames,
  analyticTokens,
} from 'app/features/wall-modern/charts/analytic';
import { WallTypographyContext, WallFontStatusContext } from 'app/features/wall-modern/typography';

import { getDataLinks } from '../../status-history/utils';

import { XYChartTooltip } from './XYChartTooltip';
import { Options } from './panelcfg.gen';
import { prepConfig } from './scatter';
import { fmt, prepSeries } from './utils';

type Props2 = PanelProps<Options>;

export const XYChartPanel2 = (props: Props2) => {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const wall = useContext(WallTypographyContext),
    fonts = useContext(WallFontStatusContext);
  const tokens = useMemo(
    () => (wall ? { ...analyticTokens(theme), fontLoadRevision: fonts } : undefined),
    [wall, theme, fonts]
  );
  const frames = useMemo(
    () => (wall ? analyticFrames(props.data.series, props.fieldConfig, theme) : props.data.series),
    [wall, props.data.series, props.fieldConfig, theme]
  );
  const plot = useRef<uPlot | null>(null),
    host = useRef<HTMLDivElement>(null),
    selected = useRef<AnalyticHit>();
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const pan = useRef(false);
  const interaction = useMemo<AnalyticInteraction>(
    () => ({
      ready: (u) => {
        plot.current = u;
      },
      selected: () => selected.current,
      panMode: () => pan.current,
      pick: (hit, e) => {
        selected.current = hit;
        setPoint({ x: e.clientX, y: e.clientY });
      },
    }),
    []
  );
  const { eventBus } = usePanelContext();

  let { mapping, series: mappedSeries } = props.options;

  // regenerate series schema when mappings or data changes
  let series = useMemo(
    () => prepSeries(mapping, mappedSeries, frames, props.fieldConfig, wall ? theme : config.theme2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapping, mappedSeries, frames, props.fieldConfig, theme, wall]
  );

  // if series changed due to mappings or data structure, re-init config & renderers
  let { builder, prepData, getPointColor } = useMemo(
    () => prepConfig(series, wall ? theme : config.theme2, tokens, wall ? interaction : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      mapping,
      mappedSeries,
      props.data.structureRev,
      props.fieldConfig,
      props.options.tooltip,
      tokens,
      theme,
      wall,
      interaction,
    ]
  );

  // generate data struct for uPlot mode: 2
  let data = useMemo(
    () => prepData(series),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series]
  );

  useEffect(() => {
    if (!wall) {
      return;
    }
    const hover = eventBus.getStream(DataHoverEvent).subscribe((e) => {
      const index = series.findIndex((s) => s.name.value === e.payload.dataId);
      if (index >= 0) {
        plot.current?.setSeries(index + 1, { focus: true });
      }
    });
    const clear = eventBus
      .getStream(DataHoverClearEvent)
      .subscribe(() => plot.current?.setSeries(null, { focus: true }));
    return () => {
      hover.unsubscribe();
      clear.unsubscribe();
    };
  }, [wall, eventBus, series]);
  useEffect(() => {
    const hit = selected.current;
    if (hit && (!series[hit.sidx - 1] || hit.didx >= series[hit.sidx - 1].y.field.values.length)) {
      selected.current = undefined;
      setPoint(null);
    }
  }, [series]);
  const hit = selected.current,
    chosen = hit ? series[hit.sidx - 1] : undefined;
  const action =
    hit && chosen && hit.didx < chosen.y.field.values.length
      ? {
          title: chosen.name.value,
          rows: [...new Set([chosen.x.field, chosen.y.field, chosen.size.field, chosen.color.field, ...chosen._rest])]
            .filter((field) => field && !field.config.custom?.hideFrom?.tooltip)
            .map((field) => ({
              label: field!.state?.displayName ?? field!.name,
              value: fmt(field!, field!.values[hit.didx]),
            })),
          links: getDataLinks(chosen.y.field, hit.didx),
        }
      : undefined;

  // todo: handle errors
  let error = builder == null || data.length === 0 ? 'Err' : '';

  // TODO: React.memo()
  const renderLegend = () => {
    if (!props.options.legend.showLegend) {
      return null;
    }

    const items: VizLegendItem[] = [];

    series.forEach((s, idx) => {
      let yField = s.y.field;
      let config = yField.config;
      let custom = config.custom;

      if (!custom.hideFrom?.legend) {
        items.push({
          yAxis: wall && builder?.getAxisPlacement(yField.config.unit ?? 'y') === AxisPlacement.Right ? 2 : 1,
          label: s.name.value,
          color: alpha(s.color.fixed ?? FALLBACK_COLOR, 1),
          getItemKey: () => `${idx}-${s.name.value}`,
          fieldName: yField.state?.displayName ?? yField.name,
          disabled: yField.state?.hideFrom?.viz ?? false,
          getDisplayValues: () => getDisplayValuesForCalcs(props.options.legend.calcs, yField, theme),
        });
      }
    });

    const { placement, displayMode, width, sortBy, sortDesc } = props.options.legend;

    return (
      <VizLayout.Legend placement={placement} width={width}>
        <VizLegend
          className={wall ? undefined : styles.legend}
          placement={placement}
          items={items}
          displayMode={displayMode}
          sortBy={sortBy}
          sortDesc={sortDesc}
          isSortable={true}
        />
      </VizLayout.Legend>
    );
  };

  if (error) {
    return (
      <div className="panel-empty">
        <p>{error}</p>
      </div>
    );
  }

  const render = (height: number) => (
    <VizLayout width={props.width} height={height} legend={renderLegend()}>
      {(vizWidth: number, vizHeight: number) => (
        <UPlotChart config={builder!} data={data} width={vizWidth} height={vizHeight}>
          {props.options.tooltip.mode !== TooltipDisplayMode.None && (
            <TooltipPlugin2
              config={builder!}
              hoverMode={TooltipHoverMode.xyOne}
              render={(u, dataIdxs, seriesIdx, isPinned, dismiss) => {
                return (
                  <XYChartTooltip
                    data={frames}
                    dataIdxs={dataIdxs}
                    xySeries={series}
                    dismiss={dismiss}
                    isPinned={isPinned}
                    seriesIdx={seriesIdx!}
                    replaceVariables={props.replaceVariables}
                    getPointColor={wall ? getPointColor : undefined}
                  />
                );
              }}
              maxWidth={props.options.tooltip.maxWidth ?? tokens?.tooltipMaxWidth}
            />
          )}
        </UPlotChart>
      )}
    </VizLayout>
  );
  return (
    <div ref={host} tabIndex={-1} style={{ width: props.width, height: props.height }} data-wall-xy={wall || undefined}>
      {tokens ? (
        <WallAnalyticFrame tokens={tokens} height={props.height} plot={plot} pan={pan}>
          {render}
        </WallAnalyticFrame>
      ) : (
        render(props.height)
      )}
      {wall && point && action && (
        <WallAnalyticActions
          key={`${point.x}/${point.y}`}
          data={action}
          point={point}
          returnFocus={host}
          onClose={() => setPoint(null)}
        />
      )}
    </div>
  );
};

const getStyles = () => ({
  legend: css({
    div: {
      justifyContent: 'flex-start',
    },
  }),
});
