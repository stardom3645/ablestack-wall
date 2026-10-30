import { kpiGrid, KpiPosition } from './kpiLayout';

/** Visible panel border box, excluding the Grid item's trailing card spacing. */
export function panelPixelRect(
  position: KpiPosition,
  geometry: { width: number; gapX: number; gapY: number; rowPitch: number }
) {
  const pitch = (geometry.width + geometry.gapX) / kpiGrid.columns;
  return {
    left: Math.round(position.x * pitch),
    top: position.y * geometry.rowPitch,
    width: Math.round(position.w * pitch) - geometry.gapX,
    height: position.h * geometry.rowPitch - geometry.gapY,
  };
}
