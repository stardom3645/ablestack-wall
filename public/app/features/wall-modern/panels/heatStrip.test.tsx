import { render, screen } from '@testing-library/react';

import {
  FieldColorModeId,
  ThresholdsMode,
  MappingType,
  createTheme,
  DataFrameView,
  dateTime,
  FieldDisplay,
  FieldType,
  getDisplayProcessor,
  ThemeContext,
  toDataFrame,
} from '@grafana/data';

import { WallHeatStrip } from './WallHeatStrip';
import { heatBuckets, segmentedFraction } from './heatStripModel';
import { meterAppearance } from './meterPresentation';

const theme = createTheme({ colors: { mode: 'light' } });
function item(times: number[], values: Array<number | null>): FieldDisplay {
  const frame = toDataFrame({
    fields: [
      { name: 'Time', type: FieldType.time, values: times },
      { name: 'cpu', type: FieldType.number, values, config: { unit: 'percent', min: 0, max: 100 } },
    ],
  });
  frame.fields[1].display = getDisplayProcessor({ field: frame.fields[1], theme });
  return {
    name: 'mean',
    field: frame.fields[1].config,
    display: { text: '42.0', numeric: 42, suffix: '%', title: 'host-01' },
    view: new DataFrameView(frame),
    colIndex: 1,
    hasLinks: false,
  };
}
it('buckets only real timestamps, includes the range end, never holds values across empty intervals', () => {
  const source = item([100, 0, 75, 25, 200], [90, 0, 80, null, 999]);
  const before = JSON.stringify(source);
  expect(heatBuckets(source, 0, 100, 4, 'last').buckets?.map((b) => [b.state, b.value, b.samples])).toEqual([
    ['value', 0, 1],
    ['null', null, 1],
    ['empty', null, 0],
    ['value', 90, 2],
  ]);
  expect(JSON.stringify(source)).toBe(before);
});
it.each([
  ['last', null],
  ['mean', 20],
  ['max', 30],
  ['min', 10],
] as const)('uses the explicit %s aggregation and counts nulls', (agg, expected) => {
  const result = heatBuckets(item([0, 25, 50, 75], [10, 30, 20, null]), 0, 100, 1, agg).buckets![0];
  expect(result.value).toBe(expected);
  expect(result.valid).toBe(3);
  expect(result.samples).toBe(4);
});
it('rejects instant, out-of-range, missing-time and all-values data instead of synthesizing time', () => {
  expect(heatBuckets(item([50], [10]), 0, 100, 10, 'last').reason).toBeTruthy();
  expect(heatBuckets(item([0, 25], [1, 2]), 30, 100, 10, 'last').reason).toBeTruthy();
  expect(heatBuckets({ ...item([0, 25], [1, 2]), rowIndex: 0 }, 0, 100, 10, 'last').reason).toBeTruthy();
  const noTime = item([0, 25], [1, 2]);
  noTime.view!.dataFrame.fields[0].type = FieldType.number;
  expect(heatBuckets(noTime, 0, 100, 10, 'last').reason).toBeTruthy();
});
it('does not silently turn NaN/Infinity or aggregate overflow into zero', () => {
  expect(heatBuckets(item([0, 25], [NaN, Infinity]), 0, 100, 1, 'mean').buckets![0].state).toBe('invalid');
});
it.each([0, 0.001, 0.13, 0.5, 0.99, 1])(
  'keeps %s fill exact across different segment counts including zero',
  (ratio) => {
    for (const count of [1, 7, 16, 24]) {
      const fractions = Array.from({ length: count }, (_, i) => segmentedFraction(ratio, i, count));
      expect(fractions.reduce((a, b) => a + b, 0) / count).toBeCloseTo(ratio, 12);
    }
  }
);
it('renders real cell data, distinct no-data cells, and the native reducer value without recalculating it', () => {
  const source = item([0, 25, 75, 100], [0, null, 80, 90]);
  const { container, rerender } = render(
    <ThemeContext.Provider value={theme}>
      <WallHeatStrip
        values={[source]}
        range={{ from: dateTime(0), to: dateTime(100), raw: { from: '0', to: '100' } }}
        timeZone="utc"
        width={100}
        height={220}
        options={{ wallMeterUseThresholds: false }}
        config={{ defaults: {}, overrides: [] }}
        frames={[source.view!.dataFrame]}
        hideNames={false}
        hideValues={false}
      />
    </ThemeContext.Provider>
  );
  expect(container.querySelectorAll('[data-wall-heat-cell=value]').length).toBeGreaterThan(0);
  expect(screen.getByText('42.0')).toBeInTheDocument();
  expect(screen.getByText('빈 셀 ≠ 0')).toBeInTheDocument();
  expect(screen.getAllByRole('button').some((b) => b.getAttribute('aria-label')?.includes('0%'))).toBe(true);
  rerender(
    <ThemeContext.Provider value={theme}>
      <WallHeatStrip
        values={[item([0], [13])]}
        range={{ from: dateTime(0), to: dateTime(100), raw: { from: '0', to: '100' } }}
        timeZone="utc"
        width={100}
        height={220}
        options={{}}
        config={{ defaults: {}, overrides: [] }}
        frames={[]}
        hideNames={false}
        hideValues={false}
      />
    </ThemeContext.Provider>
  );
  expect(container.querySelectorAll('[data-wall-heat-cell]')).toHaveLength(0);
  expect(screen.getByRole('status')).toHaveTextContent('2개 이상');
});
it('uses palette only after explicitly disabling thresholds, and still protects fixed colors', () => {
  const source = item([0, 1], [10, 20]);
  source.field.color = { mode: FieldColorModeId.Thresholds };
  source.field.thresholds = {
    mode: ThresholdsMode.Absolute,
    steps: [
      { color: 'green', value: -Infinity },
      { color: 'red', value: 75 },
    ],
  };
  expect(meterAppearance(source, { defaults: source.field, overrides: [] }, [], {}).colorSource).toBe('configured');
  expect(
    meterAppearance(source, { defaults: source.field, overrides: [] }, [], { wallMeterUseThresholds: false })
      .colorSource
  ).toBe('default');
  source.field.color = { mode: FieldColorModeId.Fixed, fixedColor: '#123456' };
  expect(
    meterAppearance(source, { defaults: source.field, overrides: [] }, [], { wallMeterUseThresholds: false })
      .colorSource
  ).toBe('configured');
});

it('preserves a bucket-specific mapping color even when the reducer result has no active mapping', () => {
  const source = item([0, 100], [20, 90]);
  source.field.mappings = [{ type: MappingType.ValueToText, options: { '90': { text: 'High', color: '#e02f44' } } }];
  const { container } = render(
    <ThemeContext.Provider value={theme}>
      <WallHeatStrip
        values={[source]}
        range={{ from: dateTime(0), to: dateTime(100), raw: { from: '0', to: '100' } }}
        timeZone="utc"
        width={64}
        height={180}
        options={{ wallMeterUseThresholds: false }}
        config={{ defaults: source.field, overrides: [] }}
        frames={[source.view!.dataFrame]}
        hideNames={false}
        hideValues={false}
      />
    </ThemeContext.Provider>
  );
  expect(container.querySelectorAll('[data-wall-heat-cell=value]')[1]).toHaveStyle({ background: '#e02f44' });
  expect(screen.getByText('42.0')).toBeInTheDocument();
});
