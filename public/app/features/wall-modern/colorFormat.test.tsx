import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import {
  createTheme,
  FieldColorModeId,
  FieldConfigSource,
  FieldType,
  formattedValueToString,
  getDisplayProcessor,
  MappingType,
  toDataFrame,
  ThemeContext,
} from '@grafana/data';
import { GraphGradientMode, LegendDisplayMode } from '@grafana/schema';
import { ColorPickerPopover } from '@grafana/ui/src/components/ColorPicker/ColorPickerPopover';
import { TimeSeriesPresentationContext } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { BarChartLegend } from 'app/plugins/panel/barchart/BarChartLegend';

import { WallColorFormatProvider } from './WallColorFormatProvider';
import { wallTimeSeriesTokens } from './chartTokens';
import { presentBarFrames, wallCategoricalTokens } from './charts/categorical';
import {
  canUseWallSeriesPalette,
  hasWallColorOverride,
  wallColorPalettes,
  wallSeriesPalette,
  wallTimeSeriesPalette,
} from './colorSystem';
import { wallDisplayText, wallFieldText, wallPercentText } from './formatSystem';
import { formatMeterBound } from './panels/meterPresentation';
import { wallMeterTokens } from './panels/meterTokens';
import { presentTimeSeriesFrames } from './timeSeriesPresentation';

const theme = createTheme({ colors: { mode: 'light' } });
const config: FieldConfigSource = { defaults: {}, overrides: [] };
function source() {
  return toDataFrame({
    fields: [
      {
        name: 'CPU',
        type: FieldType.number,
        values: [12, 24],
        config: { unit: 'percent', color: { mode: FieldColorModeId.PaletteClassic } },
      },
    ],
  });
}

it.each(['light', 'dark'] as const)(
  'shares %s accent colors with chart and meter palettes, without mutating models',
  (mode) => {
    const current = createTheme({ colors: { mode } });
    const frame = source();
    const before = JSON.stringify(frame);
    const a = presentBarFrames([frame], config, current)[0].fields[0];
    const b = presentTimeSeriesFrames([frame], config, current, wallTimeSeriesTokens(current))[0].fields[0];
    expect(a.config.color).toEqual(b.config.color);
    expect(a.config.color?.fixedColor).toBe(wallColorPalettes.cobalt[mode][0]);
    expect(wallMeterTokens.palettes).toBe(wallColorPalettes);
    expect(wallTimeSeriesTokens(current).palette).toEqual(wallTimeSeriesPalette(current));
    expect(wallTimeSeriesTokens(current).palette.slice(0, wallSeriesPalette(current).length)).toEqual(
      wallSeriesPalette(current)
    );
    expect(JSON.stringify(frame)).toBe(before);
  }
);

it.each([FieldColorModeId.Fixed, FieldColorModeId.Thresholds, 'continuous-BlPu', FieldColorModeId.Shades])(
  'protects native semantic or explicit color mode %s',
  (mode) => {
    const frame = source();
    frame.fields[0].config.color = { mode, fixedColor: 'green' };
    expect(canUseWallSeriesPalette(frame.fields[0])).toBe(false);
    expect(presentBarFrames([frame], config, theme)[0].fields[0]).toBe(frame.fields[0]);
  }
);

it('preserves matching overrides, colored mappings, custom paint and density encodings', () => {
  const frame = source(),
    field = frame.fields[0];
  const override: FieldConfigSource = {
    defaults: {},
    overrides: [
      {
        matcher: { id: 'byName', options: 'CPU' },
        properties: [{ id: 'color', value: { mode: FieldColorModeId.PaletteClassic } }],
      },
    ],
  };
  expect(hasWallColorOverride(override, field, frame)).toBe(true);
  expect(canUseWallSeriesPalette(field, true)).toBe(false);
  field.config.mappings = [{ type: MappingType.ValueToText, options: { '24': { text: '정상', color: 'green' } } }];
  expect(canUseWallSeriesPalette(field)).toBe(false);
  field.config.mappings = [];
  for (const gradientMode of [GraphGradientMode.Scheme, GraphGradientMode.Hue]) {
    field.config.custom = { gradientMode };
    expect(canUseWallSeriesPalette(field)).toBe(false);
  }
  field.config.custom = { lineColor: '#123456' };
  expect(canUseWallSeriesPalette(field)).toBe(false);
});

it.each([
  ['percent', 25],
  ['percentunit', 0.25],
  ['ms', 1500],
  ['µs', 1500],
  ['s', 1.5],
  ['bytes', 512],
  ['bytes', 1024],
  ['bytes', 1024 ** 2],
  ['bytes', 1024 ** 3],
  ['bytes', 1024 ** 4],
  ['bps', 1000],
  ['Bps', 1000],
  ['binBps', 1024],
  ['iops', 1200],
  ['suffix: IOPS', 1200],
  ['none', 12.3456],
] as Array<[string, number]>)(
  'keeps the native %s formatter, precision, scale and original value %s',
  (unit, value) => {
    const field = toDataFrame({
      fields: [{ name: 'value', type: FieldType.number, values: [value], config: { unit, decimals: 2 } }],
    }).fields[0];
    field.display = getDisplayProcessor({ field, theme });
    const expected = formattedValueToString(field.display(value));
    expect(wallFieldText(field, value)).toBe(expected);
    expect(wallDisplayText(field.display(value))).toBe(expected);
    expect(formatMeterBound(value, field.config, theme)).toBe(expected);
    expect(field.values).toEqual([value]);
    expect(field.config).toEqual({ unit, decimals: 2 });
  }
);

it('preserves value-mapped text, explicit trailing decimals and nonzero tiny composition ratios', () => {
  const field = source().fields[0];
  field.config.mappings = [{ type: MappingType.ValueToText, options: { '24': { text: '정상', color: 'green' } } }];
  field.display = getDisplayProcessor({ field, theme });
  expect(wallFieldText(field, 24)).toBe('정상');
  expect(formatMeterBound(12, { unit: 'percent', decimals: 2 }, theme)).toBe('12.00%');
  expect(wallPercentText(25, 2)).toBe('25.00%');
  expect(wallPercentText(0.0001)).toBe('<0.1%');
  expect(wallPercentText(NaN)).toBe('—');
});

it('uses one native picker adapter for Wall presets, legacy colors, custom spectrum and plugin tabs', () => {
  const change = jest.fn();
  render(
    <ThemeContext.Provider value={theme}>
      <WallColorFormatProvider>
        <ColorPickerPopover
          color="red"
          onChange={change}
          customPickers={{
            yaxis: { name: 'Y-Axis', tabComponent: () => <button type="button">native axis action</button> },
          }}
        />
      </WallColorFormatProvider>
    </ThemeContext.Provider>
  );
  expect(screen.getByRole('tab', { name: 'Wall 팔레트' })).toHaveAttribute('aria-selected', 'true');
  fireEvent.click(screen.getByRole('button', { name: `Cobalt / Sky ${wallColorPalettes.cobalt.light[0]}` }));
  expect(change).toHaveBeenLastCalledWith(wallColorPalettes.cobalt.light[0]);
  fireEvent.click(screen.getByRole('tab', { name: '기본 색상' }));
  expect(screen.getByRole('button', { name: 'green color' })).toBeInTheDocument();
  change.mockClear();
  fireEvent.click(screen.getByRole('tab', { name: '사용자 지정' }));
  expect(screen.getByRole('tab', { name: '사용자 지정' })).toHaveAttribute('aria-selected', 'true');
  expect(change).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('tab', { name: 'Y-Axis' }));
  expect(screen.getByRole('button', { name: 'native axis action' })).toBeInTheDocument();
});

it('keeps native enableNamedColors=false conversion for threshold and mapping callbacks', () => {
  const change = jest.fn();
  render(
    <ThemeContext.Provider value={theme}>
      <WallColorFormatProvider>
        <ColorPickerPopover color="red" onChange={change} enableNamedColors={false} />
      </WallColorFormatProvider>
    </ThemeContext.Provider>
  );
  fireEvent.click(screen.getByRole('button', { name: '상태색 green' }));
  expect(change).toHaveBeenCalledWith(theme.visualization.getColorByName('green'));
});

it('uses the shared legend rows in Bar without adding unsupported time-series menu actions', () => {
  const frame = toDataFrame({
    fields: [
      { name: 'host', type: FieldType.string, values: ['a'] },
      { name: 'memory', type: FieldType.number, config: { unit: 'bytes' }, values: [1024] },
    ],
  });
  frame.fields.forEach((field) => {
    field.display = getDisplayProcessor({ field, theme });
  });
  const view = render(
    <TimeSeriesPresentationContext.Provider value={wallCategoricalTokens(theme)}>
      <BarChartLegend
        data={[frame]}
        placement="bottom"
        calcs={['lastNotNull']}
        showLegend
        displayMode={LegendDisplayMode.List}
      />
    </TimeSeriesPresentationContext.Provider>
  );
  expect(view.container.querySelectorAll('[data-wall-series-legend]')).toHaveLength(1);
  expect(screen.getByText(/KiB/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /시리즈 작업/ })).not.toBeInTheDocument();
});
