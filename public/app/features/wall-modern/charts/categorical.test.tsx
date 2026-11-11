import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import uPlot from 'uplot';

import {
  createTheme,
  FieldColorModeId,
  FieldType,
  getDisplayProcessor,
  toDataFrame,
  VizOrientation,
} from '@grafana/data';
import { StackingMode, TooltipDisplayMode, VisibilityMode } from '@grafana/schema';
import { PanelContextProvider } from '@grafana/ui';
import { getConfig } from 'app/plugins/panel/barchart/bars';
import { defaultOptions, Options } from 'app/plugins/panel/barchart/panelcfg.gen';
import { prepConfig, prepSeries } from 'app/plugins/panel/barchart/utils';

import { BarSelection, WallBarControls } from './WallBarControls';
import {
  categoryIndices,
  initialCategoryOrder,
  measureBarText,
  presentBarFrames,
  projectCategories,
  projectCategoryField,
  truncateCategory,
  wallCategoricalTokens,
} from './categorical';

// jsdom lacks DOMRect; the real browser supplies Base UI's pointer anchor factory.
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
function frame() {
  const data = toDataFrame({
    fields: [
      { name: 'host', type: FieldType.string, values: ['가상머신-긴-이름-A', 'host-b', 'host-c', 'host-d', 'host-e'] },
      {
        name: 'used',
        type: FieldType.number,
        values: [20, 80, 80, null, -2],
        config: { unit: 'bytes', color: { mode: FieldColorModeId.PaletteClassic }, custom: {} },
      },
      {
        name: 'free',
        type: FieldType.number,
        values: [80, 20, 40, 50, 10],
        config: { unit: 'bytes', color: { mode: FieldColorModeId.Fixed, fixedColor: '#ff00ff' }, custom: {} },
      },
      { name: 'device', type: FieldType.string, values: ['a', 'b', 'c', 'd', 'e'] },
    ],
  });
  data.fields.forEach((field) => {
    field.display = getDisplayProcessor({ field, theme });
    field.config.custom ??= {};
  });
  return data;
}

it('sorts a stable row index projection and keeps values, extra fields and data links attached to their source row', () => {
  const data = frame();
  const before = JSON.stringify(data.fields.map((field) => ({ values: field.values, config: field.config })));
  const links = jest.fn(() => []);
  data.fields[1].getLinks = links;
  const indices = categoryIndices(data, { field: '1:used', direction: 'desc', limit: 3 });
  expect(indices).toEqual([1, 2, 0]);
  expect(categoryIndices(data, { field: '1:used', direction: 'asc', limit: 0 })).toEqual([4, 0, 1, 2, 3]);
  expect(categoryIndices(data, initialCategoryOrder)).toEqual([0, 1, 2, 3, 4]);
  const projected = projectCategories(data, indices);
  expect(projected.fields.map((field) => field.values[0])).toEqual(['host-b', 80, 20, 'b']);
  projected.fields[1].getLinks!({ valueRowIndex: 2 });
  expect(links).toHaveBeenLastCalledWith({ valueRowIndex: 0 });
  expect(projectCategoryField(data.fields[3], indices).values).toEqual(['b', 'c', 'a']);
  expect(JSON.stringify(data.fields.map((field) => ({ values: field.values, config: field.config })))).toBe(before);
});

it('disambiguates duplicate numeric field names from joined queries', () => {
  const data = frame();
  data.fields[2].name = 'used';
  expect(categoryIndices(data, { field: '2:used', direction: 'desc', limit: 2 })).toEqual([0, 3]);
});

it('uses the shared palette only for automatic numeric series and preserves overrides, threshold modes and units', () => {
  const data = frame();
  const sourceColor = data.fields[1].config.color;
  const result = presentBarFrames([data], { defaults: {}, overrides: [] }, theme)[0];
  expect(result.fields[0]).toBe(data.fields[0]);
  expect(result.fields[1].config.color?.mode).toBe(FieldColorModeId.Fixed);
  expect(result.fields[1].config.unit).toBe('bytes');
  expect(result.fields[1].values).toBe(data.fields[1].values);
  expect(result.fields[2]).toBe(data.fields[2]);
  expect(data.fields[1].config.color).toBe(sourceColor);
  expect(
    presentBarFrames(
      [data],
      {
        defaults: {},
        overrides: [{ matcher: { id: 'byName', options: 'used' }, properties: [{ id: 'color', value: sourceColor }] }],
      },
      theme
    )[0].fields[1]
  ).toBe(data.fields[1]);
  data.fields[1].config.color = { mode: FieldColorModeId.Thresholds };
  expect(presentBarFrames([data], { defaults: {}, overrides: [] }, theme)[0].fields[1]).toBe(data.fields[1]);
});

it.each([StackingMode.None, StackingMode.Normal, StackingMode.Percent])(
  'retains native %s grouped/stacked math, negative values and units',
  (stacking) => {
    const data = frame();
    const config = { defaults: {}, overrides: [] };
    const prepared = prepSeries([data], config, stacking, theme);
    const options = {
      ...defaultOptions,
      stacking,
      legend: { showLegend: false },
      tooltip: { mode: TooltipDisplayMode.Single },
    } as Options;
    const tokens = wallCategoricalTokens(theme);
    const args = {
      series: prepared.series,
      totalSeries: 2,
      options,
      orientation: VizOrientation.Horizontal,
      timeZone: 'utc',
      theme,
    };
    const native = prepConfig(args);
    const modern = prepConfig({
      ...args,
      presentation: { ...tokens, hoverStroke: tokens.text, measure: measureBarText, formatCategory: (value) => value },
    });
    expect(modern.prepData(prepared.series)).toEqual(native.prepData(prepared.series));
    if (stacking === StackingMode.Percent) {
      const axis = modern.builder.getConfig().axes!.find((axis) => axis.scale === 'bytes')!;
      const values = axis.values as Function;
      expect(values({}, [0.25, 1], 0, 0, 0)).toEqual(['25%', '100%']);
    }
    expect(prepared.series[0].fields[1].config.unit).toBe('bytes');
    expect(data.fields[1].values).toEqual([20, 80, 80, null, -2]);
  }
);

it('truncates measured category labels without splitting Unicode or changing their underlying name', () => {
  const value = '가상머신😀-스토리지센터';
  const short = truncateCategory(value, 7, (text) => Array.from(text).length);
  expect(short).toBe('가상머신😀-…');
  expect(truncateCategory(value, 100, (text) => Array.from(text).length)).toBe(value);
});

it('uses the existing rendered bar geometry for selection/context actions and removes pointer listeners on destroy', () => {
  const paths = jest.spyOn(uPlot.paths, 'bars');
  const data = [
    [0, 1],
    [10, 20],
  ] as unknown as uPlot.AlignedData;
  const over = document.createElement('div');
  over.getBoundingClientRect = () => ({
    x: 100,
    y: 200,
    left: 100,
    top: 200,
    right: 500,
    bottom: 400,
    width: 400,
    height: 200,
    toJSON: () => ({}),
  });
  const pick = jest.fn();
  const tokens = wallCategoricalTokens(theme);
  const config = getConfig(
    {
      xOri: 0,
      xDir: 1,
      groupWidth: 0.7,
      barWidth: 0.8,
      barRadius: 0,
      showValue: VisibilityMode.Never,
      stacking: StackingMode.None,
      rawValue: () => 10,
      formatValue: (_, value) => String(value),
      formatShortValue: (_, value) => String(value),
      appearance: { ...tokens, hoverStroke: tokens.text, measure: measureBarText, formatCategory: (text) => text },
      interaction: { pick, selected: () => ({ sidx: 1, didx: 0 }) },
    },
    theme
  );
  const plot = {
    over,
    root: document.createElement('div'),
    bbox: { left: 20, top: 20, width: 400, height: 200 },
    data,
    series: [{}, {}],
    redraw: jest.fn(),
    ctx: document.createElement('canvas').getContext('2d'),
  } as unknown as uPlot;
  config.init(plot);
  config.drawClear(plot);
  const each = paths.mock.calls[paths.mock.calls.length - 1][0]!.each!;
  each(plot, 1, 0, 60, 60, 80, 100);
  fireEvent.click(over, { clientX: 145, clientY: 250, button: 0 });
  expect(pick).toHaveBeenCalledWith({ sidx: 1, didx: 0 }, expect.any(MouseEvent), false);
  const event = new MouseEvent('contextmenu', { clientX: 145, clientY: 250, cancelable: true });
  over.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(pick).toHaveBeenLastCalledWith({ sidx: 1, didx: 0 }, event, true);
  config.draw(plot);
  config.destroy();
  pick.mockClear();
  fireEvent.click(over, { clientX: 145, clientY: 250 });
  expect(pick).not.toHaveBeenCalled();
  paths.mockRestore();
});

it('provides real item actions, native data inspection and view-only Top N without inventing variable filters', async () => {
  const user = userEvent.setup();
  const inspect = jest.fn();
  const onOrder = jest.fn();
  const onSelect = jest.fn();
  const data = frame();
  const selection: BarSelection = { row: 1, field: '1:used' };
  const clipboard = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  render(
    <PanelContextProvider value={{ onInspectSeriesData: inspect }}>
      <WallBarControls
        frame={data}
        indices={[0, 1, 2, 3, 4]}
        order={initialCategoryOrder}
        onOrder={onOrder}
        selection={selection}
        onSelect={onSelect}
        menuPoint={null}
        onCloseMenu={jest.fn()}
        returnFocus={createRef()}
      />
    </PanelContextProvider>
  );
  await user.click(screen.getByRole('button', { name: '선택 항목 작업' }));
  await user.click(await screen.findByRole('menuitem', { name: '항목 이름 복사' }));
  expect(clipboard).toHaveBeenLastCalledWith('host-b');
  await user.click(screen.getByRole('button', { name: '선택 항목 작업' }));
  expect(screen.queryByText(/필터/)).not.toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  await user.click(await screen.findByRole('menuitem', { name: '패널 데이터 확인' }));
  expect(inspect).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('combobox', { name: '항목 표시 범위' }));
  await user.click(await screen.findByRole('option', { name: 'Top 5' }));
  expect(onOrder).toHaveBeenLastCalledWith({ field: '1:used', direction: 'desc', limit: 5 });
});

it('opens a coordinate-anchored Base UI context menu without a synthetic canvas trigger', async () => {
  const user = userEvent.setup();
  const data = frame();
  const props = {
    frame: data,
    indices: [0, 1, 2],
    order: initialCategoryOrder,
    onOrder: jest.fn(),
    selection: { row: 1, field: '1:used' },
    onSelect: jest.fn(),
    menuPoint: { x: 120, y: 100 },
    onCloseMenu: jest.fn(),
    returnFocus: createRef<HTMLDivElement>(),
  };
  render(<WallBarControls {...props} />);
  expect(await screen.findByRole('menuitem', { name: '항목 이름 복사' })).toBeVisible();
  await user.keyboard('{Escape}');
  expect(props.onCloseMenu).toHaveBeenCalled();
});
