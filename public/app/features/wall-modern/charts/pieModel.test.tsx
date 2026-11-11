import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import {
  createTheme,
  EventBusSrv,
  FieldColorModeId,
  FieldConfigSource,
  FieldDisplay,
  FieldType,
  getDisplayProcessor,
  getFieldDisplayValues,
  toDataFrame,
  MappingType,
  VizOrientation,
} from '@grafana/data';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode } from '@grafana/schema';
import { PanelContextProvider } from '@grafana/ui';
import { PieChartLabels, PieChartLegendValues, PieChartType } from 'app/plugins/panel/piechart/panelcfg.gen';

import { WallPieActions } from './WallPieActions';
import { WallPieChart } from './WallPieChart';
import { formatPiePercent, layoutPieLabels, pieComposition, pieEntries, piePercent, wallPieTheme } from './pieModel';

jest.mock('react-use', () => ({
  ...jest.requireActual('react-use'),
  useMeasure: () => [() => {}, { width: 190, height: 90 }],
}));
Object.defineProperty(window, 'DOMRect', {
  configurable: true,
  value: class {
    static fromRect({ x = 0, y = 0, width = 0, height = 0 } = {}) {
      return {
        x,
        y,
        width,
        height,
        left: x,
        top: y,
        right: x + width,
        bottom: y + height,
        toJSON: () => ({ x, y, width, height }),
      };
    }
  },
});
const theme = createTheme();
const config: FieldConfigSource = { defaults: {}, overrides: [] };
function values(numbers = [60, 30, 10], unit = 'bytes'): FieldDisplay[] {
  return numbers.map((numeric, index) => {
    const field = {
      name: `host-${index}`,
      type: FieldType.number,
      config: { unit, color: { mode: FieldColorModeId.PaletteClassic } },
      values: [numeric],
    };
    const display = getDisplayProcessor({ field, theme })(numeric);
    return {
      name: 'lastNotNull',
      field: field.config,
      display: { ...display, color: '#123456', title: field.name },
      hasLinks: false,
    };
  });
}
it('preserves native values, formatting, links and order while projecting only automatic palette colors', () => {
  const source = values();
  source[0].getLinks = jest.fn();
  const copy = JSON.stringify(source);
  const entries = pieEntries(source, config, theme);
  expect(entries[0].value.display.color).toBe(wallPieTheme(theme).palette[0]);
  expect(entries.map((entry) => entry.value.display.numeric)).toEqual([60, 30, 10]);
  expect(entries[0].value.getLinks).toBe(source[0].getLinks);
  expect(JSON.stringify(source)).toBe(copy);
});
it('retains fixed, threshold, row override and value mapping colors', () => {
  const source = values([1, 2, 3, 4]);
  source[0].field.color = { mode: FieldColorModeId.Fixed, fixedColor: 'red' };
  source[1].field.color = { mode: FieldColorModeId.Thresholds };
  source[2].field.mappings = [{ type: MappingType.ValueToText, options: { '3': { color: 'red', text: 'mapped' } } }];
  const override = {
    defaults: {},
    overrides: [
      {
        matcher: { id: 'byName', options: 'host-3' },
        properties: [{ id: 'color', value: { mode: 'fixed', fixedColor: 'red' } }],
      },
    ],
  };
  expect(pieEntries(source, override, theme).every((entry) => entry.value.display.color === '#123456')).toBe(true);
});
it('computes percentages from all visible values and never groups tiny categories', () => {
  const entries = pieEntries(values([99, 0.01, 0.01, 0.98]), config, theme);
  const state = pieComposition(entries, theme);
  expect(state.visible).toHaveLength(4);
  expect(piePercent(entries[1], state)).toBeCloseTo(0.01);
  expect(formatPiePercent(0.01, 0)).toBe('<1%');
  expect(entries.map((entry) => piePercent(entry, state)).reduce((a, b) => a! + b!, 0)).toBeCloseTo(100);
});
it('honors hidden fields without losing original entries and never fabricates a percentage for zero', () => {
  const source = values([0, 10]);
  source[1].field.custom = { hideFrom: { viz: true } };
  const entries = pieEntries(source, config, theme),
    state = pieComposition(entries, theme);
  expect(state.total).toBe(0);
  expect(state.visible).toHaveLength(1);
  expect(entries).toHaveLength(2);
  expect(piePercent(entries[0], state)).toBeUndefined();
  expect(formatPiePercent(undefined)).toBe('—');
});
it.each([
  [-1, 2],
  [Infinity, 1],
  [NaN, 1],
  [Number.MAX_VALUE, Number.MAX_VALUE],
])('reports invalid composition without clamping or dropping source values %j', (...numbers) => {
  const entries = pieEntries(values(numbers), config, theme),
    state = pieComposition(entries, theme);
  expect(state.invalid).toBe(true);
  expect(state.totalDisplay).toBeUndefined();
  expect(piePercent(entries[0], state)).toBeUndefined();
  expect(entries.map((entry) => entry.value.display.numeric)).toEqual(numbers);
});
it('formats homogeneous capacity totals but never adds utilization percentages or incompatible units', () => {
  const capacity = pieComposition(pieEntries(values([1024, 1024]), config, theme), theme);
  expect(capacity.totalDisplay?.numeric).toBe(2048);
  expect(capacity.totalDisplay?.suffix).toContain('KiB');
  expect(pieComposition(pieEntries(values([24, 68], 'percent'), config, theme), theme).totalDisplay).toBeUndefined();
  const mixed = values();
  mixed[0].field.unit = 's';
  expect(pieComposition(pieEntries(mixed, config, theme), theme).sameUnit).toBe(false);
  expect(pieComposition(pieEntries(mixed, config, theme), theme).totalDisplay).toBeUndefined();
});
it('suppresses only labels when space is insufficient, keeping every tiny and long-named entry', () => {
  const entries = pieEntries(values(Array(100).fill(1)), config, theme),
    state = pieComposition(entries, theme);
  const arcs = entries.map((data, i) => ({
    data,
    startAngle: (i / 100) * Math.PI * 2,
    endAngle: ((i + 1) / 100) * Math.PI * 2,
  }));
  expect(layoutPieLabels(arcs, 60, 40, [PieChartLabels.Name, PieChartLabels.Percent], state)).toEqual([]);
  expect(state.visible).toHaveLength(100);
});
it('opens only genuine data links and reuses the native panel data inspector', async () => {
  const entries = pieEntries(values(), config, theme),
    inspect = jest.fn(),
    click = jest.fn();
  entries[0].value.hasLinks = true;
  entries[0].value.getLinks = () => [
    { title: '실제 상세', href: '/d/actual', target: '_self', origin: {}, onClick: click },
  ];
  render(
    <PanelContextProvider
      value={{ eventsScope: 'pie-test', eventBus: new EventBusSrv(), onInspectSeriesData: inspect }}
    >
      <WallPieActions
        entries={entries}
        composition={pieComposition(entries, theme)}
        target={{ id: entries[0].id, x: 20, y: 20 }}
        open
        onOpenChange={() => {}}
        onClosed={() => {}}
        select={() => {}}
        returnFocus={createRef()}
      />
    </PanelContextProvider>
  );
  expect(await screen.findByRole('menuitem', { name: '실제 상세' })).toHaveAttribute('href', '/d/actual');
  await userEvent.click(screen.getByRole('menuitem', { name: '패널 데이터 확인' }));
  expect(inspect).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('menuitem', { name: '색상 변경' })).not.toBeInTheDocument();
});
it('renders all native slices and configured legend columns, selecting emphasis without mutating inputs', () => {
  const source = values(),
    before = JSON.stringify(source);
  const view = render(
    <PanelContextProvider value={{ eventsScope: 'pie-test', eventBus: new EventBusSrv() }}>
      <WallPieChart
        width={700}
        height={300}
        values={source}
        fieldConfig={config}
        options={{
          orientation: VizOrientation.Auto,
          pieType: PieChartType.Donut,
          displayLabels: [PieChartLabels.Name],
          reduceOptions: { values: false, calcs: ['lastNotNull'] },
          tooltip: { mode: TooltipDisplayMode.Single, sort: SortOrder.None },
          legend: {
            placement: 'right',
            displayMode: LegendDisplayMode.Table,
            showLegend: true,
            calcs: [],
            values: [PieChartLegendValues.Value, PieChartLegendValues.Percent],
          },
        }}
      />
    </PanelContextProvider>
  );
  expect(view.container.querySelectorAll('.wall-pie-slice')).toHaveLength(3);
  expect(screen.getByText('표시 합계')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^host-0$/ }));
  expect(screen.getByRole('button', { name: /^host-0$/ })).toHaveAttribute('aria-pressed', 'true');
  expect(view.container.querySelectorAll('[data-dimmed]')).toHaveLength(2);
  expect(JSON.stringify(source)).toBe(before);
});

it('preserves native row display names, limits, units and link closures for all-values data', () => {
  const frame = toDataFrame({
    fields: [
      { name: 'device', type: FieldType.string, values: ['glue-a', 'glue-b', 'glue-c'] },
      {
        name: 'capacity',
        type: FieldType.number,
        config: { unit: 'bytes', color: { mode: FieldColorModeId.PaletteClassic } },
        values: [1024, 2048, 4096],
      },
    ],
  });
  const displays = getFieldDisplayValues({
    data: [frame],
    fieldConfig: config,
    reduceOptions: { values: true, calcs: [], limit: 2 },
    theme,
    replaceVariables: (s) => s,
  });
  const entries = pieEntries(displays, config, theme);
  expect(entries).toHaveLength(2);
  expect(entries.map((entry) => entry.value.rowIndex)).toEqual([0, 1]);
  expect(entries.map((entry) => entry.value.display.numeric)).toEqual([1024, 2048]);
  expect(entries[0].value.display.title).toContain('glue-a');
  expect(entries[0].value.display.suffix).toContain('KiB');
  expect(frame.fields[1].values).toEqual([1024, 2048, 4096]);
});
