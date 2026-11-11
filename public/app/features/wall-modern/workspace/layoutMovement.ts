import GridLayout, { Layout } from 'react-grid-layout';

import { KpiPosition, kpiGrid, panelSnap, sameKpiLayout } from './kpiLayout';
import { panelColumnPitch, panelPixelRect, panelRowAnchors, panelRowStops } from './panelGeometry';

export interface ResizeReflow {
  id: string;
  origin: KpiPosition[];
  result: KpiPosition[];
}

/** Retain preferred slots across consecutive resizes, without compacting intentional gaps.
 * A move, undo, paste or any other intervening layout change invalidates this baseline.
 */
export function resizeReflowOrigin(items: KpiPosition[], id: string, previous?: ResizeReflow) {
  const origin = previous?.id === id && sameKpiLayout(items, previous.result) ? previous.origin : items;
  // Remember neighbours' preferred slots, but pin this gesture to the active tile's current edges.
  // West resize changes x; reusing its old x would move it again when switching to the east handle.
  const active = items.find((entry) => entry.i === id);
  return origin.map((entry) => ({ ...(entry.i === id && active ? active : entry) }));
}

/** Every grid stop is magnetic. The small cell-relative dead band avoids jitter,
 * without allowing a distant neighbour to capture several intervening cells. */
export function gridCoordinate(value: number, previous: number, step = 1) {
  return Math.abs(value - previous) <= step * panelSnap.cellHold ? previous : Math.round(value / step) * step;
}

export function interactionRowStep(rowPitch: number) {
  return rowPitch < 6 ? Math.max(1, Math.round(panelSnap.rowPixels / rowPitch)) : 1;
}

/** Intersect constraints with the snap lattice before clamping. Clamping a snapped
 * edge to an arbitrary min/max afterwards can put it between two visible stops. */
function boundedGridEdge(
  value: number,
  previous: number,
  step: number,
  min: number,
  max: number,
  anchors?: readonly number[]
) {
  if (anchors) {
    const validAnchors = anchors.filter((edge) => edge >= min && edge <= max);
    const center = Math.max(min, Math.min(max, value));
    const candidates = panelRowStops(Math.max(min, center - step * 2), Math.min(max, center + step * 2), step, anchors);
    // Include distant anchors for bounded/locked legacy dimensions as well.
    candidates.push(...validAnchors);
    if (!candidates.length) {
      return previous;
    }
    const next = candidates.reduce((best, edge) => (Math.abs(edge - value) < Math.abs(best - value) ? edge : best));
    if (next !== previous && previous >= min && previous <= max) {
      const direction = Math.sign(next - previous);
      const adjacent = panelRowStops(previous - step * 2, previous + step * 2, step, anchors)
        .filter((edge) => Math.sign(edge - previous) === direction)
        .sort((a, b) => Math.abs(a - previous) - Math.abs(b - previous))[0];
      if (adjacent !== undefined && Math.abs(value - previous) <= Math.abs(adjacent - previous) * panelSnap.cellHold) {
        return previous;
      }
    }
    return next;
  }
  const snapped = gridCoordinate(value, previous, step);
  if (snapped === previous && previous >= min && previous <= max) {
    // Preserve an untouched legacy axis, including its original 2px precision.
    return previous;
  }
  const first = Math.ceil(min / step) * step;
  const last = Math.floor(max / step) * step;
  if (first > last) {
    // A locked legacy dimension may have no compatible stop. Do not alter it.
    return previous;
  }
  return Math.max(first, Math.min(last, snapped));
}

function exchangeSlots(layout: Layout[], source: KpiPosition, target: KpiPosition) {
  const moving = layout.find((item) => item.i === source.i)!;
  const neighbour = layout.find((item) => item.i === target.i)!;
  Object.assign(moving, { x: target.x, y: target.y });
  Object.assign(neighbour, { x: source.x, y: source.y });

  // Swapping unequal widths at literal left coordinates creates an overlap, even
  // in a simple KPI row. Preserve the occupied span and its intentional gaps by
  // exchanging the two extents and shifting only the intervening aligned tiles.
  const axis =
    source.y === target.y && source.h === target.h
      ? 'x'
      : source.x === target.x && source.w === target.w
        ? 'y'
        : undefined;
  if (!axis) {
    return;
  }
  const size = axis === 'x' ? 'w' : 'h';
  const cross = axis === 'x' ? 'y' : 'x';
  const forward = source[axis] < target[axis];
  const difference = target[size] - source[size];
  moving[axis] = target[axis] + (forward ? difference : 0);
  neighbour[axis] = source[axis] + (forward ? 0 : -difference);
  for (const item of layout) {
    if (
      item.i !== source.i &&
      item.i !== target.i &&
      item[cross] === source[cross] &&
      item[axis] > Math.min(source[axis], target[axis]) &&
      item[axis] < Math.max(source[axis], target[axis])
    ) {
      item[axis] += forward ? difference : -difference;
    }
  }
}

// RGL 1.4.4 exports these helpers from index.js; its installed declaration omits them.
interface NativeGridHelpers {
  utils: {
    compact: (layout: Layout[], type: null, cols: number) => Layout[];
    correctBounds: (layout: Layout[], bounds: { cols: number }) => Layout[];
    sortLayoutItems: (layout: Layout[], type: 'vertical') => Layout[];
    moveElement: (
      layout: Layout[],
      item: Layout,
      x: number,
      y: number,
      user: boolean,
      prevent: boolean,
      type: null,
      cols: number
    ) => Layout[];
  };
  calculateUtils: {
    calcXY: (
      geometry: {
        cols: number;
        margin: number[];
        containerPadding: number[];
        containerWidth: number;
        rowHeight: number;
        maxRows: number;
      },
      top: number,
      left: number,
      w: number,
      h: number
    ) => { x: number; y: number };
  };
}

function hasNativeGridHelpers(value: unknown): value is NativeGridHelpers {
  if (typeof value !== 'function' || !('utils' in value) || !('calculateUtils' in value)) {
    return false;
  }
  const utils = value.utils,
    calculate = value.calculateUtils;
  return (
    utils !== null &&
    typeof utils === 'object' &&
    'compact' in utils &&
    typeof utils.compact === 'function' &&
    'correctBounds' in utils &&
    typeof utils.correctBounds === 'function' &&
    'sortLayoutItems' in utils &&
    typeof utils.sortLayoutItems === 'function' &&
    'moveElement' in utils &&
    typeof utils.moveElement === 'function' &&
    calculate !== null &&
    typeof calculate === 'object' &&
    'calcXY' in calculate &&
    typeof calculate.calcXY === 'function'
  );
}
if (!hasNativeGridHelpers(GridLayout)) {
  throw new Error('Expected native grid layout helpers');
}
const native: NativeGridHelpers = GridLayout;

export function snapPanelPosition(
  _origin: KpiPosition[],
  source: KpiPosition,
  delta: { x: number; y: number },
  geometry: { width: number; gap: number; rowPitch: number; rowAnchors?: readonly number[] },
  previousPosition?: { x: number; y: number }
) {
  const pitch = panelColumnPitch(geometry.width, geometry.gap);
  return {
    x: Math.max(
      0,
      Math.min(48 - source.w, gridCoordinate(source.x + delta.x / pitch, previousPosition?.x ?? source.x))
    ),
    y: Math.max(
      0,
      boundedGridEdge(
        source.y + delta.y / geometry.rowPitch,
        previousPosition?.y ?? source.y,
        interactionRowStep(geometry.rowPitch),
        0,
        Infinity,
        geometry.rowAnchors
      )
    ),
  };
}

/** Wall owns attraction/drop ordering; native RGL keeps cell rounding and collision resolution. */
export function panelMovePreview(
  origin: KpiPosition[],
  id: string,
  delta: { x: number; y: number },
  geometry: { width: number; gap: number; rowPitch: number; rowAnchors?: readonly number[] },
  previousTarget?: string,
  previousPosition?: { x: number; y: number }
) {
  const source = origin.find((item) => item.i === id)!;
  const position = snapPanelPosition(origin, source, delta, geometry, previousPosition);
  const layout: Layout[] = origin.map((item) => ({ ...item, moved: false }));
  const moving = layout.find((item) => item.i === id)!;
  if (position.x === source.x && position.y === source.y) {
    return { layout, target: undefined };
  }
  const overlaps = origin
    .filter((item) => item.i !== id)
    .map((item) => {
      const overlapX = Math.max(0, Math.min(position.x + source.w, item.x + item.w) - Math.max(position.x, item.x));
      const overlapY = Math.max(0, Math.min(position.y + source.h, item.y + item.h) - Math.max(position.y, item.y));
      return { item, overlap: (overlapX * overlapY) / Math.min(source.w * source.h, item.w * item.h) };
    });
  const candidates = overlaps.filter(
    ({ item, overlap }) => overlap >= (item.i === previousTarget ? panelSnap.swapReleaseOverlap : panelSnap.swapOverlap)
  );
  candidates.sort(
    (a, b) =>
      b.overlap - a.overlap || Math.abs(position.y - a.item.y) - Math.abs(position.y - b.item.y) || a.item.x - b.item.x
  );
  const previous = candidates.find(({ item }) => item.i === previousTarget);
  const target =
    previous && candidates[0].overlap - previous.overlap <= panelSnap.targetSwitchMargin
      ? previous.item
      : candidates[0]?.item;
  if (!target && overlaps.some(({ overlap }) => overlap > 0)) {
    // The grabbed card follows the pointer in native pixels. Keep its drop slot and
    // neighbours still until swap intent is established; speculative push followed
    // by swap otherwise animates the neighbour down and immediately back up.
    return { layout, target: undefined };
  }
  if (target) {
    exchangeSlots(layout, source, target);
  } else {
    // Recompute from the gesture origin, never from an already-pushed preview.
    native.utils.moveElement(layout, moving, position.x, position.y, true, false, null, 48);
  }
  return {
    layout: native.utils.compact(
      native.utils.sortLayoutItems(native.utils.correctBounds(layout, { cols: 48 }), 'vertical'),
      null,
      48
    ),
    target: target?.i,
  };
}

export function selectionBounds(items: KpiPosition[]): KpiPosition {
  const x = Math.min(...items.map((item) => item.x));
  const y = Math.min(...items.map((item) => item.y));
  return {
    i: '@wall-selection',
    x,
    y,
    w: Math.max(...items.map((item) => item.x + item.w)) - x,
    h: Math.max(...items.map((item) => item.y + item.h)) - y,
  };
}

/** Translate members together, reserving their actual footprints (not gaps in the hull). */
export function panelGroupMovePreview(
  origin: KpiPosition[],
  ids: string[],
  delta: { x: number; y: number },
  geometry: { width: number; gap: number; rowPitch: number; rowAnchors?: readonly number[] },
  previousPosition?: { x: number; y: number }
) {
  const members = origin.filter((item) => ids.includes(item.i));
  const hull = selectionBounds(members);
  const position = snapPanelPosition(
    origin.filter((item) => !ids.includes(item.i)),
    hull,
    delta,
    geometry,
    previousPosition
  );
  const dx = position.x - hull.x;
  const dy = position.y - hull.y;
  const layout: Layout[] = origin.map((item) =>
    ids.includes(item.i) ? { ...item, x: item.x + dx, y: item.y + dy, static: true } : { ...item, moved: false }
  );
  return {
    layout: native.utils
      .compact(native.utils.sortLayoutItems(layout, 'vertical'), null, 48)
      .map(({ i, x, y, w, h }) => ({ i, x, y, w, h })),
    position,
    bounds: { ...hull, ...position },
    target: undefined,
  };
}

/** Keep the grabbed Resize anchor fixed; only neighbours yield to its new footprint.
 * A transient native static item gives RGL collision priority without persisting locks.
 * Rebuild from the gesture origin so shrinking restores previously displaced tiles.
 */
export function panelResizePreview(origin: KpiPosition[], item: KpiPosition, west: boolean) {
  const source = origin.find((entry) => entry.i === item.i)!;
  const w = Math.max(1, Math.min(item.w, west ? source.x + source.w : 48 - source.x));
  const layout: Layout[] = origin.map((entry) =>
    entry.i === item.i
      ? { ...entry, x: west ? source.x + source.w - w : source.x, w, h: item.h, static: true }
      : { ...entry, moved: false }
  );
  return native.utils
    .compact(native.utils.sortLayoutItems(layout, 'vertical'), null, 48)
    .map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));
}

/** Grid Resize uses pointer pixels, never the already-rounded native size.
 * Preserve the opposite corner and native min/max constraints. */
export function snapPanelResize(
  origin: KpiPosition[],
  source: KpiPosition,
  delta: { x: number; y: number },
  geometry: { width: number; gap: number; rowPitch: number; gapY: number; rowAnchors?: readonly number[] },
  west: boolean,
  limits: { minW?: number; maxW?: number; minH?: number; maxH?: number },
  previous?: KpiPosition
): KpiPosition {
  const pitch = panelColumnPitch(geometry.width, geometry.gap);
  const edge = west ? source.x : source.x + source.w;
  const rawX = edge + delta.x / pitch;
  const rawY = source.y + source.h + delta.y / geometry.rowPitch;
  const minW = limits.minW ?? 1;
  const maxW = Math.min(limits.maxW ?? 48, west ? source.x + source.w : 48 - source.x);
  const minH = limits.minH ?? 1;
  const maxH = limits.maxH ?? Infinity;
  const x = boundedGridEdge(
    rawX,
    previous ? (west ? previous.x : previous.x + previous.w) : edge,
    1,
    west ? source.x + source.w - maxW : source.x + minW,
    west ? source.x + source.w - minW : source.x + maxW
  );
  const y = boundedGridEdge(
    rawY,
    previous ? previous.y + previous.h : source.y + source.h,
    interactionRowStep(geometry.rowPitch),
    source.y + minH,
    source.y + maxH,
    geometry.rowAnchors ?? panelRowAnchors(origin)
  );
  const w = west ? source.x + source.w - x : x - source.x;
  return {
    ...source,
    x: west ? source.x + source.w - w : source.x,
    w,
    h: y - source.y,
  };
}

export interface AlignmentGuide {
  axis: 'x' | 'y';
  at: number;
  start: number;
  end: number;
}
/** Compare actual card edges (Grid cells contain trailing gutters). */
export function panelAlignmentGuides(
  position: KpiPosition,
  neighbours: KpiPosition[],
  pitch: number,
  rowPitch: number,
  gapX: number,
  gapY: number
): AlignmentGuide[] {
  const rect = (p: KpiPosition) => {
    const box = panelPixelRect(p, { width: pitch * kpiGrid.columns - gapX, rowPitch, gapX, gapY });
    return { left: box.left, right: box.left + box.width, top: box.top, bottom: box.top + box.height };
  };
  const a = rect(position);
  const guides = new Map<string, AlignmentGuide>();
  for (const item of neighbours.filter((item) => item.i !== position.i)) {
    const b = rect(item);
    for (const axis of ['x', 'y'] as const) {
      const separation =
        axis === 'x' ? Math.max(a.top - b.bottom, b.top - a.bottom) : Math.max(a.left - b.right, b.left - a.right);
      if (separation > panelSnap.guideReach) {
        continue;
      }
      const edges = axis === 'x' ? [a.left, a.right] : [a.top, a.bottom];
      const targets = axis === 'x' ? [b.left, b.right] : [b.top, b.bottom];
      for (const at of edges) {
        if (!targets.some((target) => Math.abs(at - target) < 0.5)) {
          continue;
        }
        const start = axis === 'x' ? Math.min(a.top, b.top) : Math.min(a.left, b.left);
        const end = axis === 'x' ? Math.max(a.bottom, b.bottom) : Math.max(a.right, b.right);
        const key = `${axis}:${at}`;
        const old = guides.get(key);
        guides.set(key, { axis, at, start: Math.min(start, old?.start ?? start), end: Math.max(end, old?.end ?? end) });
      }
    }
  }
  return [...guides.values()];
}
