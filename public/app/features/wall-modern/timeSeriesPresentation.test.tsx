import { render, screen } from '@testing-library/react';
import uPlot from 'uplot';

import {
  createTheme,
  DataFrame,
  dateTime,
  FieldColorModeId,
  FieldConfigSource,
  FieldType,
  formattedValueToString,
  getDisplayProcessor,
  getFieldSeriesColor,
  ThresholdsMode,
  toDataFrame,
} from '@grafana/data';
import {
  AxisColorMode,
  GraphDrawStyle,
  GraphGradientMode,
  GraphTransform,
  LegendDisplayMode,
  LineInterpolation,
  ScaleDistribution,
  SortOrder,
  StackingMode,
  TooltipDisplayMode,
  VisibilityMode,
} from '@grafana/schema';
import {
  TimeSeriesPresentationContext,
  TimeSeriesStyleConfigContext,
} from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { getContentItems } from '@grafana/ui/src/components/VizTooltip/utils';
import { PlotLegend } from '@grafana/ui/src/components/uPlot/PlotLegend';
import { preparePlotConfigBuilder } from 'app/core/components/TimeSeries/utils';

import { isWallTimeSeriesRoute, wallTimeSeriesTokens } from './chartTokens';
import { metricPresentation, metricProfiles } from './charts/metricProfiles';
import { presentTimeSeriesFrames } from './timeSeriesPresentation';

const theme = createTheme({ colors: { mode: 'light' } });
const tokens = wallTimeSeriesTokens(theme);
const source: FieldConfigSource = { defaults: {}, overrides: [] };

function frameWith(
  custom = {},
  color = { mode: FieldColorModeId.PaletteClassic } as { mode: string; fixedColor?: string }
): DataFrame {
  const frame = toDataFrame({
    fields: [
      { name: 'Time', type: FieldType.time, values: [1000, 2000, 3000] },
      {
        name: 'CPU',
        type: FieldType.number,
        values: [23.4, null, 81],
        config: {
          unit: 'percent',
          min: 0,
          max: 100,
          color,
          thresholds: {
            mode: ThresholdsMode.Absolute,
            steps: [
              { value: -Infinity, color: 'green' },
              { value: 80, color: 'red' },
            ],
          },
          custom: {
            drawStyle: GraphDrawStyle.Line,
            lineWidth: 1,
            fillOpacity: 10,
            gradientMode: GraphGradientMode.None,
            showPoints: VisibilityMode.Auto,
            pointSize: 5,
            spanNulls: false,
            ...custom,
          },
        },
      },
    ],
  });
  frame.fields[1].state = { seriesIndex: 0, displayName: 'CPU', origin: { frameIndex: 0, fieldIndex: 1 } };
  frame.fields.forEach((field) => {
    field.display = getDisplayProcessor({ field, theme });
  });
  return frame;
}

function builder(frame: DataFrame, modern = false) {
  return preparePlotConfigBuilder({
    frame,
    allFrames: [frame],
    theme,
    timeZones: ['utc'],
    getTimeRange: () => ({ from: dateTime(1000), to: dateTime(3000), raw: { from: 'now-1h', to: 'now' } }),
    timeSeriesPresentation: modern ? tokens : undefined,
  });
}

it('changes only presentation copies, preserving vectors, units, links, thresholds, transforms and numeric formatting', () => {
  const frame = frameWith({
    transform: GraphTransform.NegativeY,
    scaleDistribution: { type: ScaleDistribution.Log, log: 2 },
    lineInterpolation: LineInterpolation.StepAfter,
  });
  const originalConfig = JSON.stringify(frame.fields[1].config);
  const originalVectors = frame.fields.map((field) => field.values);
  const links = jest.fn(() => []);
  frame.fields[1].getLinks = links;
  const result = presentTimeSeriesFrames([frame], source, theme, tokens)[0];
  const field = result.fields[1];
  expect(result).not.toBe(frame);
  expect(field).not.toBe(frame.fields[1]);
  expect(result.fields.map((field) => field.values)).toEqual(originalVectors);
  result.fields.forEach((field, index) => expect(field.values).toBe(originalVectors[index]));
  expect(JSON.stringify(frame.fields[1].config)).toBe(originalConfig);
  expect(field.config.thresholds).toBe(frame.fields[1].config.thresholds);
  expect(field.getLinks).toBe(links);
  expect(field.config.custom).toMatchObject({
    lineWidth: tokens.lineWidth,
    showPoints: 'never',
    spanNulls: false,
    transform: GraphTransform.NegativeY,
    lineInterpolation: LineInterpolation.StepAfter,
  });
  expect(field.config.custom?.scaleDistribution).toBe(frame.fields[1].config.custom?.scaleDistribution);
  expect(formattedValueToString(field.display!(23.4))).toBe(formattedValueToString(frame.fields[1].display!(23.4)));
  expect(getFieldSeriesColor(field, theme).color).toBe(tokens.palette[0]);
});

it.each([
  FieldColorModeId.Fixed,
  FieldColorModeId.Thresholds,
  FieldColorModeId.ContinuousGrYlRd,
  FieldColorModeId.Shades,
])('preserves explicit/semantic color mode %s', (mode) => {
  const frame = frameWith({}, { mode, fixedColor: '#ad2f46' });
  const result = presentTimeSeriesFrames([frame], source, theme, tokens)[0].fields[1];
  expect(result.config.color).toBe(frame.fields[1].config.color);
  expect(result.display).toBe(frame.fields[1].display);
  expect(getFieldSeriesColor(result, theme).color).toBe(getFieldSeriesColor(frame.fields[1], theme).color);
});

it('preserves matching color and graph-style overrides even when they match the Grafana defaults', () => {
  const frame = frameWith();
  const config: FieldConfigSource = {
    defaults: {},
    overrides: [
      {
        matcher: { id: 'byName', options: 'CPU' },
        properties: [
          { id: 'color', value: { mode: 'palette-classic' } },
          { id: 'custom.lineWidth', value: 1 },
          { id: 'custom.showPoints', value: 'auto' },
          { id: 'custom.fillOpacity', value: 10 },
        ],
      },
    ],
  };
  const before = JSON.stringify(config);
  const field = presentTimeSeriesFrames([frame], config, theme, tokens)[0].fields[1];
  expect(field.config.color).toBe(frame.fields[1].config.color);
  expect(field.config.custom).toEqual(frame.fields[1].config.custom);
  expect(JSON.stringify(config)).toBe(before);
});

it.each([GraphGradientMode.Scheme, GraphGradientMode.Hue])(
  'preserves semantic gradient %s and its colors',
  (gradientMode) => {
    const frame = frameWith({ gradientMode, fillOpacity: 70 });
    const field = presentTimeSeriesFrames([frame], source, theme, tokens)[0].fields[1];
    expect(field.config.custom).toMatchObject({ gradientMode, fillOpacity: 70 });
    expect(field.config.color).toBe(frame.fields[1].config.color);
  }
);

it('preserves stacking, zero fill, explicit markers, hidden strokes and points-only plots', () => {
  for (const custom of [
    { stacking: { mode: StackingMode.Percent, group: 'A' }, fillOpacity: 60 },
    { fillOpacity: 0 },
    { lineWidth: 0 },
    { showPoints: VisibilityMode.Always, pointSize: 8 },
    { drawStyle: GraphDrawStyle.Points, pointSize: 8 },
  ]) {
    const frame = frameWith(custom);
    const field = presentTimeSeriesFrames([frame], source, theme, tokens)[0].fields[1];
    expect(field.config.custom).toMatchObject(custom);
    if (custom.lineWidth === 0) {
      expect(field.config.custom?.showPoints).toBe(VisibilityMode.Auto);
    }
  }
});

it('uses native palette indexing/name hashing and retains the same color after hiding another series', () => {
  const frame = frameWith();
  const second = {
    ...frame.fields[1],
    name: 'Memory',
    state: { ...frame.fields[1].state, displayName: 'Memory', seriesIndex: 1 },
  };
  frame.fields.push(second);
  const projected = presentTimeSeriesFrames([frame], source, theme, tokens)[0];
  expect(getFieldSeriesColor(projected.fields[2], theme).color).toBe(tokens.palette[1]);
  frame.fields[1].config.custom!.hideFrom = { legend: false, tooltip: false, viz: true };
  expect(getFieldSeriesColor(presentTimeSeriesFrames([frame], source, theme, tokens)[0].fields[2], theme).color).toBe(
    tokens.palette[1]
  );
  frame.fields[2].config = { ...frame.fields[2].config, color: { mode: FieldColorModeId.PaletteClassicByName } };
  const expected = getFieldSeriesColor(frame.fields[2], {
    ...theme,
    visualization: { ...theme.visualization, palette: tokens.palette },
  }).color;
  expect(getFieldSeriesColor(presentTimeSeriesFrames([frame], source, theme, tokens)[0].fields[2], theme).color).toBe(
    expected
  );
});

it('keeps plot, tooltip and legend colors identical using existing native consumers', () => {
  const frame = presentTimeSeriesFrames([frameWith()], source, theme, tokens)[0];
  const config = builder(frame, true);
  const plot = config.getConfig();
  const rows = getContentItems(
    frame.fields,
    frame.fields[0],
    [0, 0],
    1,
    TooltipDisplayMode.Single,
    SortOrder.None,
    (field) => field.type === FieldType.number
  );
  expect(rows[0].color).toBe(tokens.palette[0]);
  expect(plot.series[1].stroke).toBe(rows[0].color);
  render(
    <TimeSeriesPresentationContext.Provider value={tokens}>
      <PlotLegend
        data={[frame]}
        config={config}
        placement="bottom"
        displayMode={LegendDisplayMode.List}
        calcs={[]}
        showLegend
      />
    </TimeSeriesPresentationContext.Provider>
  );
  expect(screen.getByRole('button', { name: 'CPU' })).toBeInTheDocument();
});

it('keeps native range, gap handling, series-colored axes and isolated points while styling the actual uPlot configuration', () => {
  const original = frameWith({ axisColorMode: AxisColorMode.Series });
  const projected = presentTimeSeriesFrames([original], source, theme, tokens)[0];
  const oldConfig = builder(original).getConfig();
  const modern = builder(projected, true).getConfig();
  expect(modern.series[1]).toMatchObject({ width: tokens.lineWidth, spanGaps: false, pxAlign: false });
  expect(oldConfig.series[1].pxAlign).toBeUndefined();
  expect(modern.series[1].dash).toBeUndefined();
  expect(modern.series[1].points?.show).toBe(false);
  expect(modern.axes![1]).toMatchObject({ stroke: tokens.palette[0], grid: { dash: tokens.gridDash } });
  expect(modern.axes![0].grid?.show).toBe(false);
  expect(modern.axes![0].font).toContain(`${tokens.axisFontSize}px`);
  expect(modern.axes![0].font).toBe(`${tokens.axisFontWeight} ${tokens.axisFontSize}px ${tokens.fontFamily}`);
  expect(oldConfig.axes![0].font).not.toContain('Wall Inter');
  expect(modern.padding).toEqual([null, tokens.plotPaddingRight, null, null]);
  for (const key of Object.keys(modern.scales!)) {
    const { range, ...scale } = modern.scales![key];
    const { range: nativeRange, ...nativeScale } = oldConfig.scales![key];
    expect(scale).toEqual(nativeScale);
    const plot = { scales: modern.scales } as unknown as uPlot;
    expect((range as uPlot.Range.Function)(plot, 23.4, 81, key)).toEqual(
      (nativeRange as uPlot.Range.Function)(plot, 23.4, 81, key)
    );
  }
  const plot = {
    series: [{}, { idxs: [0, 2] }],
    data: [
      [1000, 2000, 3000],
      [23.4, null, 81],
    ],
    valToPos: (value: number) => (value - 1000) / 100,
  } as unknown as uPlot;
  const filter = modern.series[1].points!.filter;
  expect(typeof filter).toBe('function');
  if (typeof filter === 'function') {
    expect(filter(plot, 1, false, [[0, 20]])).toEqual([0, 2]);
  }
});

it('keeps explicit dashed/dotted lines and interpolation instead of disguising them as solid splines', () => {
  for (const fill of ['dash', 'dot']) {
    const original = frameWith({
      lineStyle: { fill, dash: [3, 5] },
      lineInterpolation: LineInterpolation.StepAfter,
      showPoints: VisibilityMode.Always,
    });
    const projected = presentTimeSeriesFrames([original], source, theme, tokens)[0];
    const config = builder(projected, true).getConfig();
    expect(config.series[1].dash).toEqual([3, 5]);
    expect(config.series[1].pxAlign).toBeUndefined();
    expect(config.series[1].points?.show).toBe(true);
    expect(projected.fields[1].config.custom?.lineInterpolation).toBe(LineInterpolation.StepAfter);
  }
});

it('does not apply effective chart styling to siblings just because a dashboard is configured for charts', () => {
  const frame = frameWith();
  const legend = (
    <PlotLegend
      data={[frame]}
      config={builder(frame)}
      placement="bottom"
      displayMode={LegendDisplayMode.List}
      calcs={[]}
      showLegend
    />
  );
  const { container, rerender } = render(legend);
  const nativeMarkup = container.innerHTML;
  rerender(<TimeSeriesStyleConfigContext.Provider value={tokens}>{legend}</TimeSeriesStyleConfigContext.Provider>);
  expect(container.innerHTML).toBe(nativeMarkup);
});

it('shares chart styling across dashboard UIDs, retaining fullscreen and excluding editing', () => {
  const path = '/d/aec03x1adsi68f/storage';
  expect(isWallTimeSeriesRoute(path)).toBe(true);
  expect(isWallTimeSeriesRoute(path, '?viewPanel=panel-176')).toBe(true);
  expect(isWallTimeSeriesRoute(path, '?kiosk')).toBe(true);
  expect(isWallTimeSeriesRoute(path, '?editPanel=176')).toBe(false);
  expect(isWallTimeSeriesRoute('/d/fec03giqwtw5cf/overview')).toBe(true);
  expect(isWallTimeSeriesRoute('/d/aec03x1adsi68f-copy/storage')).toBe(true);
});

it.each(metricProfiles)('keeps saved graph settings and data identical for profile $value', (profile) => {
  const frame = frameWith({
    lineInterpolation: LineInterpolation.StepAfter,
    lineWidth: 1,
    fillOpacity: 40,
    gradientMode: GraphGradientMode.None,
    showPoints: VisibilityMode.Auto,
    pointSize: 5,
  });
  const original = JSON.stringify(frame.fields[1].config);
  const config: FieldConfigSource = { defaults: frame.fields[1].config, overrides: [] };
  const result = presentTimeSeriesFrames([frame], config, theme, metricPresentation(tokens, profile.value))[0];
  expect(result.fields[1].config.custom).toEqual(frame.fields[1].config.custom);
  expect(result.fields[1].values).toBe(frame.fields[1].values);
  expect(result.fields[1].config.unit).toBe('percent');
  expect(result.fields[1].config.thresholds).toBe(frame.fields[1].config.thresholds);
  expect(JSON.stringify(frame.fields[1].config)).toBe(original);
});

it('uses the same native Linear paths, keeping subpixel peaks and dense-column extrema without Bezier smoothing', () => {
  const y = Array.from({ length: 2001 }, (_, i) =>
    i === 1001 ? 99 : i === 1002 ? -20 : i === 900 ? null : 20 + (i % 3) * 0.01
  );
  const x = y.map((_, i) => i);
  const raw = frameWith({ lineInterpolation: LineInterpolation.Linear, fillOpacity: 0 });
  raw.fields[0].values = x;
  raw.fields[1].values = y;
  raw.length = x.length;
  const original = JSON.stringify([x, y]);
  const projected = presentTimeSeriesFrames([raw], { defaults: raw.fields[1].config, overrides: [] }, theme, tokens)[0];
  const path = (fieldFrame: DataFrame, modern: boolean, round: (n: number) => number) => {
    const config = builder(fieldFrame, modern).getConfig().series[1];
    const fake = {
      mode: 1,
      _data: [x, y],
      bands: [],
      series: [
        { scale: 'x' },
        {
          ...config,
          scale: 'y',
          fill: null,
          pxRound: round,
          gaps: (_u: unknown, _s: unknown, _i: unknown, _j: unknown, gaps: unknown) => gaps,
        },
      ],
      scales: { x: { ori: 0, dir: 1 }, y: { ori: 1, dir: 1 } },
      bbox: { left: 0, top: 0, width: 200, height: 100 },
      valToPosH: (v: number) => v / 10,
      valToPosV: (v: number) => 100 - v,
    } as unknown as uPlot;
    const paths = config.paths;
    if (typeof paths !== 'function') {
      throw new Error('Missing native path builder');
    }
    return paths(fake, 1, 0, y.length - 1)!.stroke as Path2D;
  };
  for (const round of [Math.round, (n: number) => n]) {
    const native = path(raw, false, round);
    const wall = path(projected, true, round);
    expect((wall.lineTo as jest.Mock).mock.calls).toEqual((native.lineTo as jest.Mock).mock.calls);
    expect((wall.lineTo as jest.Mock).mock.calls.some(([, value]) => value === 1)).toBe(true);
    expect((wall.lineTo as jest.Mock).mock.calls.some(([, value]) => value === 120)).toBe(true);
    expect(wall.bezierCurveTo).not.toHaveBeenCalled();
    expect(wall.quadraticCurveTo).not.toHaveBeenCalled();
  }
  expect(JSON.stringify([x, y])).toBe(original);
});

it.each([
  ['cpu', 's'],
  ['memory', 'bytes'],
  ['network', 'Bps'],
  ['disk', 'iops'],
  ['latency', 'ms'],
  ['storage', 'gbytes'],
])('retains %s unit %s and the native formatter', (profile, unit) => {
  const frame = frameWith();
  frame.fields[1].config.unit = unit;
  frame.fields[1].display = getDisplayProcessor({ field: frame.fields[1], theme });
  const copy = presentTimeSeriesFrames([frame], source, theme, metricPresentation(tokens, profile))[0].fields[1];
  expect(copy.config.unit).toBe(unit);
  expect(copy.values).toBe(frame.fields[1].values);
  expect(formattedValueToString(copy.display!(12345.678))).toBe(
    formattedValueToString(frame.fields[1].display!(12345.678))
  );
});

it.each([1, 2])('keeps native physical grid widths and CSS marker sizing at DPR %s', (dpr) => {
  const previous = window.devicePixelRatio;
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: dpr });
  try {
    const modern = builder(presentTimeSeriesFrames([frameWith()], source, theme, tokens)[0], true).getConfig();
    expect(modern.axes![1].grid?.width).toBe(1 / dpr);
    expect(modern.cursor?.points?.width).toBe(tokens.markerStrokeWidth);
    expect(modern.cursor?.points?.stroke).toBe(tokens.surface);
    expect(modern.cursor?.focus?.alpha).toBe(tokens.focusAlpha);
    const paint = modern.cursor?.points?.fill as (u: uPlot, index: number) => string;
    expect(paint({ series: [{}, { points: { _stroke: 'rgba(12, 34, 56, 0.8)' } }] } as unknown as uPlot, 1)).toBe(
      'rgba(12, 34, 56, 0.8)'
    );
  } finally {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: previous });
  }
});

it('attenuates only implicit unstacked area defaults as series overlap increases, preserving explicit fill', () => {
  const frames = Array.from({ length: 12 }, () => frameWith({ fillOpacity: 10 }));
  const result = presentTimeSeriesFrames(frames, source, theme, tokens);
  expect(result[0].fields[1].config.custom!.fillOpacity).toBeCloseTo(tokens.fillOpacity / Math.sqrt(12));
  const explicit = presentTimeSeriesFrames(
    frames,
    { defaults: { custom: { fillOpacity: 10 } }, overrides: [] },
    theme,
    tokens
  );
  expect(explicit[0].fields[1].config.custom!.fillOpacity).toBe(10);
  expect(frames[0].fields[1].config.custom!.fillOpacity).toBe(10);
});
