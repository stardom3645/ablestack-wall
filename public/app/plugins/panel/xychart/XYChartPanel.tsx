import { css } from '@emotion/css';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import uPlot from 'uplot';

import { DataHoverClearEvent, DataHoverEvent, getFieldDisplayName, PanelProps } from '@grafana/data';
import { alpha } from '@grafana/data/src/themes/colorManipulator';
import { config } from '@grafana/runtime';
import { AxisPlacement } from '@grafana/schema';
import {
  TooltipDisplayMode,
  TooltipPlugin2,
  UPlotChart,
  usePanelContext,
  useTheme2,
  VizLayout,
  VizLegend,
  VizLegendItem,
} from '@grafana/ui';
import { TooltipHoverMode } from '@grafana/ui/src/components/uPlot/plugins/TooltipPlugin2';
import { getDisplayValuesForCalcs } from '@grafana/ui/src/components/uPlot/utils';
import { WallAnalyticActions } from 'app/features/wall-modern/charts/WallAnalyticActions';
import { WallAnalyticFrame } from 'app/features/wall-modern/charts/WallAnalyticFrame';
import {
  AnalyticHit,
  AnalyticInteraction,
  analyticTokens,
  analyticFrames,
} from 'app/features/wall-modern/charts/analytic';
import { WallFontStatusContext, WallTypographyContext } from 'app/features/wall-modern/typography';

import { getDataLinks } from '../status-history/utils';

import { XYChartTooltip } from './XYChartTooltip';
import { Options, SeriesMapping } from './panelcfg.gen';
import { prepData, prepScatter } from './scatter';
import { fmt } from './utils';

export const XYChartPanel = (props: PanelProps<Options>) => {
  const theme = useTheme2(),
    wall = useContext(WallTypographyContext),
    fonts = useContext(WallFontStatusContext);
  const { eventBus } = usePanelContext();
  const tokens = useMemo(() => (wall ? analyticTokens(theme) : undefined), [wall, theme]);
  const frames = useMemo(
    () => (wall ? analyticFrames(props.data.series, props.fieldConfig, theme) : props.data.series),
    [wall, props.data.series, props.fieldConfig, theme]
  );
  const current = useRef(frames);
  current.current = frames;
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
  // The native builder survives value polling; only geometry/schema/options/fonts rebuild it.
  const info = useMemo(
    () =>
      prepScatter(
        props.options,
        () => current.current,
        wall ? theme : config.theme2,
        tokens,
        wall ? interaction : undefined
      ),
    // Native mappings cache frame indices; schema, saved field settings and loaded fonts invalidate geometry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.options, props.data.structureRev, props.fieldConfig, theme, tokens, fonts, wall, interaction]
  );
  const facets = useMemo(() => prepData(info, frames), [info, frames]);
  const series = info.series;
  useEffect(() => {
    if (!wall) {
      return;
    }
    const hover = eventBus.getStream(DataHoverEvent).subscribe((e) => {
      const index = series.findIndex(
        (s, i) =>
          (props.options.seriesMapping === SeriesMapping.Manual ? props.options.series?.[i]?.name : s.name) ===
          e.payload.dataId
      );
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
  }, [wall, eventBus, series, props.options]);
  useEffect(() => {
    const hit = selected.current;
    const frame = hit && series[hit.sidx - 1]?.frame(frames);
    if (hit && (!frame || hit.didx >= frame.length)) {
      selected.current = undefined;
      setPoint(null);
    }
  }, [frames, series]);
  const hit = selected.current,
    selectedSeries = hit ? series[hit.sidx - 1] : undefined,
    frame = selectedSeries?.frame(frames);
  const action =
    hit && selectedSeries && frame && hit.didx < frame.length
      ? {
          title:
            props.options.seriesMapping === SeriesMapping.Manual
              ? (props.options.series?.[hit.sidx - 1]?.name ?? selectedSeries.name)
              : selectedSeries.name,
          rows: frame.fields
            .filter((f) => !f.config.custom?.hideFrom?.tooltip)
            .map((f) => ({ label: getFieldDisplayName(f, frame, frames), value: fmt(f, f.values[hit.didx]) })),
          links: getDataLinks(selectedSeries.y(frame), hit.didx),
        }
      : undefined;
  const legend = () => {
    if (!props.options.legend.showLegend) {
      return null;
    }
    const items: VizLegendItem[] = series.flatMap((s, i) => {
      const frame = s.frame(frames);
      if (!frame) {
        return [];
      }
      const field = s.y(frame);
      if (wall && field.config.custom?.hideFrom?.legend) {
        return [];
      }
      return s.legend().map((item) => ({
        ...item,
        fieldName: getFieldDisplayName(field, frame, frames),
        ...(wall
          ? { yAxis: info.builder?.getAxisPlacement(field.config.unit ?? 'y') === AxisPlacement.Right ? 2 : 1 }
          : {}),
        getDisplayValues: () => getDisplayValuesForCalcs(props.options.legend.calcs, field, theme),
        disabled: !(s.show ?? true),
        label:
          props.options.seriesMapping === SeriesMapping.Manual
            ? (props.options.series?.[i]?.name ?? `Series ${i + 1}`)
            : item.label,
        color: alpha(s.lineColor(frame) as string, 1),
      }));
    });
    return (
      <VizLayout.Legend placement={props.options.legend.placement} width={props.options.legend.width}>
        <VizLegend
          className={wall ? undefined : css({ div: { justifyContent: 'flex-start' } })}
          placement={props.options.legend.placement}
          items={items}
          displayMode={props.options.legend.displayMode}
        />
      </VizLayout.Legend>
    );
  };
  if (info.error || !info.builder || !facets) {
    return (
      <div className="panel-empty">
        <p>{info.error}</p>
      </div>
    );
  }
  const builder = info.builder;
  const render = (height: number) => (
    <VizLayout width={props.width} height={height} legend={legend()}>
      {(width, height) => (
        <UPlotChart config={builder} data={facets} width={width} height={height}>
          {props.options.tooltip.mode !== TooltipDisplayMode.None && (
            <TooltipPlugin2
              config={builder}
              hoverMode={TooltipHoverMode.xyOne}
              render={(u, indices, index, pinned, dismiss) => (
                <XYChartTooltip
                  data={frames}
                  dataIdxs={indices}
                  allSeries={series}
                  dismiss={dismiss}
                  isPinned={pinned}
                  options={props.options}
                  seriesIdx={index}
                />
              )}
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
