import { fireEvent, render, screen } from '@testing-library/react';
import $ from 'jquery';
import tinycolor from 'tinycolor2';
import uPlot from 'uplot';

import { createTheme, dateTime, FieldColorModeId, FieldType, ThresholdsMode, toDataFrame } from '@grafana/data';
import { GraphDrawStyle, GraphGradientMode, ScaleDistribution, StackingMode } from '@grafana/schema';
import { BigValue, BigValueColorMode, BigValueGraphMode } from '@grafana/ui/src/components/BigValue/BigValue';
import { Gauge, Props as GaugeProps } from '@grafana/ui/src/components/Gauge/Gauge';
import {
  presentGraphConfig,
  presentValueColor,
  VizPresentationContext,
} from '@grafana/ui/src/components/VizPresentation/VizPresentation';
import { preparePlotConfigBuilder } from 'app/core/components/TimeSeries/utils';

import { wallVisualization } from './visualization';

jest.mock('jquery', () => ({ plot: jest.fn() }));

const theme = createTheme();
const presentation = wallVisualization(theme);

describe('Wall visualization presentation', () => {
  it('softens ordinary line fills without modifying source options or semantic encodings', () => {
    const custom = Object.freeze({
      drawStyle: GraphDrawStyle.Line,
      lineWidth: 1,
      fillOpacity: 60,
      gradientMode: GraphGradientMode.None,
      spanNulls: false,
      scaleDistribution: { type: ScaleDistribution.Log, log: 2 },
      stacking: { mode: StackingMode.None },
      hideFrom: { tooltip: false, viz: false, legend: false },
    });
    const result = presentGraphConfig(custom);
    expect(result).toMatchObject({
      ...custom,
      lineWidth: 1.8,
      fillOpacity: 10,
      gradientMode: GraphGradientMode.Opacity,
    });
    expect(custom.fillOpacity).toBe(60);
    expect(result.scaleDistribution).toBe(custom.scaleDistribution);
    expect(result.hideFrom).toBe(custom.hideFrom);
  });

  it('retains stacking, color gradients, invisible strokes and bars', () => {
    const base = { drawStyle: GraphDrawStyle.Line, lineWidth: 0, fillOpacity: 70 };
    expect(presentGraphConfig({ ...base, stacking: { mode: StackingMode.Normal } })).toMatchObject({
      lineWidth: 0,
      fillOpacity: 70,
    });
    for (const gradientMode of [GraphGradientMode.Scheme, GraphGradientMode.Hue]) {
      expect(presentGraphConfig({ ...base, gradientMode })).toMatchObject({ gradientMode, fillOpacity: 70 });
    }
    const bars = { ...base, drawStyle: GraphDrawStyle.Bars };
    expect(presentGraphConfig(bars)).toBe(bars);
  });

  it('styles the actual uPlot config while retaining scale bounds, values and original field config', () => {
    const frame = toDataFrame({
      fields: [
        { name: 'time', type: FieldType.time, values: [1000, 2000, 3000] },
        {
          name: 'CPU',
          type: FieldType.number,
          values: [23, null, 81],
          config: {
            min: 0,
            max: 100,
            unit: 'percent',
            color: { mode: FieldColorModeId.Fixed, fixedColor: 'blue' },
            custom: { drawStyle: GraphDrawStyle.Line, lineWidth: 1, fillOpacity: 50, spanNulls: false },
          },
        },
      ],
    });
    const snapshot = JSON.stringify(frame);
    const opts = {
      frame,
      allFrames: [frame],
      theme,
      timeZones: ['utc'],
      getTimeRange: () => ({ from: dateTime(1000), to: dateTime(3000), raw: { from: 'now-6h', to: 'now' } }),
    };
    const original = preparePlotConfigBuilder(opts).getConfig();
    const modern = preparePlotConfigBuilder({ ...opts, presentation }).getConfig();
    expect(modern.series[1].width).toBe(1.8);
    expect(modern.axes![0]).toMatchObject({ font: `11px ${theme.typography.fontFamily}`, stroke: presentation.muted });
    expect(modern.axes![0].grid!.stroke).toBe(presentation.grid);
    expect(modern.series[1].stroke).toEqual(original.series[1].stroke);
    expect(Object.keys(modern.scales!)).toEqual(Object.keys(original.scales!));
    for (const key of Object.keys(modern.scales!)) {
      const { range: modernRange, ...modernScale } = modern.scales![key];
      const { range: nativeRange, ...nativeScale } = original.scales![key];
      expect(modernScale).toEqual(nativeScale);
      const plot = { scales: modern.scales } as unknown as uPlot;
      expect((modernRange as uPlot.Range.Function)(plot, 23, 81, key)).toEqual(
        (nativeRange as uPlot.Range.Function)(plot, 23, 81, key)
      );
    }
    expect(JSON.stringify(frame)).toBe(snapshot);
  });

  it('keeps native Gauge numeric/threshold/link behavior and changes only its presentation', () => {
    const onClick = jest.fn();
    const props: GaugeProps = {
      width: 200,
      height: 140,
      theme,
      showThresholdMarkers: true,
      showThresholdLabels: true,
      value: { text: '81', numeric: 81, color: 'red', suffix: '%' },
      field: {
        min: 0,
        max: 100,
        thresholds: {
          mode: ThresholdsMode.Absolute,
          steps: [
            { value: -Infinity, color: 'green' },
            { value: 80, color: 'red' },
          ],
        },
      },
      onClick,
    };
    const plot = jest.mocked($.plot);
    const { rerender } = render(<Gauge {...props} />);
    const native = plot.mock.calls.at(-1)!;
    rerender(
      <VizPresentationContext.Provider value={presentation}>
        <Gauge {...props} />
      </VizPresentationContext.Provider>
    );
    const modern = plot.mock.calls.at(-1)!;
    expect(modern[1]).toEqual(native[1]);
    const before = native[2]!.series!.gauges!;
    const after = modern[2]!.series!.gauges!;
    expect(after.gauge.min).toBe(before.gauge.min);
    expect(after.gauge.max).toBe(before.gauge.max);
    expect(after.threshold.values).toEqual(before.threshold.values);
    expect(after.threshold.show).toBe(true);
    expect(after.threshold.label.show).toBe(true);
    expect(after.value.color).toBe(presentValueColor('red', presentation));
    expect(props.value.color).toBe('red');
    expect(after.value.formatter()).toBe('81%');
    expect(after.gauge.width).toBeLessThan(before.gauge.width);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps Stat mapped text, units, colors and links, including explicit font sizing', () => {
    const onClick = jest.fn();
    render(
      <VizPresentationContext.Provider value={presentation}>
        <BigValue
          width={300}
          height={150}
          theme={theme}
          value={{ text: '위험', numeric: 81, color: 'red', suffix: '%' }}
          colorMode={BigValueColorMode.Value}
          graphMode={BigValueGraphMode.None}
          text={{ valueSize: 52 }}
          onClick={onClick}
        />
      </VizPresentationContext.Provider>
    );
    expect(screen.getByText('위험').parentElement!.parentElement).toHaveStyle({
      color: presentValueColor('red', presentation),
      fontSize: 52,
      fontWeight: 600,
    });
    expect(screen.getByText('%')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps neutral values readable on dark surfaces and preserves semantic color hue', () => {
    const dark = wallVisualization(createTheme({ colors: { mode: 'dark' } }));
    expect(presentValueColor('#1f1f20', dark)).toBe(dark.text);
    for (const original of ['#c41631', '#299c46', '#f28b30']) {
      const adjusted = presentValueColor(original, dark)!;
      expect(tinycolor.readability(adjusted, dark.surface)).toBeGreaterThanOrEqual(4.5);
      expect(tinycolor(adjusted).toHsl().h).toBeCloseTo(tinycolor(original).toHsl().h, 0);
    }
  });
});
