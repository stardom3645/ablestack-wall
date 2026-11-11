import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import uPlot from 'uplot';

import { PanelProps, VizOrientation } from '@grafana/data';
import { PanelDataErrorView } from '@grafana/runtime';
import {
  TooltipDisplayMode,
  TooltipPlugin2,
  UPLOT_AXIS_FONT_SIZE,
  UPlotChart,
  VizLayout,
  measureText,
  useTheme2,
} from '@grafana/ui';
import { TimeSeriesPresentationContext } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { TooltipHoverMode } from '@grafana/ui/src/components/uPlot/plugins/TooltipPlugin2';
import { BarMenuPoint, BarSelection, WallBarControls } from 'app/features/wall-modern/charts/WallBarControls';
import {
  barFieldKey,
  findBarField,
  categoryIndices,
  initialCategoryOrder,
  measureBarText,
  presentBarFrames,
  projectCategories,
  projectCategoryField,
  truncateCategory,
  wallBarTokens,
  wallCategoricalTokens,
} from 'app/features/wall-modern/charts/categorical';
import { WallFontStatusContext, WallTypographyContext } from 'app/features/wall-modern/typography';

import { TimeSeriesTooltip } from '../timeseries/TimeSeriesTooltip';

import { BarChartLegend, hasVisibleLegendSeries } from './BarChartLegend';
import { BarAppearance, BarInteraction } from './bars';
import { Options } from './panelcfg.gen';
import { prepConfig, prepSeries } from './utils';

const charWidth = measureText('M', UPLOT_AXIS_FONT_SIZE).width;
const toRads = Math.PI / 180;

export const BarChartPanel = (props: PanelProps<Options>) => {
  const { data, options, fieldConfig, width, height, timeZone, id, replaceVariables } = props;
  const theme = useTheme2();
  const wall = useContext(WallTypographyContext);
  const fontRevision = useContext(WallFontStatusContext);
  const tokens = useMemo(() => (wall ? wallCategoricalTokens(theme) : undefined), [wall, theme]);
  const [order, setOrder] = useState(initialCategoryOrder);
  const [selection, setSelection] = useState<BarSelection>();
  const selected = useRef(selection);
  const [menuPoint, setMenuPoint] = useState<BarMenuPoint | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const plot = useRef<uPlot | null>(null);
  const {
    barWidth,
    barRadius = 0,
    showValue,
    groupWidth,
    stacking,
    legend,
    tooltip,
    text,
    xTickLabelRotation,
    xTickLabelSpacing,
    fullHighlight,
    xField,
    colorByField,
  } = options;
  let { orientation, xTickLabelMaxLength = 0 } = options;
  orientation =
    orientation === VizOrientation.Auto
      ? width < height
        ? VizOrientation.Horizontal
        : VizOrientation.Vertical
      : orientation;
  xTickLabelMaxLength =
    xTickLabelRotation === 0
      ? Infinity
      : xTickLabelMaxLength || Math.floor(height / 2 / Math.sin(Math.abs(xTickLabelRotation * toRads)) / charWidth - 3);

  const nativeInfo = useMemo(
    () => prepSeries(data.series, fieldConfig, stacking, theme, xField, colorByField),
    [data.series, fieldConfig, stacking, theme, xField, colorByField]
  );
  const sourceInfo = useMemo(
    () => (tokens ? { ...nativeInfo, series: presentBarFrames(nativeInfo.series, fieldConfig, theme) } : nativeInfo),
    [nativeInfo, tokens, fieldConfig, theme]
  );
  const source = sourceInfo.series[0];
  const indices = useMemo(
    () => (source ? categoryIndices(source, wall ? order : initialCategoryOrder) : []),
    [source, wall, order]
  );
  const info = useMemo(
    () =>
      wall && source
        ? {
            ...sourceInfo,
            series: [projectCategories(source, indices)],
            _rest: sourceInfo._rest.map((field) => projectCategoryField(field, indices)),
            color: sourceInfo.color ? projectCategoryField(sourceInfo.color, indices) : sourceInfo.color,
          }
        : sourceInfo,
    [wall, source, sourceInfo, indices]
  );
  const vizSeries = useMemo(
    () =>
      info.series.map((frame) => ({
        ...frame,
        fields: frame.fields.filter((field, i) => i === 0 || !field.state?.hideFrom?.viz),
      })),
    [info.series]
  );
  const xGroupsCount = vizSeries[0]?.length ?? 0;
  const seriesCount = vizSeries[0]?.fields.length ?? 0;
  const totalSeries = Math.max(0, (info.series[0]?.fields.length ?? 0) - 1);
  const runtime = useRef({ indices, frame: vizSeries[0], fullFrame: info.series[0] });
  runtime.current = { indices, frame: vizSeries[0], fullFrame: info.series[0] };
  const select = (next?: BarSelection) => {
    selected.current = next;
    setSelection(next);
    setMenuPoint(null);
    plot.current?.redraw(false);
  };
  // View-only selection/menus must not rebuild the Canvas or capture stale projected row indices.
  const interaction = useMemo<BarInteraction>(
    () => ({
      pick: (hit, event, context) => {
        const field = runtime.current.frame.fields[hit.sidx];
        const next = {
          row: runtime.current.indices[hit.didx],
          field: barFieldKey(field, runtime.current.fullFrame.fields.indexOf(field)),
        };
        selected.current = next;
        setSelection(next);
        setMenuPoint(context ? { x: event.clientX, y: event.clientY } : null);
      },
      selected: () => {
        const current = selected.current;
        const { indices, frame, fullFrame } = runtime.current;
        if (!current || !frame) {
          return;
        }
        const didx = indices.indexOf(current.row);
        const sidx = frame.fields.findIndex((field) => field === findBarField(fullFrame, current.field));
        return didx >= 0 && sidx > 0 ? { didx, sidx } : undefined;
      },
    }),
    []
  );
  useEffect(() => {
    if (selection && (!source || selection.row >= source.length || !findBarField(source, selection.field))) {
      select(undefined);
    }
    if (order.field && (!source || !findBarField(source, order.field))) {
      setOrder(initialCategoryOrder);
    }
    // Source polling preserves a valid selection, never modifies query vectors or saved options.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const appearance = useMemo(() => {
    if (!tokens) {
      return;
    }
    const horizontal = orientation === VizOrientation.Horizontal;
    const budget = horizontal
      ? Math.min(tokens.categoryWidth, width * tokens.categoryWidthRatio)
      : Math.max(18, (width - tokens.valueAxisReserve) / Math.max(1, xGroupsCount) - tokens.axisGap);
    return {
      ...tokens,
      fontLoadRevision: fontRevision,
      hoverStroke: tokens.text,
      measure: measureBarText,
      formatCategory: (value: string) =>
        xTickLabelRotation !== 0
          ? value
          : truncateCategory(value, budget, (value) => measureBarText(value, tokens.axisFontSize).width),
    } satisfies typeof tokens & BarAppearance;
  }, [tokens, orientation, width, xGroupsCount, xTickLabelRotation, fontRevision]);

  const { builder, prepData } = useMemo(() => {
    if (xGroupsCount === 0) {
      return { builder: null, prepData: null };
    }
    const result = prepConfig({
      series: vizSeries,
      totalSeries,
      color: info.color,
      orientation,
      options: tokens ? { ...options, xTickLabelMaxLength } : options,
      timeZone,
      theme,
      presentation: appearance,
      interaction: wall ? interaction : undefined,
    });
    if (wall) {
      result.builder.addHook('init', (u) => {
        plot.current = u;
      });
      result.builder.addHook('destroy', (u) => {
        if (plot.current === u) {
          plot.current = null;
        }
      });
    }
    return result;
    // Keep the existing builder/prepData pipeline: new values/sort order update data, not the plot instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    orientation,
    timeZone,
    data.structureRev,
    totalSeries,
    seriesCount,
    xGroupsCount,
    barWidth,
    barRadius,
    showValue,
    groupWidth,
    stacking,
    legend,
    tooltip,
    text?.valueSize,
    xTickLabelRotation,
    xTickLabelSpacing,
    fullHighlight,
    xField,
    colorByField,
    xTickLabelMaxLength,
    appearance,
    interaction,
    wall,
  ]);
  const plotData = useMemo(
    () => (prepData == null ? [] : prepData(vizSeries, info.color)),
    [prepData, vizSeries, info.color]
  );

  if (info.warn != null || builder == null) {
    return (
      <PanelDataErrorView
        panelId={id}
        fieldConfig={fieldConfig}
        data={data}
        message={info.warn ?? ''}
        needsNumberField={true}
      />
    );
  }
  const legendComp =
    legend.showLegend && hasVisibleLegendSeries(builder, info.series) ? (
      <BarChartLegend data={info.series} colorField={info.color} {...legend} />
    ) : null;
  const chart = (
    <VizLayout
      width={width}
      height={Math.max(1, height - (tokens ? wallBarTokens.toolbarHeight : 0))}
      legend={legendComp}
    >
      {(vizWidth, vizHeight) => (
        <UPlotChart config={builder} data={plotData} width={vizWidth} height={vizHeight}>
          {options.tooltip.mode !== TooltipDisplayMode.None && (
            <TooltipPlugin2
              config={builder}
              maxWidth={options.tooltip.maxWidth}
              hoverMode={
                options.tooltip.mode === TooltipDisplayMode.Single ? TooltipHoverMode.xOne : TooltipHoverMode.xAll
              }
              render={(u, dataIdxs, seriesIdx, isPinned) => (
                <TimeSeriesTooltip
                  series={vizSeries[0]}
                  _rest={info._rest}
                  dataIdxs={dataIdxs}
                  seriesIdx={seriesIdx}
                  mode={options.tooltip.mode}
                  sortOrder={options.tooltip.sort}
                  isPinned={isPinned}
                  maxHeight={options.tooltip.maxHeight}
                  replaceVariables={replaceVariables}
                />
              )}
            />
          )}
        </UPlotChart>
      )}
    </VizLayout>
  );
  if (!tokens) {
    return chart;
  }
  return (
    <TimeSeriesPresentationContext.Provider value={tokens}>
      <div
        ref={host}
        className="wall-bar-workspace"
        data-wall-bar-chart
        data-compact={width < 450}
        tabIndex={-1}
        style={{ width, height, '--wall-bar-toolbar-height': `${wallBarTokens.toolbarHeight}px` }}
      >
        <WallBarControls
          frame={source}
          indices={indices}
          order={order}
          onOrder={(next) => {
            setOrder(next);
            setMenuPoint(null);
          }}
          selection={selection}
          onSelect={select}
          menuPoint={menuPoint}
          onCloseMenu={() => setMenuPoint(null)}
          returnFocus={host}
        />
        {chart}
      </div>
    </TimeSeriesPresentationContext.Provider>
  );
};
