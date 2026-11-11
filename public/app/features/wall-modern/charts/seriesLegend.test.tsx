import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EventBusSrv, createTheme, getDisplayProcessor, toDataFrame, type FieldConfigSource } from '@grafana/data';
import { LegendDisplayMode } from '@grafana/schema';
import { PanelContextProvider, SeriesVisibilityChangeMode } from '@grafana/ui';
import { TimeSeriesPresentationContext } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { getDisplayValuesForCalcs } from '@grafana/ui/src/components/uPlot/utils';

import { wallTimeSeriesTokens } from '../chartTokens';

import { WallSeriesLegend } from './WallSeriesLegend';
import { clearSeriesSelection, sortLegendItems, legendPlacement } from './seriesLegendModel';

const tokens = wallTimeSeriesTokens(createTheme());
const items = ['host-10', 'host-2', 'host-1'].map((label, index) => ({
  label,
  color: tokens.palette[index],
  yAxis: 1,
  getItemKey: () => label,
  getSortValue: () => [5, undefined, 2][index],
  getDisplayValues: () => [{ text: String([5, 0, 2][index]), numeric: [5, 0, 2][index], title: 'Max' }],
}));
it('fits one selected statistic inline when space allows and retains all rows and actions when narrowing', () => {
  const previous = global.ResizeObserver;
  let width = 280;
  let resize = () => {};
  const rect = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    width,
    height: 100,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: 100,
    toJSON: () => ({}),
  }));
  global.ResizeObserver = class {
    constructor(callback: () => void) {
      resize = callback;
    }
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver;
  try {
    const { container, rerender } = render(
      <TimeSeriesPresentationContext.Provider value={tokens}>
        <WallSeriesLegend items={items} placement="right" displayMode={LegendDisplayMode.Table} />
      </TimeSeriesPresentationContext.Provider>
    );
    const legend = screen.getByRole('group', { name: '시계열 범례' });
    const action = screen.getByRole('button', { name: 'host-10 시리즈 작업' });
    expect(legend).toHaveAttribute('data-wall-legend-stats', 'inline');
    expect(container.querySelectorAll('.wall-series-stat')).toHaveLength(3);
    width = 200;
    act(() => resize());
    expect(legend).not.toHaveAttribute('data-wall-legend-stats');
    expect(container.querySelectorAll('.wall-series-stat')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'host-10 시리즈 작업' })).toBe(action);
    const multiple = items.map((item) => ({
      ...item,
      getDisplayValues: () => [
        { title: 'Max', numeric: 5, text: '5' },
        { title: 'Min', numeric: 0, text: '0' },
      ],
    }));
    width = 600;
    rerender(
      <TimeSeriesPresentationContext.Provider value={tokens}>
        <WallSeriesLegend items={multiple} placement="right" displayMode={LegendDisplayMode.Table} />
      </TimeSeriesPresentationContext.Provider>
    );
    expect(legend).toHaveAttribute('data-wall-legend-stats', 'matrix');
    expect(container.querySelectorAll('.wall-series-stat')).toHaveLength(6);
    width = 1;
    act(() => resize());
    expect(legend).not.toHaveAttribute('data-wall-legend-stats');
    expect(container.querySelectorAll('.wall-series-stat')).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'host-10 시리즈 작업' })).toBe(action);
  } finally {
    rect.mockRestore();
    global.ResizeObserver = previous;
  }
});
it('honors Hidden and restores the same configured items when the legend is shown', () => {
  const { rerender } = render(
    <TimeSeriesPresentationContext.Provider value={tokens}>
      <WallSeriesLegend items={items} placement="bottom" displayMode={LegendDisplayMode.Hidden} />
    </TimeSeriesPresentationContext.Provider>
  );
  expect(screen.queryByRole('group', { name: '시계열 범례' })).not.toBeInTheDocument();
  rerender(
    <TimeSeriesPresentationContext.Provider value={tokens}>
      <WallSeriesLegend items={items} placement="bottom" displayMode={LegendDisplayMode.Table} />
    </TimeSeriesPresentationContext.Provider>
  );
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
});
it('copies the full name without changing visibility or panel configuration', async () => {
  const user = userEvent.setup();
  const copied = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  render(
    <TimeSeriesPresentationContext.Provider value={tokens}>
      <WallSeriesLegend items={[items[0]]} placement="bottom" displayMode={LegendDisplayMode.List} />
    </TimeSeriesPresentationContext.Provider>
  );
  await user.click(screen.getByRole('button', { name: 'host-10 시리즈 작업' }));
  await user.click(await screen.findByRole('menuitem', { name: '시리즈 이름 복사' }));
  expect(copied).toHaveBeenCalledWith('host-10');
  expect(screen.getByRole('button', { name: 'host-10', exact: true })).toHaveAttribute('aria-pressed', 'true');
  copied.mockRestore();
});
it('restores a saved Last sort using the native last reducer ID', () => {
  const value = jest.fn(() => 5);
  render(
    <TimeSeriesPresentationContext.Provider value={tokens}>
      <WallSeriesLegend
        items={[{ ...items[0], getSortValue: value }]}
        placement="bottom"
        displayMode={LegendDisplayMode.Table}
        sortBy="Last"
      />
    </TimeSeriesPresentationContext.Provider>
  );
  expect(value).toHaveBeenCalledWith('last');
  expect(value).not.toHaveBeenCalledWith('Last');
});
it('keeps Last distinct from Last not null including a real numeric zero', () => {
  const theme = createTheme();
  const frame = toDataFrame({
    fields: [
      { name: 'nullable', values: [5, null] },
      { name: 'zero', values: [0, 0] },
    ],
  });
  const series = frame.fields.map((field) => {
    field.display = getDisplayProcessor({ field, theme });
    return {
      label: field.name,
      yAxis: 1,
      getSortValue: (key: string) => getDisplayValuesForCalcs([key], field, theme)[0].numeric,
    };
  });
  expect(sortLegendItems(series, 'last', false).map((s) => s.label)).toEqual(['zero', 'nullable']);
  expect(sortLegendItems(series, 'lastNotNull', true).map((s) => s.label)).toEqual(['nullable', 'zero']);
  expect(frame.fields[0].values).toEqual([5, null]);
});
it('sorts a view copy stably and keeps null/NaN last without changing the frame or item order', () => {
  expect(sortLegendItems(items, 'Name', false).map((i) => i.label)).toEqual(['host-1', 'host-2', 'host-10']);
  expect(sortLegendItems(items, 'mean', true).map((i) => i.label)).toEqual(['host-10', 'host-1', 'host-2']);
  expect(items.map((i) => i.label)).toEqual(['host-10', 'host-2', 'host-1']);
});
it('clears only the native temporary selection override', () => {
  const native = {
    __systemRef: 'hideSeriesFrom',
    matcher: { id: 'byNames', options: { names: ['x'] } },
    properties: [],
  };
  const explicit = {
    matcher: { id: 'byName', options: 'x' },
    properties: [{ id: 'color', value: { mode: 'fixed', fixedColor: 'red' } }],
  };
  const config = { defaults: { unit: 'ms' }, overrides: [explicit, native] } as FieldConfigSource;
  const next = clearSeriesSelection(config);
  expect(next.overrides).toEqual([explicit]);
  expect(next.defaults).toBe(config.defaults);
  expect(config.overrides).toHaveLength(2);
});
it('keeps explicit placement and only adapts when auto is requested or placement is missing', () => {
  expect(legendPlacement('right', false, 300, 300, 900)).toBe('right');
  expect(legendPlacement('bottom', false, 1400, 500, 900)).toBe('bottom');
  expect(legendPlacement('bottom', true, 1400, 500, 900)).toBe('right');
  expect(legendPlacement('right', true, 300, 300, 900)).toBe('bottom');
});
it('retains configured statistics and provides native actions and only real data links', async () => {
  const toggle = jest.fn(),
    reset = jest.fn(),
    inspect = jest.fn();
  const dataLinks = jest.fn(() => [
    { title: '실제 링크', href: '/d/linked?var-host=host-10', target: '_self', origin: {} },
  ]);
  const linked = {
    ...items[0],
    data: {
      field: { values: [5], config: { links: [{ title: '실제 링크', url: '/d/linked' }] }, getLinks: dataLinks },
    },
  };
  render(
    <PanelContextProvider
      value={{
        eventsScope: 'test',
        eventBus: new EventBusSrv(),
        onToggleSeriesVisibility: toggle,
        onSeriesVisibilityReset: reset,
        onInspectSeriesData: inspect,
      }}
    >
      <TimeSeriesPresentationContext.Provider value={tokens}>
        <WallSeriesLegend
          items={[linked, ...items.slice(1)]}
          placement="bottom"
          displayMode={LegendDisplayMode.Table}
        />
      </TimeSeriesPresentationContext.Provider>
    </PanelContextProvider>
  );
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  expect(screen.getAllByText('Max').length).toBeGreaterThan(0);
  await userEvent.click(screen.getByRole('button', { name: 'host-10 시리즈 작업' }));
  expect(await screen.findByRole('menuitem', { name: '실제 링크' })).toHaveAttribute(
    'href',
    '/d/linked?var-host=host-10'
  );
  await userEvent.click(screen.getByRole('menuitem', { name: '이 시리즈 숨기기' }));
  expect(toggle).toHaveBeenCalledWith('host-10', SeriesVisibilityChangeMode.AppendToSelection);
  await userEvent.click(screen.getByRole('button', { name: 'host-10 시리즈 작업' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: '전체 시리즈 다시 표시' }));
  expect(reset).toHaveBeenCalledTimes(1);
  await userEvent.click(screen.getByRole('button', { name: '범례 정렬' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: '이름', exact: true }));
  expect(within(screen.getAllByRole('listitem')[0]).getByRole('button', { name: 'host-1', exact: true })).toBeVisible();
  expect(items[0].label).toBe('host-10');
});
it('supports a single series and dozens of series without adding unconfigured statistic columns', () => {
  const many = Array.from({ length: 48 }, (_, index) => ({
    label: `series-${index}`,
    color: tokens.palette[0],
    yAxis: 1,
  }));
  const { rerender } = render(
    <TimeSeriesPresentationContext.Provider value={tokens}>
      <WallSeriesLegend items={many.slice(0, 1)} placement="right" displayMode={LegendDisplayMode.List} />
    </TimeSeriesPresentationContext.Provider>
  );
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  rerender(
    <TimeSeriesPresentationContext.Provider value={tokens}>
      <WallSeriesLegend items={many} placement="bottom" displayMode={LegendDisplayMode.List} />
    </TimeSeriesPresentationContext.Provider>
  );
  expect(screen.getAllByRole('listitem')).toHaveLength(48);
  expect(screen.queryByRole('columnheader', { name: 'Mean' })).not.toBeInTheDocument();
});

it('retains an existing sort by a configured calculation title without requesting an invalid reducer', () => {
  const reducer = jest.fn(() => {
    throw new Error('not a reducer ID');
  });
  const custom = [
    { ...items[0], getSortValue: reducer, getDisplayValues: () => [{ title: 'Total', numeric: 9, text: '9' }] },
    { ...items[1], getSortValue: reducer, getDisplayValues: () => [{ title: 'Total', numeric: 3, text: '3' }] },
  ];
  expect(sortLegendItems(custom, 'Total', false).map((i) => i.label)).toEqual(['host-2', 'host-10']);
  expect(reducer).not.toHaveBeenCalled();
});

it('does not expose color changes without native edit permission or fabricate data links', async () => {
  render(
    <PanelContextProvider
      value={{
        eventsScope: 'viewer',
        eventBus: new EventBusSrv(),
        onSeriesColorChange: jest.fn(),
        canEditSeriesColor: () => false,
      }}
    >
      <TimeSeriesPresentationContext.Provider value={tokens}>
        <WallSeriesLegend items={[items[0]]} displayMode={LegendDisplayMode.List} placement="bottom" />
      </TimeSeriesPresentationContext.Provider>
    </PanelContextProvider>
  );
  await userEvent.click(screen.getByRole('button', { name: 'host-10 시리즈 작업' }));
  expect(screen.queryByRole('menuitem', { name: '시리즈 색상 변경' })).not.toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: /링크/ })).not.toBeInTheDocument();
});

it('adapts narrow legends without hiding configured statistics or remounting the series actions', async () => {
  const previous = global.ResizeObserver;
  let resize: () => void = () => {};
  let width = 300;
  const rect = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    width,
    height: 100,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: 100,
    toJSON: () => ({}),
  }));
  global.ResizeObserver = class {
    constructor(cb: () => void) {
      resize = cb;
    }
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver;
  const stats = {
    ...items[0],
    getDisplayValues: () => ['Mean', 'Last *', 'Max', 'Min'].map((title) => ({ title, text: '42.00', numeric: 42 })),
  };
  const { container } = render(
    <TimeSeriesPresentationContext.Provider value={tokens}>
      <WallSeriesLegend items={[stats]} placement="bottom" displayMode={LegendDisplayMode.Table} />
    </TimeSeriesPresentationContext.Provider>
  );
  expect(container.querySelector('[data-wall-legend-density]')).toHaveAttribute('data-wall-legend-density', 'compact');
  expect(container.querySelectorAll('.wall-series-stat')).toHaveLength(4);
  const button = screen.getByRole('button', { name: 'host-10' });
  width = 700;
  const { act } = await import('@testing-library/react');
  act(() => resize());
  expect(container.querySelector('[data-wall-legend-density]')).toHaveAttribute('data-wall-legend-density', 'regular');
  expect(screen.getByRole('button', { name: 'host-10' })).toBe(button);
  rect.mockRestore();
  global.ResizeObserver = previous;
});
