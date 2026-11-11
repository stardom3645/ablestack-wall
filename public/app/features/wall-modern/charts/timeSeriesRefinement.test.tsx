import { render, screen } from '@testing-library/react';

import { createTheme, FieldType, getDisplayProcessor, toDataFrame } from '@grafana/data';
import { SortOrder, TooltipDisplayMode } from '@grafana/schema';
import { getContentItems } from '@grafana/ui/src/components/VizTooltip/utils';
import { wallTooltipPosition } from '@grafana/ui/src/components/uPlot/plugins/wallTooltipPosition';

import { wallTimeSeriesTokens } from '../chartTokens';

import { WallTimeSeriesTooltip } from './WallTimeSeriesTooltip';

it('keeps live tooltips in the viewport beside the cursor, without clamping them over it', () => {
  const plot = { left: 100, right: 700, top: 100, bottom: 400 };
  for (const [x, y] of [
    [110, 110],
    [690, 390],
    [350, 395],
  ]) {
    const p = wallTooltipPosition(x, y, 220, 110, plot, { width: 1000, height: 800 }, 12, 8);
    expect(p.x).toBeGreaterThanOrEqual(8);
    expect(p.x + 220).toBeLessThanOrEqual(992);
    expect(p.y).toBeGreaterThanOrEqual(8);
    expect(p.y + 110).toBeLessThanOrEqual(792);
    expect(p.x >= x + 12 || p.x + 220 <= x - 12).toBe(true);
  }
});
it('does not centre a tall popup across a short plot and its hovered data point', () => {
  const above = wallTooltipPosition(
    600,
    600,
    220,
    300,
    { left: 300, right: 700, top: 500, bottom: 650 },
    { width: 900, height: 800 },
    12,
    8
  );
  // The refined placement may move to the plot edge; the entire popup must clear the plot.
  expect(above.y).toBeGreaterThanOrEqual(8);
  expect(above.y + 300).toBeLessThanOrEqual(500 - 12);
  const p = wallTooltipPosition(
    295,
    180,
    280,
    250,
    { left: 100, right: 300, top: 40, bottom: 200 },
    { width: 320, height: 400 },
    12,
    8
  );
  expect(p.x).toBeGreaterThanOrEqual(8);
  expect(p.x + 280).toBeLessThanOrEqual(312);
  expect(p.y).toBeGreaterThanOrEqual(8);
  expect(p.y + 250).toBeLessThanOrEqual(392);
});
it('uses distinct automatic colors for the first 16 series in both themes', () => {
  for (const mode of ['light', 'dark'] as const) {
    const palette = wallTimeSeriesTokens(createTheme({ colors: { mode } })).palette;
    expect(new Set(palette).size).toBe(16);
  }
});
it('reuses one native formatting result, keeps zero/decimals/units and the exact pinned-copy string', () => {
  const theme = createTheme();
  const frame = toDataFrame({
    fields: [
      { name: 'Time', type: FieldType.time, values: [0] },
      { name: '호스트', type: FieldType.number, values: [0], config: { unit: 'ms', decimals: 2 } },
    ],
  });
  frame.fields.forEach((f) => {
    f.display = getDisplayProcessor({ field: f, theme });
  });
  const ordinary = getContentItems(frame.fields, frame.fields[0], [0, 0], 1, TooltipDisplayMode.Multi, SortOrder.None);
  expect(ordinary[0].formattedValue).toBeUndefined();
  const enriched = getContentItems(
    frame.fields,
    frame.fields[0],
    [0, 0],
    1,
    TooltipDisplayMode.Multi,
    SortOrder.None,
    () => true,
    true
  );
  expect(enriched[0].value).toBe(ordinary[0].value);
  expect(enriched[0].formattedValue?.text).toBe('0.00');
  render(
    <WallTimeSeriesTooltip
      header={{ label: '', value: '1970-01-01 00:00:00' }}
      timestamp={0}
      items={enriched}
      isPinned
      scrollable
      tokens={wallTimeSeriesTokens(theme)}
    />
  );
  expect(screen.getByText('0.00')).toBeInTheDocument();
  expect(screen.getByText('ms')).toBeInTheDocument();
  expect(screen.getByText('1970-01-01 00:00:00')).toHaveAttribute('datetime', '1970-01-01T00:00:00.000Z');
});
