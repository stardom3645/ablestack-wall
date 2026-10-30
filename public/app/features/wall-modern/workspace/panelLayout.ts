import { KpiPosition, kpiGrid } from './kpiLayout';

export interface PanelGeometry {
  id: string;
  x: number;
  w: number;
  row: number;
  height: number;
}

/** Reflow the existing CSS rows when native content reports its natural height. */
export function projectPanelLayout(
  geometry: PanelGeometry[],
  heights: Record<number, number>,
  gapY: number
): KpiPosition[] {
  const result: KpiPosition[] = [];
  let y = 0;
  for (const row of [...new Set(geometry.map((item) => item.row))].sort((a, b) => a - b)) {
    const items = geometry.filter((item) => item.row === row);
    const projected = items.map((item) => ({
      i: item.id,
      x: item.x,
      w: item.w,
      y,
      h: Math.max(12, Math.ceil(((heights[Number(item.id)] ?? item.height) + gapY) / 2)),
    }));
    result.push(...projected);
    y += Math.max(...projected.map((item) => item.h));
  }
  return result;
}

/** All and only this region's IDs; no source model, metadata or field configuration. */
export function validatePanelLayout(value: unknown, ids: string[]): KpiPosition[] | undefined {
  if (!Array.isArray(value) || value.length !== ids.length) {
    return undefined;
  }
  const seen = new Set<string>();
  const items: KpiPosition[] = [];
  for (const item of value) {
    if (
      !item ||
      !ids.includes(item.i) ||
      seen.has(item.i) ||
      !['x', 'y', 'w', 'h'].every((key) => Number.isInteger(item[key])) ||
      item.x < 0 ||
      item.y < 0 ||
      item.y > 10000 ||
      item.w < 4 ||
      item.x + item.w > kpiGrid.columns ||
      item.h < 12 ||
      item.h > 2000
    ) {
      return undefined;
    }
    seen.add(item.i);
    items.push({ i: item.i, x: item.x, y: item.y, w: item.w, h: item.h });
  }
  if (
    items.some((a, i) =>
      items.slice(i + 1).some((b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h)
    )
  ) {
    return undefined;
  }
  return items;
}
