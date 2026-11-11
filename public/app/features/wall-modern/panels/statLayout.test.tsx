import { createTheme, FieldDisplay, FieldType, getFieldDisplayValues, MappingType, toDataFrame } from '@grafana/data';

import { statGridDimensions } from './statLayout';

jest.mock('./statReadout', () => ({
  ...jest.requireActual('./statReadout'),
  // Deterministic loaded-font metrics; JSDOM's canvas reports zero glyph widths.
  measureStatText: (text: string, size: number) =>
    Array.from(text).reduce((w, c) => w + (c.charCodeAt(0) > 255 ? 1 : 0.56) * size, 0),
}));

const field = (title: string, text = '9', suffix = '') =>
  ({
    field: {},
    name: 'lastNotNull',
    hasLinks: false,
    display: { title, text, suffix, numeric: Number(text) },
  }) as FieldDisplay;
const options = { textMode: 'auto', graphMode: 'none', colorMode: 'value' };

it('measures native labels and formatted units instead of assigning every Stat 120px', () => {
  const short = ['UP', 'DOWN', 'IN', 'OUT'].map((name) => field(name));
  const before = JSON.stringify(short);
  expect(statGridDimensions(short, 435, 224, 8, options)?.xCount).toBe(4);
  expect(statGridDimensions(short, 435, 1000, 8, options)?.xCount).toBe(4);
  const long = short.map((v) => ({ ...v, display: { ...v.display, text: '123456.78', suffix: ' GiB' } }));
  expect(statGridDimensions(long, 435, 224, 8, options)!.xCount).toBeLessThan(4);
  expect(JSON.stringify(short)).toBe(before);
});

it('pairs long series names with readable values and keeps every native field in a scrollable list', () => {
  const values = Array.from({ length: 8 }, (_, i) =>
    field(`QA series-${i} · 긴 운영 환경 시리즈 이름 / Scroll Fixture`, '17.32', '%')
  );
  const grid = statGridDimensions(values, 435, 224, 8, options)!;
  expect(grid.layout).toBe('inline');
  expect(grid.xCount * grid.yCount).toBeGreaterThanOrEqual(8);
  expect(grid.height).toBeGreaterThanOrEqual(26);
  expect(grid.yCount * grid.height + (grid.yCount - 1) * grid.spacing!).toBeLessThanOrEqual(224);
  expect(statGridDimensions(values, 900, 224, 8, options)!.xCount).toBeGreaterThan(grid.xCount);
  expect(statGridDimensions(values, 150, 224, 8, options)?.layout).toBeUndefined();
});

it('keeps explicit backgrounds as colored tiles and preserves native Sparkline/percent-change layout', () => {
  const values = [field('매우 긴 서비스 이름을 가진 운영 환경 항목', '24')];
  expect(
    statGridDimensions(values, 400, 180, 8, { ...options, colorMode: 'background_solid' })?.layout
  ).toBeUndefined();
  expect(statGridDimensions(values, 400, 180, 8, { ...options, graphMode: 'area' })).toBeUndefined();
  expect(statGridDimensions(values, 400, 180, 8, { ...options, showPercentChange: true })).toBeUndefined();
  expect(statGridDimensions(values, 400, 180, 8, { ...options, textMode: 'none' })).toBeUndefined();
  const four = ['UP', 'DOWN', 'IN', 'OUT'].map((name) => field(name));
  expect(statGridDimensions(four, 435, 224, 8, { ...options, colorMode: 'background_solid' })?.xCount).toBe(2);
  expect(statGridDimensions(four, 900, 224, 8, { ...options, colorMode: 'background_solid' })?.xCount).toBe(4);
  for (const wallStatStyle of ['soft', 'minimal'] as const) {
    expect(
      statGridDimensions(four, 435, 224, 8, { ...options, colorMode: 'background_solid', wallStatStyle })?.xCount
    ).toBe(4);
    expect(statGridDimensions(four, 180, 160, 8, { ...options, wallStatStyle })?.xCount).toBe(2);
  }
});

it('measures numeric-source text mappings with the same text hierarchy as string-source mappings', () => {
  const config = { mappings: [{ type: MappingType.ValueToText, options: { '1': { text: 'OK', color: 'green' } } }] };
  const values = getFieldDisplayValues({
    data: [toDataFrame({ fields: [{ name: '서비스', type: FieldType.number, values: [1], config }] })],
    fieldConfig: { defaults: config, overrides: [] },
    reduceOptions: { values: false, calcs: ['lastNotNull'] },
    replaceVariables: (v) => v,
    theme: createTheme(),
  });
  expect(values[0].display.numeric).toBe(1);
  expect(values[0].display.text).toBe('OK');
  expect(statGridDimensions(values, 435, 1, 8, { ...options, textMode: 'value_and_name' })?.height).toBe(1);
});
