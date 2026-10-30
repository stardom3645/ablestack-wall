import type { Layout } from 'react-grid-layout';

import { wallSurfaceTokens } from '../surfaceTokens';

export const kpiGrid = {
  columns: 48,
  width: 1076,
  rowHeight: 6,
  gap: wallSurfaceTokens.cardGap,
  minHeight: 6,
  maxHeight: 20,
  dragThreshold: 6,
};
// Interaction stops follow visible Grid cells; storage retains its original precision.
export const panelSnap = {
  cellHold: 0.62,
  rowPixels: 12,
  guideReach: 240,
  swapOverlap: 0.35,
  swapReleaseOverlap: 0.2,
  targetSwitchMargin: 0.12,
};
export const kpiIds = ['28', '30', '34', '36'];
export type KpiPosition = Pick<Layout, 'i' | 'x' | 'y' | 'w' | 'h'>;
export const defaultKpiLayout = (): KpiPosition[] =>
  kpiIds.map((i, index) => ({ i, x: index * 12, y: 0, w: 12, h: 6 }));

export function canAdjustKpiLayout(user: { orgRole: string; isGrafanaAdmin: boolean }, canEdit: boolean) {
  return canEdit && (user.orgRole === 'Admin' || user.isGrafanaAdmin);
}

/** Only presentation coordinates are persisted. No scene object or dashboard save model is accepted. */
export function validateKpiLayout(value: unknown): KpiPosition[] | undefined {
  if (!Array.isArray(value) || value.length !== 4) {
    return undefined;
  }
  const ids = new Set();
  const items: KpiPosition[] = [];
  for (const item of value) {
    if (
      !item ||
      !kpiIds.includes(item.i) ||
      ids.has(item.i) ||
      !['x', 'y', 'w', 'h'].every((key) => Number.isInteger(item[key])) ||
      item.x < 0 ||
      item.y < 0 ||
      item.y > 40 ||
      item.w < 8 ||
      item.w > kpiGrid.columns ||
      item.x + item.w > kpiGrid.columns ||
      item.h < kpiGrid.minHeight ||
      item.h > kpiGrid.maxHeight
    ) {
      return undefined;
    }
    ids.add(item.i);
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

export function readKpiLayout(key: string): KpiPosition[] | undefined {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null');
    return value?.version === 1 ? validateKpiLayout(value.items) : undefined;
  } catch {
    return undefined;
  }
}

/** Compare only persisted geometry, independent of engine metadata or item order. */
export function sameKpiLayout(a: KpiPosition[], b: KpiPosition[]) {
  return (
    a.length === b.length &&
    a.every((item) => {
      const other = b.find((candidate) => candidate.i === item.i);
      return other && item.x === other.x && item.y === other.y && item.w === other.w && item.h === other.h;
    })
  );
}
