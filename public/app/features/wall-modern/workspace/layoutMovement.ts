import GridLayout, { Layout } from 'react-grid-layout';

import { KpiPosition, panelSnap } from './kpiLayout';

/** Every grid stop is magnetic. The small cell-relative dead band avoids jitter,
 * without allowing a distant neighbour to capture several intervening cells. */
export function gridCoordinate(value: number, previous: number, step = 1) {
  return Math.abs(value - previous) <= step * panelSnap.cellHold ? previous : Math.round(value / step) * step;
}

export function interactionRowStep(rowPitch: number) {
  return rowPitch < 6 ? Math.max(1, Math.round(panelSnap.rowPixels / rowPitch)) : 1;
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
const native = GridLayout as unknown as {
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
};

export function snapPanelPosition(
  _origin: KpiPosition[],
  source: KpiPosition,
  delta: { x: number; y: number },
  geometry: { width: number; gap: number; rowPitch: number },
  previousPosition?: { x: number; y: number }
) {
  const pitch = (geometry.width + geometry.gap) / 48;
  return {
    x: Math.max(
      0,
      Math.min(48 - source.w, gridCoordinate(source.x + delta.x / pitch, previousPosition?.x ?? source.x))
    ),
    y: Math.max(
      0,
      gridCoordinate(
        source.y + delta.y / geometry.rowPitch,
        previousPosition?.y ?? source.y,
        interactionRowStep(geometry.rowPitch)
      )
    ),
  };
}

/** Wall owns attraction/drop ordering; native RGL keeps cell rounding and collision resolution. */
export function panelMovePreview(
  origin: KpiPosition[],
  id: string,
  delta: { x: number; y: number },
  geometry: { width: number; gap: number; rowPitch: number },
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
  geometry: { width: number; gap: number; rowPitch: number },
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
  _origin: KpiPosition[],
  source: KpiPosition,
  delta: { x: number; y: number },
  geometry: { width: number; gap: number; rowPitch: number; gapY: number },
  west: boolean,
  limits: { minW?: number; maxW?: number; minH?: number; maxH?: number },
  previous?: KpiPosition
): KpiPosition {
  const pitch = (geometry.width + geometry.gap) / 48;
  const edge = west ? source.x : source.x + source.w;
  const rawX = edge + delta.x / pitch;
  const rawY = source.y + source.h + delta.y / geometry.rowPitch;
  const minW = limits.minW ?? 1;
  const maxW = Math.min(limits.maxW ?? 48, west ? source.x + source.w : 48 - source.x);
  const minH = limits.minH ?? 1;
  const maxH = limits.maxH ?? Infinity;
  const x = gridCoordinate(rawX, previous ? (west ? previous.x : previous.x + previous.w) : edge);
  const y = gridCoordinate(
    rawY,
    previous ? previous.y + previous.h : source.y + source.h,
    interactionRowStep(geometry.rowPitch)
  );
  const w = Math.max(minW, Math.min(maxW, west ? source.x + source.w - x : x - source.x));
  return {
    ...source,
    x: west ? source.x + source.w - w : source.x,
    w,
    h: Math.max(minH, Math.min(maxH, y - source.y)),
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
  const rect = (p: KpiPosition) => ({
    left: p.x * pitch,
    right: (p.x + p.w) * pitch - gapX,
    top: p.y * rowPitch,
    bottom: (p.y + p.h) * rowPitch - gapY,
  });
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
