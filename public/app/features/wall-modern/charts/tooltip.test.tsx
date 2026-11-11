import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createTheme, FieldType, getDisplayProcessor, toDataFrame } from '@grafana/data';
import { SortOrder, TooltipDisplayMode } from '@grafana/schema';
import { TimeSeriesPresentationContext } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import {
  wallTooltipPosition,
  WallTooltipPlacement,
} from '@grafana/ui/src/components/uPlot/plugins/wallTooltipPosition';
import { TimeSeriesTooltip } from 'app/plugins/panel/timeseries/TimeSeriesTooltip';

import { wallTimeSeriesTokens } from '../chartTokens';

import { WallTimeSeriesTooltip } from './WallTimeSeriesTooltip';
import { tooltipTime } from './tooltipModel';

const start = Date.UTC(2026, 10, 5, 6);
const theme = createTheme();
function frame() {
  const data = toDataFrame({
    fields: [
      { name: 'Time', type: FieldType.time, values: [start, start + 15000, start + 60000] },
      { name: '처리 시간', type: FieldType.number, config: { unit: 'ms', decimals: 2 }, values: [1.25, 2.5, null] },
      {
        name: '긴 호스트명 / 느린 수집',
        type: FieldType.number,
        config: { unit: 'bytes', decimals: 1, noValue: '수집값 없음' },
        values: [2048, null, 4096],
      },
    ],
  });
  data.fields.forEach((field) => {
    field.display = getDisplayProcessor({ field, theme, timeZone: 'utc' });
  });
  return data;
}
function show(data = frame(), idxs = [1, 1, 0], pinned = false) {
  return render(
    <TimeSeriesPresentationContext.Provider value={wallTimeSeriesTokens(theme)}>
      <TimeSeriesTooltip
        series={data}
        dataIdxs={idxs}
        seriesIdx={1}
        mode={TooltipDisplayMode.Multi}
        sortOrder={SortOrder.None}
        isPinned={pinned}
        timeZone="Asia/Seoul"
      />
    </TimeSeriesPresentationContext.Provider>
  );
}

it('uses the dashboard timezone and actual millisecond/second/minute precision, without inventing an end', () => {
  const time = frame().fields[0];
  expect(tooltipTime(start + 15000, time, 'Asia/Seoul').text).toBe('2026-11-05 15:00:15');
  expect(tooltipTime(start + 123, time, 'utc').text).toBe('2026-11-05 06:00:00.123');
  time.config.unit = 'percent';
  expect(tooltipTime(start + 123, time, 'Asia/Seoul').text).toBe('2026-11-05 15:00:00.123');
  time.config.unit = undefined;
  time.config.interval = 60000;
  expect(tooltipTime(start, time, 'utc').text).toBe('2026-11-05 06:00');
  expect(tooltipTime(start + 15000, time, 'utc').text).toBe('2026-11-05 06:00:15');
  time.config.unit = 'time:HH:mm';
  time.display = () => ({ text: 'explicit format', numeric: start });
  expect(tooltipTime(start, time, 'utc').text).toBe('explicit format');
});

it('retains actual values/units and reveals a differing sample timestamp rather than relabelling it', () => {
  const data = frame(),
    before = JSON.stringify(data.fields.map((f) => f.values));
  show(data);
  expect(screen.getByText('2026-11-05 15:00:15')).toHaveAttribute('datetime', '2026-11-05T06:00:15.000Z');
  expect(screen.getByText('측정 15:00:00')).toHaveAttribute('datetime', '2026-11-05T06:00:00.000Z');
  expect(screen.getByText('2.50')).toBeVisible();
  expect(screen.getByText('2.0')).toBeVisible();
  expect(screen.getByText('KiB')).toBeVisible();
  expect(screen.getByText('긴 호스트명 / 느린 수집')).toHaveAttribute('title', '긴 호스트명 / 느린 수집');
  expect(JSON.stringify(data.fields.map((f) => f.values))).toBe(before);
});

it('preserves native missing-index, null/noValue and actual zero policies', () => {
  const data = frame();
  const view = show(data, [2, 2, null]);
  expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  view.unmount();
  const second = show(data, [1, null, 1]);
  expect(screen.getByText('수집값 없음')).toBeVisible();
  second.unmount();
  data.fields[1].values[1] = 0;
  show(data, [1, 1, null]);
  expect(screen.getByText('0.00')).toBeVisible();
});

it('keeps pinned copying on the native clipboard action and copies the original formatted string', async () => {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  show(frame(), [1, 1, 0], true);
  await userEvent.click(screen.getByRole('button', { name: '처리 시간 값 복사' }));
  expect(writeText).toHaveBeenCalledWith('2.50 ms');
});

it('keeps every Multi-series value available when the hover viewport is compact', () => {
  render(
    <WallTimeSeriesTooltip
      header={{ value: '2026-11-05 15:00:00' }}
      timestamp={start}
      items={Array.from({ length: 20 }, (_, i) => ({ label: `host-${i}`, value: `${i} ms` }))}
      isPinned={false}
      scrollable
      tokens={wallTimeSeriesTokens(theme)}
    />
  );
  expect(screen.getAllByRole('listitem')).toHaveLength(20);
  expect(screen.getByText('시리즈 20')).toBeVisible();
  expect(screen.getByText('19 ms')).toBeInTheDocument();
});

it('retains the side after flipping until it no longer fits and keeps a large popup in the viewport', () => {
  const plot = { left: 100, right: 900, top: 100, bottom: 500 };
  const viewport = { width: 1000, height: 600 };
  const state: WallTooltipPlacement = {};
  expect(wallTooltipPosition(800, 300, 240, 120, plot, viewport, 12, 8, state).x).toBe(548);
  expect(state.xSide).toBe('before');
  expect(wallTooltipPosition(600, 300, 240, 120, plot, viewport, 12, 8, state).x).toBe(348);
  expect(wallTooltipPosition(200, 300, 240, 120, plot, viewport, 12, 8, state).x).toBe(212);
  const edge = wallTooltipPosition(995, 590, 360, 450, plot, viewport, 12, 8);
  expect(edge.x).toBeGreaterThanOrEqual(8);
  expect(edge.y).toBeGreaterThanOrEqual(8);
  expect(edge.x + 360).toBeLessThanOrEqual(992);
  expect(edge.y + 450).toBeLessThanOrEqual(592);
});

it('keeps the existing shared display for non-time-series analytic callers', () => {
  const view = render(
    <WallTimeSeriesTooltip
      header={{ label: 'X', value: '2' }}
      timestamp={null}
      items={[{ label: 'XY point', value: '3 ms' }]}
      isPinned={false}
      scrollable={false}
      tokens={wallTimeSeriesTokens(theme, false)}
    />
  );
  expect(screen.getByText('XY point')).toBeVisible();
  expect(screen.getByText('3 ms')).toBeVisible();
  expect(view.container.querySelector('.wall-tooltip-row')).toBeNull();
});

it('uses nearby exterior plot space to avoid covering a short chart without moving horizontally away from the cursor', () => {
  const plot = { left: 300, right: 900, top: 300, bottom: 400 };
  const state: WallTooltipPlacement = { ySide: 'below' };
  const point = wallTooltipPosition(600, 340, 320, 118, plot, { width: 1400, height: 900 }, 12, 8, state);
  expect(point.x).toBe(612);
  expect(point.y + 118).toBeLessThan(plot.top);
  expect(Math.abs(340 - 12 - 118 - point.y)).toBeLessThanOrEqual(118 / 2);
  expect(state.edge).toBe('top');
});
