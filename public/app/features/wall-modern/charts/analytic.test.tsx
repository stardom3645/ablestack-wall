import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type uPlot from 'uplot';

import {
  ThresholdsMode,
  createTheme,
  FieldColorModeId,
  FieldConfigSource,
  FieldType,
  getDisplayProcessor,
  toDataFrame,
} from '@grafana/data';
import { GraphGradientMode, LegendDisplayMode, SortOrder, TooltipDisplayMode } from '@grafana/schema';
import { UPlotConfigBuilder } from '@grafana/ui';
import { TimeSeriesPresentationContext } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { Histogram, getBucketSize1 } from 'app/plugins/panel/histogram/Histogram';
import { HistogramTooltip } from 'app/plugins/panel/histogram/HistogramTooltip';
import { XYChartTooltip } from 'app/plugins/panel/xychart/XYChartTooltip';
import { Options, SeriesMapping } from 'app/plugins/panel/xychart/panelcfg.gen';
import { prepData, prepScatter } from 'app/plugins/panel/xychart/scatter';
import { SeriesMapping as MappingV2, PointShape } from 'app/plugins/panel/xychart/v2/panelcfg.gen';
import { prepConfig as prepV2 } from 'app/plugins/panel/xychart/v2/scatter';
import { prepSeries as seriesV2 } from 'app/plugins/panel/xychart/v2/utils';

import { analyticFrames, analyticTokens, analyticAxisValues, binIndex, binLabel, installAnalyticPan } from './analytic';

const theme = createTheme(),
  tokens = analyticTokens(theme),
  fieldConfig: FieldConfigSource = { defaults: {}, overrides: [] };
const legend = { showLegend: true, placement: 'bottom' as const, displayMode: LegendDisplayMode.List, calcs: [] };
const tooltip = { mode: TooltipDisplayMode.Single, sort: SortOrder.None };
function scatterFrame() {
  const frame = toDataFrame({
    fields: [
      {
        name: 'cpu',
        type: FieldType.number,
        config: { unit: 'percent', custom: {}, color: { mode: FieldColorModeId.PaletteClassic } },
        values: [0, 20, 40],
      },
      {
        name: 'memory',
        type: FieldType.number,
        config: { unit: 'bytes', custom: {}, color: { mode: FieldColorModeId.PaletteClassic } },
        values: [1024, 2048, 4096],
      },
      { name: 'host', type: FieldType.string, values: ['host-a', 'host-b', 'host-c'] },
    ],
  });
  frame.fields.forEach((field) => (field.display = getDisplayProcessor({ field, theme })));
  return frame;
}
const options: Options = {
  seriesMapping: SeriesMapping.Manual,
  series: [{ frame: 0, x: 'cpu', y: 'memory', name: '실제 관계', pointSize: { fixed: 5 } }],
  dims: { frame: 0 },
  legend,
  tooltip,
};
function histogramFrame() {
  const frame = toDataFrame({
    fields: [
      { name: 'xMin', type: FieldType.number, config: { unit: 's' }, values: [0, 10] },
      { name: 'xMax', type: FieldType.number, config: { unit: 's' }, values: [10, 20] },
      {
        name: 'frequency',
        type: FieldType.number,
        config: { color: { mode: FieldColorModeId.Fixed, fixedColor: 'red' }, custom: {} },
        values: [0, 4],
      },
    ],
  });
  frame.fields.forEach((field) => (field.display = getDisplayProcessor({ field, theme })));
  return frame;
}
it('projects colors and independent native metadata without changing query vectors or explicit colors', () => {
  const source = scatterFrame(),
    before = JSON.stringify(source);
  const projected = analyticFrames([source], fieldConfig, theme);
  expect(projected[0].fields[0].values).toBe(source.fields[0].values);
  expect(projected[0].fields[0].config.color?.fixedColor).not.toBe(projected[0].fields[1].config.color?.fixedColor);
  const info = prepScatter(options, () => projected, theme, tokens);
  expect(info.error).toBeUndefined();
  expect(prepData(info, projected)[1].slice(0, 2)).toEqual([
    [0, 20, 40],
    [1024, 2048, 4096],
  ]);
  expect(JSON.stringify(source)).toBe(before);
  const explicit = {
    defaults: {},
    overrides: [
      {
        matcher: { id: 'byName', options: 'memory' },
        properties: [{ id: 'color', value: { mode: 'fixed', fixedColor: 'red' } }],
      },
    ],
  };
  expect(analyticFrames([source], explicit, theme)[0].fields[1].config).toEqual(source.fields[1].config);
});
it('keeps native units, axis bounds, explicit point sizes and every point', () => {
  const frame = scatterFrame();
  frame.fields[0].config.min = 0;
  frame.fields[0].config.max = 100;
  const info = prepScatter(options, () => [frame], theme, tokens);
  expect(info.error).toBeUndefined();
  const data = prepData(info, [frame]);
  expect(data[1][2]).toEqual([5, 5, 5]);
  const cfg = info.builder!.getConfig();
  expect(cfg.axes?.every((a) => String(a.font).includes('Wall Inter'))).toBe(true);
  expect(cfg.cursor?.drag).toMatchObject({ x: true, y: true, setScale: true });
  expect(info.series[0].x(frame).config.max).toBe(100);
  expect(info.series[0].y(frame).config.unit).toBe('bytes');
});
it('uses the actual hovered series row and preserves extra field values in the Wall tooltip', () => {
  const frame = scatterFrame(),
    info = prepScatter(options, () => [frame], theme, tokens);
  render(
    <TimeSeriesPresentationContext.Provider value={tokens}>
      <XYChartTooltip
        data={[frame]}
        allSeries={info.series}
        options={options}
        dataIdxs={[null, 2]}
        seriesIdx={1}
        isPinned={false}
        dismiss={() => {}}
      />
    </TimeSeriesPresentationContext.Provider>
  );
  expect(screen.getByText('40%')).toBeInTheDocument();
  expect(screen.getByText('4 KiB')).toBeInTheDocument();
  expect(screen.getByText('host-c')).toBeInTheDocument();
});
it('returns no stale tooltip when the selected scatter series no longer exists', () => {
  const { container } = render(
    <XYChartTooltip
      data={[]}
      allSeries={[]}
      options={options}
      dataIdxs={[null, 2]}
      seriesIdx={2}
      isPinned={false}
      dismiss={() => {}}
    />
  );
  expect(container).toBeEmptyDOMElement();
});
it('keeps bin intervals, exact boundary ownership and formatted units without re-binning', () => {
  const frame = histogramFrame();
  expect(binIndex(frame, 0)).toBe(0);
  expect(binIndex(frame, 10)).toBe(1);
  expect(binIndex(frame, 20)).toBe(1);
  expect(binIndex(frame, 21)).toBe(-1);
  expect(binLabel(frame, 1)).toBe('10 s – 20 s');
});
it('renders frequency zero without mutating the native histogram or sharing its render vectors', () => {
  const frame = histogramFrame(),
    before = [...frame.fields[2].values];
  const histogram = new Histogram({
    options: { legend, tooltip },
    legend,
    theme,
    alignedFrame: frame,
    bucketSize: 10,
    width: 600,
    height: 300,
    appearance: tokens,
  });
  expect(frame.fields[2].values).toEqual(before);
  expect(histogram.state.xMinOnlyFrame.fields[1].values[0]).toBe(0);
  expect(histogram.state.alignedData[1][0]).toBeNull();
  expect(histogram.state.alignedData[1][1]).toBe(4);
  expect(histogram.state.config!.getConfig().axes?.every((a) => String(a.font).includes('Wall Inter'))).toBe(true);
});
it('keeps a single explicit bin linear instead of deriving a NaN logarithmic bucket factor', () => {
  const frame = histogramFrame();
  frame.fields.forEach((f) => (f.values = f.values.slice(0, 1)));
  frame.length = 1;
  expect(getBucketSize1(frame)).toBe(10);
});
it('zooms within an existing bin without collapsing its range and picks the bin under the cursor', () => {
  const frame = histogramFrame();
  const histogram = new Histogram({
    options: { legend, tooltip },
    legend,
    theme,
    alignedFrame: frame,
    bucketSize: 10,
    width: 600,
    height: 300,
    appearance: tokens,
  });
  const builder = histogram.state.config!;
  const range = builder.scales[0].props.range as Function;
  expect(range({ data: [[0, 10]] }, 12, 13)).toEqual([10, 20]);
  expect(range({ data: [[5, 15]] }, 16, 17)).toEqual([15, 25]);
  const cursor = builder.getConfig().cursor!;
  expect(cursor.drag?.dist).toBe(tokens.gestureIntent);
  expect((cursor.dataIdx as Function)({}, 1, 1, 9)).toBe(0);
  expect((cursor.dataIdx as Function)({}, 1, 0, 11)).toBe(1);
  const nativePlot = {
    series: [{}, { show: true }],
    data: [
      [0, 10],
      [0, 4],
    ],
    valToPos: (v: number) => 100 - v * 10,
  };
  expect(cursor.focus!.dist!(nativePlot as unknown as uPlot, 1, 1, 60, 80)).toBe(0);
});
it('matches tooltip minimum and maximum to the same bin, with frequency from the count field', () => {
  const frame = histogramFrame(),
    xMinOnly = { ...frame, fields: [frame.fields[0], frame.fields[2]] };
  render(
    <TimeSeriesPresentationContext.Provider value={tokens}>
      <HistogramTooltip series={frame} xMinOnlyFrame={xMinOnly} dataIdxs={[0, 1]} seriesIdx={1} isPinned={false} />
    </TimeSeriesPresentationContext.Provider>
  );
  expect(screen.getByText('10 s - 20 s')).toBeInTheDocument();
  expect(screen.getByText('4')).toBeInTheDocument();
});
it('retains the configured fill/gradient and alias bucket-max compatibility', () => {
  const frame = histogramFrame();
  frame.fields[1].name = 'BucketMax';
  frame.fields[2].config.custom = { gradientMode: GraphGradientMode.Hue, fillOpacity: 25, lineWidth: 3 };
  const histogram = new Histogram({
    options: { legend, tooltip },
    legend,
    theme,
    alignedFrame: frame,
    bucketSize: 10,
    width: 600,
    height: 300,
    appearance: tokens,
  });
  expect(histogram.state.xMinOnlyFrame.fields).toHaveLength(2);
  expect(histogram.state.config!.series[0].props).toMatchObject({
    fillOpacity: 25,
    lineWidth: 3,
    gradientMode: GraphGradientMode.Hue,
  });
});
it('pans only on Alt+drag through native scales and removes document listeners on destroy', () => {
  const builder = new UPlotConfigBuilder(),
    ready = jest.fn();
  installAnalyticPan(builder, 'xy', ready);
  const hooks = builder.getConfig().hooks!,
    over = document.createElement('div');
  document.body.append(over);
  const scales = { x: { ori: 0, min: 0, max: 10 }, y: { ori: 1, min: 0, max: 100 } };
  const plot = {
    over,
    setCursor: jest.fn(),
    scales,
    bbox: { width: 100, height: 100 },
    batch: (fn: () => void) => fn(),
    posToVal: (p: number, key: 'x' | 'y') =>
      key === 'x'
        ? scales.x.min + (p / 100) * (scales.x.max - scales.x.min)
        : scales.y.max - (p / 100) * (scales.y.max - scales.y.min),
    setScale: jest.fn((key: 'x' | 'y', range: { min: number; max: number }) => Object.assign(scales[key], range)),
  };
  hooks.ready?.forEach((fn) => fn(plot as unknown as uPlot));
  over.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 50, clientY: 50 }));
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: 60, clientY: 60 }));
  expect(plot.setScale).not.toHaveBeenCalled();
  over.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, altKey: true, clientX: 50, clientY: 50 }));
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: 60, clientY: 60, cancelable: true }));
  expect(plot.setScale).toHaveBeenCalledTimes(2);
  hooks.destroy?.forEach((fn) => fn(plot as unknown as uPlot));
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: 70, clientY: 70 }));
  expect(plot.setScale).toHaveBeenCalledTimes(2);
  expect(ready).toHaveBeenLastCalledWith(null);
  over.remove();
});

it('keeps the active XY v2 native mapping, square shape, size and opacity while projecting only display metadata', () => {
  const source = scatterFrame(),
    before = JSON.stringify(source);
  source.fields[1].config.custom = {
    show: 'points',
    pointShape: PointShape.Square,
    pointStrokeWidth: 2,
    pointSize: { fixed: 7 },
    fillOpacity: 35,
    hideFrom: { viz: false },
  };
  const config = { defaults: { custom: { hideFrom: { viz: false, legend: false, tooltip: false } } }, overrides: [] };
  const original = JSON.stringify(source);
  const frames = analyticFrames([source], config, theme);
  const mapped = [
    {
      frame: { matcher: { id: 'byIndex', options: 0 } },
      x: { matcher: { id: 'byName', options: 'cpu' } },
      y: { matcher: { id: 'byName', options: 'memory' } },
    },
  ];
  const series = seriesV2(MappingV2.Manual, mapped, frames, config, theme);
  const prep = prepV2(series, theme, tokens);
  expect(series).toHaveLength(1);
  expect(series[0]).toMatchObject({ pointShape: PointShape.Square, pointStrokeWidth: 2, fillOpacity: 35 });
  expect(prep.prepData(series)[1].slice(0, 3)).toEqual([
    [0, 20, 40],
    [1024, 2048, 4096],
    [7, 7, 7],
  ]);
  expect(prep.builder!.getConfig().axes?.every((a) => String(a.font).includes('Wall Inter'))).toBe(true);
  expect(JSON.stringify(source)).toBe(original);
  expect(before).not.toBe(original);
});

it('distinguishes close large-unit axis ticks while respecting explicit saved precision', () => {
  const field = scatterFrame().fields[1],
    splits = [51_100_000_000, 51_120_000_000, 51_140_000_000];
  const labels = (analyticAxisValues(field) as Function)({}, splits);
  expect(new Set(labels).size).toBe(3);
  field.config.decimals = 1;
  field.display = getDisplayProcessor({ field, theme });
  const explicit = (analyticAxisValues(field) as Function)({}, splits);
  expect(new Set(explicit).size).toBeLessThan(3);
  expect(field.config.decimals).toBe(1);
});

it.each([true, false])(
  'uses only the actual bin count field link, when the bin has a source-row mapping: %s',
  (allowBinLinks) => {
    const frame = histogramFrame(),
      count = frame.fields[2],
      wrong = jest.fn(),
      link = jest.fn(() => [{ title: '실제 Bin 상세', href: '/d/actual-bin?row=1', target: '_self', origin: {} }]);
    count.config.links = [{ title: '실제 Bin 상세', url: '/d/actual-bin?row=${__value.rowIndex}' }];
    count.getLinks = link;
    frame.fields[1].config.links = [{ title: '잘못된 경계 링크', url: '/wrong' }];
    frame.fields[1].getLinks = wrong;
    const xMinOnly = { ...frame, fields: [frame.fields[0], count] };
    render(
      <TimeSeriesPresentationContext.Provider value={tokens}>
        <HistogramTooltip
          series={frame}
          xMinOnlyFrame={xMinOnly}
          dataIdxs={[1, 1]}
          seriesIdx={1}
          isPinned
          allowBinLinks={allowBinLinks}
        />
      </TimeSeriesPresentationContext.Provider>
    );
    expect(wrong).not.toHaveBeenCalled();
    if (allowBinLinks) {
      expect(link).toHaveBeenCalledWith(
        expect.objectContaining({ valueRowIndex: 1, calculatedValue: expect.objectContaining({ numeric: 4 }) })
      );
      expect(screen.getByRole('link', { name: '실제 Bin 상세' })).toHaveAttribute('href', '/d/actual-bin?row=1');
    } else {
      expect(link).not.toHaveBeenCalled();
      expect(screen.queryByRole('link', { name: '실제 Bin 상세' })).not.toBeInTheDocument();
    }
  }
);
it('resolves active XY v2 tooltip colors from the same native per-point threshold palette cache', () => {
  const frame = scatterFrame();
  frame.fields.push({
    name: 'state',
    type: FieldType.number,
    values: [0, 100, 0],
    config: {
      custom: {},
      color: { mode: FieldColorModeId.Thresholds },
      thresholds: {
        mode: ThresholdsMode.Absolute,
        steps: [
          { value: -Infinity, color: 'green' },
          { value: 50, color: 'red' },
        ],
      },
    },
  });
  const frames = analyticFrames([frame], fieldConfig, theme);
  const mapped = [
    {
      frame: { matcher: { id: 'byIndex', options: 0 } },
      x: { matcher: { id: 'byName', options: 'cpu' } },
      y: { matcher: { id: 'byName', options: 'memory' } },
      color: { matcher: { id: 'byName', options: 'state' } },
    },
  ];
  const series = seriesV2(MappingV2.Manual, mapped, frames, fieldConfig, theme),
    prep = prepV2(series, theme, tokens);
  prep.prepData(series);
  expect(prep.getPointColor(0, 1)).toBe(theme.visualization.getColorByName('red').toLowerCase() + 'ff');
  expect(prep.getPointColor(0, 0)).toBe(theme.visualization.getColorByName('green').toLowerCase() + 'ff');
});
