import { kpiGrid, KpiPosition } from './kpiLayout';

/** Existing native/Wall boundaries are exact stops, including pre-12px layouts. */
export function panelRowAnchors(...layouts: KpiPosition[][]) {
  return [...new Set(layouts.flatMap((items) => items.flatMap(({ y, h }) => [y, y + h])))].sort((a, b) => a - b);
}

/** Keep nearby legacy boundaries instead of drawing two almost-identical stops. */
export function panelRowStops(min: number, max: number, step: number, anchors: readonly number[]) {
  const stops = anchors.filter((row) => row >= min && row <= max);
  for (let row = Math.ceil(min / step) * step; row <= max; row += step) {
    if (!anchors.some((anchor) => Math.abs(anchor - row) <= step / 2)) {
      stops.push(row);
    }
  }
  return [...new Set(stops)].sort((a, b) => a - b);
}

export function panelColumnPitch(width: number, gapX: number) {
  return (width + gapX) / kpiGrid.columns;
}

/** Visible panel border box, excluding the Grid item's trailing card spacing. */
export function panelPixelRect(
  position: KpiPosition,
  geometry: { width: number; gapX: number; gapY: number; rowPitch: number }
) {
  const pitch = panelColumnPitch(geometry.width, geometry.gapX);
  return {
    left: Math.round(position.x * pitch),
    top: position.y * geometry.rowPitch,
    width: Math.round(position.w * pitch) - geometry.gapX,
    height: position.h * geometry.rowPitch - geometry.gapY,
  };
}

/** A dot is a reachable moving corner, not the trailing outer-cell gutter.
 * Use the same rounding as RGL/panelPixelRect, relative to the fixed corner. */
export function panelGridPoint(
  column: number,
  row: number,
  geometry: { width: number; gapX: number; gapY: number; rowPitch: number },
  resize?: { anchor: KpiPosition; west?: boolean }
) {
  const pitch = panelColumnPitch(geometry.width, geometry.gapX);
  return {
    x:
      resize && !resize.west
        ? Math.round(resize.anchor.x * pitch) + Math.round((column - resize.anchor.x) * pitch) - geometry.gapX
        : Math.round(column * pitch),
    y: row * geometry.rowPitch - (resize ? geometry.gapY : 0),
  };
}
