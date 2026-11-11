import { render, screen } from '@testing-library/react';

import {
  createTheme,
  FieldConfig,
  FieldDisplay,
  FieldType,
  FieldColorModeId,
  getFieldDisplayValues,
  MappingType,
  ThresholdsMode,
  toDataFrame,
} from '@grafana/data';
import { BigValueColorMode, BigValueGraphMode, BigValueTextMode } from '@grafana/schema';
import { BigValue } from '@grafana/ui';

import { wallStatCardPresentation } from '../statPresentation';

import { fitStatValue, hasStatStateColor, hasStatTimeSeries, measureStatText, statValueMapping } from './statReadout';

const skin = wallStatCardPresentation(createTheme());

it('fits cohort text and units using the loaded Wall font rather than transforming glyphs', () => {
  const fit = (text: string, suffix = '') =>
    fitStatValue({ text, suffix, width: 100, height: 60, maximum: 36, unitMaximum: 13, weight: 700 });
  expect(fit('1234567890'.repeat(20), ' GiB')).toBeLessThan(fit('40', ' s'));
  const size = fit('1234567890'.repeat(20), ' GiB');
  expect(size).toBeLessThanOrEqual(18);
  expect(measureStatText('40', 36, 700)).toBeGreaterThan(0);
});

it('uses one native alignment cohort for short and long values and retains the full native unit', () => {
  const draw = (text: string) => (
    <BigValue
      width={128}
      height={100}
      theme={createTheme()}
      statPresentation={skin}
      value={{ text, numeric: Number(text), title: '전체', suffix: ' GiB' }}
      alignmentFactors={{ text: '1234567890', suffix: ' GiB', title: '전체' }}
      colorMode={BigValueColorMode.None}
      graphMode={BigValueGraphMode.None}
      textMode={BigValueTextMode.ValueAndName}
    />
  );
  const { container, rerender } = render(draw('1'));
  const shortSize = container.querySelector<HTMLElement>('.wall-stat-readout')!.style.fontSize;
  rerender(draw('1234567890'));
  expect(container.querySelector<HTMLElement>('.wall-stat-readout')!.style.fontSize).toBe(shortSize);
  expect(screen.getByText('1234567890')).toBeInTheDocument();
  expect(screen.getByText('GiB')).toBeInTheDocument();
  expect(container.querySelector('.wall-stat-unit')).not.toHaveStyle({ fontSize: shortSize });
});

it('keeps mapped numeric counts numeric while preserving native color, and leaves ordinary values neutral', () => {
  const { container, rerender } = render(
    <BigValue
      width={180}
      height={100}
      theme={createTheme()}
      statPresentation={skin}
      isValueMapped
      value={{ text: '0', numeric: NaN, color: '#de0f2b' }}
      colorMode={BigValueColorMode.Value}
      graphMode={BigValueGraphMode.None}
    />
  );
  expect(screen.getByText('0').closest('[data-wall-stat-kind]')).toHaveAttribute('data-wall-stat-kind', 'metric');
  expect(screen.getByText('0').closest('.wall-stat-readout')).toHaveStyle({ color: '#de0f2b' });
  expect(container.querySelector('.wall-stat-state-dot')).toBeNull();
  rerender(
    <BigValue
      width={180}
      height={100}
      theme={createTheme()}
      statPresentation={skin}
      value={{ text: '3', numeric: 3, color: 'text' }}
      colorMode={BigValueColorMode.Value}
      graphMode={BigValueGraphMode.None}
    />
  );
  expect(screen.getByText('3').closest('.wall-stat-readout')).toHaveStyle({ color: skin.foreground });
  expect(container.querySelector('.wall-stat-state-dot')).toBeNull();
});

it('requires real paired finite timestamps/numbers, without changing or filling source gaps', () => {
  const frame = toDataFrame({
    fields: [
      { name: 'Time', type: FieldType.time, values: [1000, 2000, 3000] },
      { name: 'Value', type: FieldType.number, values: [2, null, 5] },
    ],
  });
  const sparkline = { x: frame.fields[0], y: frame.fields[1] };
  const before = JSON.stringify(sparkline);
  expect(hasStatTimeSeries(sparkline)).toBe(true);
  expect(hasStatTimeSeries({ y: frame.fields[1] })).toBe(false);
  expect(hasStatTimeSeries({ x: frame.fields[0], y: { ...frame.fields[1], values: [null, 2, null] } })).toBe(false);
  expect(hasStatTimeSeries({ x: frame.fields[0], y: { ...frame.fields[1], type: FieldType.string } })).toBe(false);
  expect(JSON.stringify(sparkline)).toBe(before);
});

it('does not decorate neutral text thresholds, but retains fixed, mapped and active threshold colors', () => {
  const metric = (color: string) =>
    ({
      field: {
        thresholds: {
          mode: ThresholdsMode.Absolute,
          steps: [
            { value: -Infinity, color: 'text' },
            { value: 2, color },
          ],
        },
      },
      display: { numeric: 3, text: '3', color },
      hasLinks: false,
      name: '전체',
    }) as FieldDisplay;
  expect(hasStatStateColor(metric('text'))).toBe(false);
  expect(hasStatStateColor(metric('red'))).toBe(true);
  expect(hasStatStateColor({ ...metric('red'), display: { numeric: 1, text: '1', color: 'text' } })).toBe(false);
  expect(hasStatStateColor({ ...metric('text'), field: { color: { mode: 'fixed', fixedColor: '#16a34a' } } })).toBe(
    true
  );
});

it.each([true, false])('preserves a native string value mapping color for all-values=%s', (values) => {
  const config: FieldConfig = {
    color: { mode: FieldColorModeId.Thresholds },
    thresholds: { mode: ThresholdsMode.Absolute, steps: [{ value: -Infinity, color: 'text' }] },
    mappings: [{ type: MappingType.ValueToText, options: { DOWN: { text: '장애', color: 'red' } } }],
  };
  const frame = toDataFrame({ fields: [{ name: 'service', type: FieldType.string, values: ['UP', 'DOWN'], config }] });
  const [value] = getFieldDisplayValues({
    data: [frame],
    fieldConfig: { defaults: config, overrides: [] },
    reduceOptions: { values, fields: '/.*/', calcs: ['lastNotNull'] },
    theme: createTheme(),
    replaceVariables: (v) => v,
  }).filter((v) => v.display.text === '장애');
  expect(value.display.color).toBe(createTheme().visualization.getColorByName('red'));
  expect(hasStatStateColor(value)).toBe(true);
  expect(statValueMapping(value)?.text).toBe('장애');
});

it('centers a single Auto readout, scales with actual body size and leaves multi metrics at their existing profile', () => {
  const draw = (width: number, height: number, count = 1) => (
    <BigValue
      width={width}
      height={height}
      count={count}
      theme={createTheme()}
      statPresentation={skin}
      value={{ text: '1', numeric: 1, color: 'red' }}
      colorMode={BigValueColorMode.Value}
      graphMode={BigValueGraphMode.None}
      textMode={BigValueTextMode.Value}
    />
  );
  const { container, rerender } = render(draw(80, 90));
  expect(container.querySelector('[data-wall-stat-single]')).toHaveStyle({
    alignItems: 'center',
    flexDirection: 'column',
  });
  const small = parseFloat(container.querySelector<HTMLElement>('.wall-stat-readout')!.style.fontSize);
  rerender(draw(240, 180));
  expect(parseFloat(container.querySelector<HTMLElement>('.wall-stat-readout')!.style.fontSize)).toBeGreaterThan(small);
  rerender(draw(240, 180, 2));
  expect(container.querySelector('[data-wall-stat-single]')).toBeNull();
  expect(container.querySelector('.wall-stat-readout')).toHaveStyle({ fontSize: '36px' });
});
