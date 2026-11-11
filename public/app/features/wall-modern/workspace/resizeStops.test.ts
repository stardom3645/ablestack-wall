import { panelAlignmentGuides, snapPanelPosition, snapPanelResize } from './layoutMovement';
import { panelColumnPitch, panelGridPoint, panelPixelRect, panelRowAnchors, panelRowStops } from './panelGeometry';

const source = { i: 'cube', x: 8, y: 0, w: 4, h: 76 };
const neighbour = { i: 'mold', x: 4, y: 0, w: 4, h: 76 };
const geometry = { width: 1379, gap: 8, gapY: 8, rowPitch: 2 };

it('returns to native 144px height after growing, within one gesture and in a later gesture', () => {
  const origin = [source, neighbour];
  const snapshot = JSON.stringify(origin);
  const larger = snapPanelResize(origin, source, { x: 0, y: 24 }, geometry, false, {});
  expect(larger.h).toBeGreaterThan(source.h);
  const restored = snapPanelResize(origin, source, { x: 0, y: 0 }, geometry, false, {}, larger);
  expect(restored).toEqual(source);
  const restoredLater = snapPanelResize(
    [larger, neighbour],
    larger,
    { x: 0, y: (source.h - larger.h) * 2 },
    geometry,
    false,
    {}
  );
  expect(restoredLater).toEqual(source);
  expect(panelPixelRect(restoredLater, { ...geometry, gapX: 8 }).height).toBe(144);
  expect(panelAlignmentGuides(restoredLater, [neighbour], panelColumnPitch(1379, 8), 2, 8, 8)).toContainEqual({
    axis: 'y',
    at: 144,
    start: 116,
    end: 339,
  });
  expect(JSON.stringify(origin)).toBe(snapshot);
});

it('shares the displayed row stops between Move/Resize, preserving legacy boundaries without near-duplicate dots', () => {
  const anchors = panelRowAnchors([source, neighbour]);
  const rows = panelRowStops(0, 100, 6, anchors);
  expect(rows).toContain(76);
  expect(rows).not.toContain(78);
  expect(rows).toContain(72);
  for (let row = 10; row <= 96; row++) {
    const moved = snapPanelPosition([source], source, { x: 0, y: row * 2 }, { ...geometry, rowAnchors: anchors });
    const resized = snapPanelResize(
      [source],
      source,
      { x: 0, y: (row - source.h) * 2 },
      { ...geometry, rowAnchors: anchors },
      false,
      { minH: 6, maxH: 100 }
    );
    expect(rows).toContain(moved.y);
    expect(rows).toContain(resized.y + resized.h);
  }
});

it.each([8, 12])('draws the moving Resize corner at the actual card border, excluding gutter %d', (gap) => {
  const geom = { width: 1379, gapX: gap, gapY: gap, rowPitch: 2 };
  for (const x of [0, 1, 8, 17]) {
    const anchor = { ...source, x };
    for (const w of [4, 5, 6, 10]) {
      const rect = panelPixelRect({ ...anchor, w }, geom);
      const dot = panelGridPoint(x + w, anchor.y + anchor.h, geom, { anchor });
      expect(dot).toEqual({ x: rect.left + rect.width, y: rect.top + rect.height });
      const west = { ...anchor, x: x - 1, w: w + 1 };
      const westRect = panelPixelRect(west, geom);
      expect(panelGridPoint(west.x, west.y + west.h, geom, { anchor, west: true })).toEqual({
        x: westRect.left,
        y: westRect.top + westRect.height,
      });
    }
    const rect = panelPixelRect(anchor, geom);
    expect(panelGridPoint(anchor.x, anchor.y, geom)).toEqual({ x: rect.left, y: rect.top });
  }
});
