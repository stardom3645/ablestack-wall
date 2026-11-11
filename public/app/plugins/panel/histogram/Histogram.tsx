import * as React from 'react';
import uPlot, { AlignedData } from 'uplot';

import {
  DataFrame,
  FieldType,
  formattedValueToString,
  getFieldColorModeForField,
  getFieldSeriesColor,
  GrafanaTheme2,
  roundDecimals,
} from '@grafana/data';
import {
  histogramBucketSizes,
  isHistogramFrameBucketMaxFieldName,
} from '@grafana/data/src/transformations/transformers/histogram';
import { VizLegendOptions, ScaleDistribution, AxisPlacement, ScaleDirection, ScaleOrientation } from '@grafana/schema';
import {
  Themeable2,
  UPlotConfigBuilder,
  UPlotChart,
  VizLayout,
  PlotLegend,
  measureText,
  UPLOT_AXIS_FONT_SIZE,
} from '@grafana/ui';
import { DEFAULT_PLOT_CONFIG, getStackingGroups, preparePlotData2 } from '@grafana/ui/src/components/uPlot/utils';
import {
  AnalyticAppearance,
  AnalyticInteraction,
  analyticAxis,
  analyticTextMeasure,
  binIndex,
} from 'app/features/wall-modern/charts/analytic';

import { defaultFieldConfig, FieldConfig, Options } from './panelcfg.gen';

function incrRoundDn(num: number, incr: number) {
  return Math.floor(num / incr) * incr;
}

function incrRoundUp(num: number, incr: number) {
  return Math.ceil(num / incr) * incr;
}

export interface HistogramProps extends Themeable2 {
  options: Options; // used for diff
  alignedFrame: DataFrame; // This could take HistogramFields
  bucketCount?: number;
  bucketSize: number;
  width: number;
  height: number;
  structureRev?: number; // a number that will change when the frames[] structure changes
  legend: VizLegendOptions;
  rawSeries?: DataFrame[];
  appearance?: AnalyticAppearance;
  interaction?: AnalyticInteraction;
  children?: (builder: UPlotConfigBuilder, frame: DataFrame, xMinOnlyFrame: DataFrame) => React.ReactNode;
}

export function getBucketSize(frame: DataFrame) {
  // assumes BucketMin is fields[0] and BucktMax is fields[1]
  return frame.fields[0].type === FieldType.string
    ? 1
    : roundDecimals(frame.fields[1].values[0] - frame.fields[0].values[0], 9);
}

export function getBucketSize1(frame: DataFrame) {
  if (frame.length < 2) {
    return getBucketSize(frame);
  }
  // assumes BucketMin is fields[0] and BucktMax is fields[1]
  return frame.fields[0].type === FieldType.string
    ? 1
    : roundDecimals(frame.fields[1].values[1] - frame.fields[0].values[1], 9);
}

const prepConfig = (
  frame: DataFrame,
  theme: GrafanaTheme2,
  appearance?: AnalyticAppearance,
  interaction?: AnalyticInteraction
) => {
  // todo: scan all values in BucketMin and BucketMax fields to assert if uniform bucketSize

  // since this is x axis range, this should ideally come from xMin or xMax fields, not a count field
  // though both methods are probably hacks, and we should just accept explicit opts into this prepConfig
  let { min: xScaleMin, max: xScaleMax } = frame.fields[2].config;

  let builder = new UPlotConfigBuilder();
  if (appearance) {
    const padding = DEFAULT_PLOT_CONFIG.padding!;
    // Keep the final bin boundary label inside the canvas, including single-bin panels.
    builder.setPadding([padding[0], appearance.plotPaddingRight ?? padding[1], padding[2], padding[3]]);
  }

  let isOrdinalX = frame.fields[0].type === FieldType.string;

  // assumes BucketMin is fields[0] and BucktMax is fields[1]
  let bucketSize = getBucketSize(frame);
  let bucketSize1 = getBucketSize1(frame);

  let bucketFactor = bucketSize1 / bucketSize;

  let useLogScale = bucketSize1 !== bucketSize; // (imperfect floats)

  // splits shifter, to ensure splits always start at first bucket
  let xSplits: uPlot.Axis.Splits = (u, axisIdx, scaleMin, scaleMax, foundIncr, foundSpace) => {
    /** @ts-ignore */
    let minSpace = u.axes[axisIdx]._space;
    let bucketWidth = u.valToPos(u.data[0][0] + bucketSize, 'x') - u.valToPos(u.data[0][0], 'x');

    let firstSplit = incrRoundDn(xScaleMin ?? u.data[0][0], bucketSize);
    let lastSplit = incrRoundUp(xScaleMax ?? u.data[0][u.data[0].length - 1] + bucketSize, bucketSize);

    let splits = [];
    let skip = Math.ceil(minSpace / bucketWidth);

    for (let i = 0, s = firstSplit; s <= lastSplit; i++, s += bucketSize) {
      !(i % skip) && splits.push(s);
    }

    return splits;
  };

  builder.addScale({
    scaleKey: 'x', // bukkits
    isTime: false,
    distribution: isOrdinalX
      ? ScaleDistribution.Ordinal
      : useLogScale
        ? ScaleDistribution.Log
        : ScaleDistribution.Linear,
    log: 2,
    orientation: ScaleOrientation.Horizontal,
    direction: ScaleDirection.Right,
    range: useLogScale
      ? (u, wantedMin, wantedMax) => {
          return uPlot.rangeLog(wantedMin, wantedMax * bucketFactor, 2, true);
        }
      : (u, wantedMin, wantedMax) => {
          // these settings will prevent zooming, probably okay?
          if (xScaleMin != null) {
            wantedMin = xScaleMin;
          }
          if (xScaleMax != null) {
            wantedMax = xScaleMax;
          }

          let fullRangeMax = u.data[0][u.data[0].length - 1];

          // isOrdinalX is when we have classic histograms, which are LE, ordinal X, and already have 0 dummy bucket prepended
          // else we have calculated histograms which are GE and cardinal+linear X, and have no next dummy bucket appended
          // Wall zoom includes the bins touched by the selection. Rounding both ends
          // inward can invert a range wholly inside one bin and leave a blank chart.
          const origin = appearance && !isOrdinalX ? u.data[0][0] : 0;
          wantedMin =
            appearance && !isOrdinalX && xScaleMin == null
              ? origin + incrRoundDn(wantedMin - origin, bucketSize)
              : incrRoundUp(wantedMin, bucketSize);
          wantedMax =
            !isOrdinalX && wantedMax === fullRangeMax
              ? wantedMax + bucketSize
              : appearance && !isOrdinalX && xScaleMax == null
                ? origin + incrRoundUp(wantedMax - origin, bucketSize)
                : incrRoundDn(wantedMax, bucketSize);

          return [wantedMin, wantedMax];
        },
  });

  builder.addScale({
    scaleKey: 'y', // counts
    isTime: false,
    distribution: ScaleDistribution.Linear,
    orientation: ScaleOrientation.Vertical,
    direction: ScaleDirection.Up,
    softMin: 0,
  });

  const fmt = frame.fields[0].display!;
  const xAxisFormatter = (v: number) => {
    return formattedValueToString(fmt(v));
  };

  builder.addAxis({
    ...analyticAxis(appearance),
    scaleKey: 'x',
    isTime: false,
    placement: AxisPlacement.Bottom,
    incrs: isOrdinalX ? [1] : useLogScale ? undefined : histogramBucketSizes,
    splits: useLogScale || isOrdinalX ? undefined : xSplits,
    values: isOrdinalX
      ? (u, splits) => splits
      : (u, splits) => {
          const tickLabels = splits.map(xAxisFormatter);

          const maxWidth = tickLabels.reduce(
            (curMax, label) =>
              Math.max(
                appearance ? analyticTextMeasure(label) : measureText(label, UPLOT_AXIS_FONT_SIZE).width,
                curMax
              ),
            0
          );

          const labelSpacing = 10;
          const maxCount = u.bbox.width / ((maxWidth + labelSpacing) * devicePixelRatio);
          const keepMod = Math.ceil(tickLabels.length / maxCount);

          return tickLabels.map((label, i) => (i % keepMod === 0 ? label : null));
        },
    //incrs: () => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((mult) => mult * bucketSize),
    //splits: config.xSplits,
    //values: config.xValues,
    //grid: false,
    //ticks: false,
    //gap: 15,
    theme,
  });

  // assumes BucketMax is [1]
  let countField = frame.fields[2];
  let dispY = countField.display;

  builder.addAxis({
    ...analyticAxis(appearance),
    scaleKey: 'y',
    isTime: false,
    placement: AxisPlacement.Left,
    formatValue: (v, decimals) => formattedValueToString(dispY!(v, decimals)),
    //splits: config.xSplits,
    //values: config.xValues,
    //grid: false,
    //ticks: false,
    //gap: 15,
    theme,
  });

  builder.setCursor({
    points: { show: false },
    drag: {
      x: true,
      y: false,
      setScale: true,
      ...(appearance ? { dist: appearance.gestureIntent } : {}),
    },
  });

  let stackingGroups = getStackingGroups(xMinOnlyFrame(frame));
  builder.setStackingGroups(stackingGroups);
  if (appearance) {
    builder.setCursor({
      dataIdx: (u, seriesIdx, closestIdx, value) => {
        const row = isOrdinalX ? closestIdx : binIndex(frame, value);
        return row < 0 ? null : row;
      },
      focus: {
        prox: 30,
        dist: (u, seriesIdx, row, valPos, curPos) => {
          if (!frame.fields[seriesIdx + 1]?.values[row]) {
            return Infinity;
          }
          const group = stackingGroups.find((g) => g.series.includes(seriesIdx));
          const before = group?.series
            .slice(0, group.series.indexOf(seriesIdx))
            .filter((i) => u.series[i].show)
            .pop();
          const base = before == null ? 0 : u.data[before][row];
          const basePos = u.valToPos(base ?? 0, 'y');
          return curPos >= Math.min(basePos, valPos) && curPos <= Math.max(basePos, valPos)
            ? 0
            : Math.abs(curPos - valPos);
        },
      },
    });
  }

  let pathBuilder = uPlot.paths.bars!({
    align: 1,
    size: [1, Infinity],
    // A fixed separator must not make a wide bin look like a smaller value range.
    gap: appearance && frame.length > 1 ? appearance.binGap : 0,
  });

  let seriesIndex = 0;

  // assumes xMin is [0], xMax is [1]
  for (let i = 2; i < frame.fields.length; i++) {
    const field = frame.fields[i];

    field.state = field.state ?? {};
    field.state.seriesIndex = seriesIndex++;

    const customConfig: FieldConfig = { ...defaultFieldConfig, ...field.config.custom };

    const scaleKey = 'y';
    const colorMode = getFieldColorModeForField(field);
    const scaleColor = getFieldSeriesColor(field, theme);
    const seriesColor = scaleColor.color;

    builder.addSeries({
      scaleKey,
      lineWidth: customConfig.lineWidth,
      lineColor: seriesColor,
      //lineStyle: customConfig.lineStyle,
      fillOpacity: customConfig.fillOpacity,
      theme,
      colorMode,
      pathBuilder,
      //pointsBuilder: config.drawPoints,
      show: !customConfig.hideFrom?.viz,
      gradientMode: customConfig.gradientMode,
      thresholds: field.config.thresholds,

      hardMin: field.config.min,
      hardMax: field.config.max,
      softMin: customConfig.axisSoftMin,
      softMax: customConfig.axisSoftMax,

      // The following properties are not used in the uPlot config, but are utilized as transport for legend config
      dataFrameFieldIndex: field.state.origin,
    });
  }

  if (appearance && interaction) {
    builder.addHook('ready', (u) => interaction.ready(u));
    builder.addHook('destroy', () => interaction.ready(null));
    let dispose = () => {};
    builder.addHook('ready', (u) => {
      const context = (event: MouseEvent) => {
        const rect = u.over.getBoundingClientRect();
        const row = binIndex(frame, u.posToVal(event.clientX - rect.left, 'x'));
        if (row >= 0) {
          event.preventDefault();
          event.stopPropagation();
          interaction.pick({ sidx: 0, didx: row }, event);
          u.redraw(false);
        }
      };
      u.over.addEventListener('contextmenu', context);
      dispose = () => u.over.removeEventListener('contextmenu', context);
    });
    builder.addHook('destroy', () => dispose());
    builder.addHook('draw', (u) => {
      const selected = interaction.selected();
      if (!selected || selected.didx >= frame.length) {
        return;
      }
      const row = selected.didx;
      const min = frame.fields[0].type === FieldType.string ? row : frame.fields[0].values[row];
      const max = frame.fields[0].type === FieldType.string ? row + 1 : frame.fields[1].values[row];
      const x = u.valToPos(min, 'x', true),
        right = u.valToPos(max, 'x', true);
      u.ctx.save();
      u.ctx.beginPath();
      u.ctx.rect(u.bbox.left, u.bbox.top, u.bbox.width, u.bbox.height);
      u.ctx.clip();
      u.ctx.strokeStyle = appearance.text;
      u.ctx.lineWidth = appearance.selectionStroke * uPlot.pxRatio;
      u.ctx.strokeRect(x, u.bbox.top, right - x, u.bbox.height);
      u.ctx.restore();
    });
  }
  return builder;
};

// since we're reusing timeseries prep for stacking, we need to make a tmp frame where fields match the uplot data
// by removing the x bucket max field to make sure stacking group series idxs match up
const xMinOnlyFrame = (frame: DataFrame) => ({
  ...frame,
  fields: frame.fields.filter((f) => !isHistogramFrameBucketMaxFieldName(f.name)),
});

const preparePlotData = (builder: UPlotConfigBuilder, xMinOnlyFrame: DataFrame) => {
  // uPlot's bars pathBuilder will draw rects even if 0 (to distinguish them from nulls)
  // but for histograms we want to omit them, so remap 0s -> nulls
  for (let i = 1; i < xMinOnlyFrame.fields.length; i++) {
    let counts = xMinOnlyFrame.fields[i].values;

    for (let j = 0; j < counts.length; j++) {
      if (counts[j] === 0) {
        counts[j] = null; // mutates!
      }
    }
  }

  return preparePlotData2(xMinOnlyFrame, builder.getStackingGroups());
};

interface State {
  alignedData: AlignedData;
  alignedFrame: DataFrame;
  config?: UPlotConfigBuilder;
  xMinOnlyFrame: DataFrame;
}

export class Histogram extends React.Component<HistogramProps, State> {
  constructor(props: HistogramProps) {
    super(props);
    this.state = this.prepState(props);
  }

  prepState(props: HistogramProps, withConfig = true): State {
    const { alignedFrame } = props;

    const config = withConfig
      ? prepConfig(alignedFrame, props.theme, props.appearance, props.interaction)
      : this.state.config!;
    const xMinOnly = xMinOnlyFrame(alignedFrame);
    const renderFrame = props.appearance
      ? { ...xMinOnly, fields: xMinOnly.fields.map((field) => ({ ...field, values: [...field.values] })) }
      : xMinOnly;
    const alignedData = preparePlotData(config, renderFrame);

    return {
      alignedFrame,
      alignedData,
      config,
      xMinOnlyFrame: xMinOnly,
    };
  }

  renderLegend(config: UPlotConfigBuilder) {
    const { legend } = this.props;

    if (!config || legend.showLegend === false) {
      return null;
    }

    const frames = this.props.options.combine ? [this.props.alignedFrame] : this.props.rawSeries!;

    return <PlotLegend data={frames} config={config} maxHeight="35%" maxWidth="60%" {...legend} />;
  }

  componentDidUpdate(prevProps: HistogramProps) {
    const { structureRev, alignedFrame, bucketSize, bucketCount } = this.props;

    if (alignedFrame !== prevProps.alignedFrame || this.props.appearance !== prevProps.appearance) {
      const shouldReconfig =
        this.state.config == null ||
        bucketCount !== prevProps.bucketCount ||
        bucketSize !== prevProps.bucketSize ||
        this.props.options !== prevProps.options ||
        this.state.config === undefined ||
        structureRev !== prevProps.structureRev ||
        !structureRev ||
        this.props.appearance !== prevProps.appearance;

      const newState = this.prepState(this.props, shouldReconfig);

      this.setState(newState);
    }
  }

  render() {
    const { width, height, children, alignedFrame } = this.props;
    const { config } = this.state;

    if (!config) {
      return null;
    }

    return (
      <VizLayout width={width} height={height} legend={this.renderLegend(config)}>
        {(vizWidth: number, vizHeight: number) => (
          <UPlotChart config={this.state.config!} data={this.state.alignedData} width={vizWidth} height={vizHeight}>
            {children ? children(config, alignedFrame, this.state.xMinOnlyFrame) : null}
          </UPlotChart>
        )}
      </VizLayout>
    );
  }
}
