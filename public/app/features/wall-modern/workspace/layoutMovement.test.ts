import {
  panelGroupMovePreview,
  panelMovePreview,
  panelResizePreview,
  snapPanelResize,
  panelAlignmentGuides,
  snapPanelPosition,
  gridCoordinate,
} from './layoutMovement';
import { validatePanelLayout } from './panelLayout';

const geometry = { width: 948, gap: 12, rowPitch: 2 };
const original = [
  { i: 'a', x: 0, y: 0, w: 24, h: 100 },
  { i: 'b', x: 0, y: 100, w: 24, h: 100 },
  { i: 'other', x: 24, y: 400, w: 24, h: 40 },
];
it('moves a selection rigidly, preserves holes and clamps the whole selection within 48 columns', () => {
  const origin = [
    { i: 'a', x: 0, y: 0, w: 8, h: 20 },
    { i: 'b', x: 16, y: 0, w: 8, h: 20 },
    { i: 'hole', x: 8, y: 50, w: 8, h: 20 },
  ];
  const snapshot = JSON.stringify(origin);
  const preview = panelGroupMovePreview(origin, ['a', 'b'], { x: 0, y: 100 }, geometry);
  expect(preview.layout.find((item) => item.i === 'a')).toMatchObject({ x: 0, y: 48, w: 8, h: 20 });
  expect(preview.layout.find((item) => item.i === 'b')).toMatchObject({ x: 16, y: 48 });
  expect(preview.layout.find((item) => item.i === 'hole')).toEqual(origin[2]);
  const edge = panelGroupMovePreview(origin, ['a', 'b'], { x: 10000, y: 100 }, geometry);
  expect(edge.layout.find((item) => item.i === 'b')).toMatchObject({ x: 40, y: 48 });
  expect(validatePanelLayout(edge.layout, ['a', 'b', 'hole'])).toBeDefined();
  expect(edge.layout.some((item) => 'static' in item)).toBe(false);
  expect(JSON.stringify(origin)).toBe(snapshot);
});
it('keeps neighbours still before swap intent instead of pushing them down and then back up', () => {
  for (const y of [2, 24, 60]) {
    const result = panelMovePreview(original, 'a', { x: 0, y }, geometry);
    expect(result.target).toBeUndefined();
    expect(result.layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))).toEqual(original);
  }
  const committed = panelMovePreview(original, 'a', { x: 0, y: 70 }, geometry);
  expect(committed.target).toBe('b');
  expect(committed.layout.find((item) => item.i === 'b')?.y).toBe(0);
});
it('exchanges the two original slots without chasing the neighbour on successive frames', () => {
  const snapshot = JSON.stringify(original);
  let target: string | undefined;
  for (const y of [110, 160, 210, 240]) {
    const result = panelMovePreview(original, 'a', { x: 0, y }, geometry, target);
    target = result.target;
    expect(target).toBe('b');
    expect(result.layout.find((item) => item.i === 'b')).toMatchObject({ x: 0, y: 0 });
    expect(result.layout.find((item) => item.i === 'a')).toMatchObject({ x: 0, y: 100 });
    expect(result.layout.find((item) => item.i === 'other')).toMatchObject(original[2]);
  }
  expect(JSON.stringify(original)).toBe(snapshot);
});
it('retains the target through the wider release band and returns exactly to the origin when dragging back', () => {
  const enter = panelMovePreview(original, 'a', { x: 0, y: 110 }, geometry);
  expect(panelMovePreview(original, 'a', { x: 0, y: 90 }, geometry, enter.target).target).toBe('b');
  expect(panelMovePreview(original, 'a', { x: 0, y: 44 }, geometry, enter.target).target).toBe('b');
  expect(panelMovePreview(original, 'a', { x: 0, y: 44 }, geometry).target).toBeUndefined();
  const reset = panelMovePreview(original, 'a', { x: 0, y: 0 }, geometry, enter.target);
  expect(reset.target).toBeUndefined();
  expect(reset.layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))).toEqual(original);
});

it('snaps every empty grid stop independently of neighbours, with a cell-relative release band', () => {
  const source = { i: 'a', x: 0, y: 0, w: 8, h: 20 };
  const near = [{ i: 'b', x: 24, y: 100, w: 8, h: 20 }];
  for (const x of [1, 5, 13, 23, 31]) {
    const delta = { x: x * 20, y: 244 };
    const expected = { x, y: 120 };
    expect(snapPanelPosition([source], source, delta, geometry)).toEqual(expected);
    expect(snapPanelPosition([source, ...near], source, delta, geometry)).toEqual(expected);
  }
  expect(gridCoordinate(5.6, 5)).toBe(5);
  expect(gridCoordinate(5.64, 5)).toBe(6);
  expect(gridCoordinate(5.4, 6)).toBe(6);
  expect(gridCoordinate(5.36, 6)).toBe(5);
});

describe('Resize collision priority', () => {
  // Data panels precede display text in the real overview array. Native compact(null)
  // follows this array order and used to send the resized last text below every tile.
  const items = [
    { i: 'usage', x: 32, y: 0, w: 16, h: 50 },
    { i: 'chart', x: 0, y: 60, w: 32, h: 100 },
    { i: 'text', x: 0, y: 0, w: 32, h: 30 },
  ];
  it('anchors full-width SE resize, displaces neighbours and is independent of item order', () => {
    for (const origin of [items, [...items].reverse()]) {
      const preview = panelResizePreview(origin, { ...items[2], w: 48, h: 55 }, false);
      expect(preview.find((item) => item.i === 'text')).toEqual({ ...items[2], w: 48, h: 55 });
      expect(preview.find((item) => item.i === 'usage')).toMatchObject({ x: 32, y: 55 });
      expect(
        validatePanelLayout(
          preview,
          items.map((item) => item.i)
        )
      ).toBeDefined();
      expect(preview.some((item) => 'static' in item)).toBe(false);
    }
  });
  it('keeps the SW right edge fixed and restores neighbours when shrinking in the same gesture', () => {
    const origin = [
      { ...items[0], x: 0 },
      { ...items[2], x: 16 },
    ];
    const expanded = panelResizePreview(origin, { ...origin[1], x: 0, w: 48, h: 55 }, true);
    expect(expanded.find((item) => item.i === 'text')).toMatchObject({ x: 0, y: 0, w: 48, h: 55 });
    expect(expanded.find((item) => item.i === 'usage')?.y).toBe(55);
    const contracted = panelResizePreview(origin, origin[1], true);
    expect(contracted).toEqual(origin);
    expect(items[0].y).toBe(0);
  });
});
it('swaps horizontally and preserves free positions and unrelated intentional gaps', () => {
  const row = [{ ...original[0] }, { ...original[1], x: 24, y: 0 }, original[2]];
  const result = panelMovePreview(row, 'a', { x: 400, y: 0 }, geometry);
  expect(result.layout.find((item) => item.i === 'b')).toMatchObject({ x: 0, y: 0 });
  expect(result.layout.find((item) => item.i === 'a')).toMatchObject({ x: 24, y: 0 });
  const free = panelMovePreview(original, 'a', { x: 0, y: 600 }, geometry);
  expect(free.target).toBeUndefined();
  expect(free.layout.find((item) => item.i === 'a')?.y).toBe(300);
  expect(free.layout.find((item) => item.i === 'b')?.y).toBe(100);
  expect(free.layout.find((item) => item.i === 'other')?.y).toBe(400);
});
it('uses native collision resolution for unequal heights without resizing or losing information', () => {
  const unequal = [original[0], { ...original[1], h: 160 }, original[2]];
  const result = panelMovePreview(unequal, 'a', { x: 0, y: 200 }, geometry);
  expect(
    validatePanelLayout(
      result.layout,
      unequal.map((item) => item.i)
    )
  ).toBeDefined();
  expect(result.layout.find((item) => item.i === 'b')).toMatchObject({ y: 0, h: 160, w: 24 });
  expect(result.layout.find((item) => item.i === 'a')).toMatchObject({ y: 160, h: 100, w: 24 });
});

it('exchanges unequal KPI widths in the same row without sending the grabbed card below it', () => {
  const row = [
    { i: 'a', x: 0, y: 30, w: 10, h: 54 },
    { i: 'b', x: 10, y: 30, w: 11, h: 54 },
    { i: 'c', x: 21, y: 30, w: 10, h: 54 },
    { i: 'd', x: 31, y: 30, w: 11, h: 54 },
  ];
  const near = panelMovePreview(row, 'a', { x: 76, y: 0 }, geometry);
  expect(near.target).toBe('b');
  expect(near.layout.find((item) => item.i === 'a')).toMatchObject({ x: 11, y: 30, w: 10 });
  expect(near.layout.find((item) => item.i === 'b')).toMatchObject({ x: 0, y: 30, w: 11 });
  const across = panelMovePreview(row, 'a', { x: 600, y: 0 }, geometry);
  expect(across.target).toBe('d');
  expect(across.layout.find((item) => item.i === 'a')).toMatchObject({ x: 32, y: 30, w: 10 });
  expect(across.layout.find((item) => item.i === 'b')).toMatchObject({ x: 11, y: 30 });
  expect(across.layout.find((item) => item.i === 'c')).toMatchObject({ x: 22, y: 30 });
  expect(
    validatePanelLayout(
      across.layout,
      row.map((item) => item.i)
    )
  ).toBeDefined();
  const back = panelMovePreview(across.layout, 'a', { x: -640, y: 0 }, geometry);
  expect(back.layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))).toEqual(row);
});

it('snaps resize to each visible grid row, preserving opposite corner and limits', () => {
  const source = { i: 'a', x: 0, y: 0, w: 12, h: 50 };
  const neighbour = { i: 'b', x: 12, y: 0, w: 12, h: 100 };
  const geom = { ...geometry, gapY: 12 };
  const near = snapPanelResize([source, neighbour], source, { x: 0, y: 82 }, geom, false, {});
  expect(near).toMatchObject({ x: 0, y: 0, w: 12, h: 90 });
  expect(snapPanelResize([source, neighbour], source, { x: 0, y: 86 }, geom, false, {}, near).h).toBe(90);
  expect(snapPanelResize([source, neighbour], source, { x: 0, y: 142 }, geom, false, {}, near).h).toBe(120);
  expect(
    snapPanelResize([source, neighbour], source, { x: 10000, y: 10000 }, geom, false, { maxH: 120 })
  ).toMatchObject({ x: 0, y: 0, w: 48, h: 120 });
  const west = { ...source, x: 12 };
  const resized = snapPanelResize([west], west, { x: -230, y: 0 }, geom, true, {});
  expect(resized.x + resized.w).toBe(west.x + west.w);
});
it('guides compare visible card edges, deduplicate shared lines and never advertise a near miss', () => {
  const source = { i: 'a', x: 0, y: 0, w: 12, h: 50 };
  const other = { i: 'b', x: 12, y: 0, w: 12, h: 50 };
  const guides = panelAlignmentGuides(source, [other], 20, 2, 12, 12);
  expect(guides).toEqual([
    { axis: 'y', at: 0, start: 0, end: 468 },
    { axis: 'y', at: 88, start: 0, end: 468 },
  ]);
  expect(panelAlignmentGuides(source, [{ ...other, y: 1 }], 20, 2, 12, 12)).toEqual([]);
});
