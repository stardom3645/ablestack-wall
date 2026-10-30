import { isEqual } from 'lodash';

import { KpiPosition } from './kpiLayout';

/** Wall presentation metadata. Native 24-column gridPos and panel configuration stay untouched. */
export interface WallDocument {
  version: 1;
  panelSources?: Record<number, number>;
  layouts: Record<string, KpiPosition[]>;
  texts: Record<string, { title: string; description: string }>;
}
export function wallDocument(value: unknown): WallDocument | undefined {
  const doc = value as WallDocument | undefined;
  return doc?.version === 1 &&
    doc.layouts &&
    typeof doc.layouts === 'object' &&
    doc.texts &&
    typeof doc.texts === 'object'
    ? doc
    : undefined;
}
export const wallRegionKey = (key: string) => key.replace(/^wall-modern:kpi-layout:v1:[^:]+:[^:]+:[^:]+/, '') || 'kpi';

/** Empty transactions / Undo to the saved baseline must not manufacture metadata dirtiness. */
export function normalizeWallDocument(next: WallDocument, saved: WallDocument | undefined, defaults: WallDocument) {
  const layoutsChanged = Object.entries(next.layouts).some(
    ([key, value]) => !isEqual(value, saved?.layouts[key] ?? defaults.layouts[key])
  );
  const textsChanged = Object.entries(next.texts).some(
    ([key, value]) => !isEqual(value, saved?.texts[key] ?? defaults.texts[key])
  );
  const sourcesChanged = !isEqual(next.panelSources ?? {}, saved?.panelSources ?? defaults.panelSources ?? {});
  return layoutsChanged || textsChanged || sourcesChanged ? next : saved;
}

/** Native add/remove actions keep existing Wall positions; only new IDs receive a native-size seed. */
export function reconcileWallLayout(
  items: KpiPosition[],
  panels: Array<{ id: number; width: number; height: number }>,
  rowPitch: number,
  gapY: number
): KpiPosition[] {
  const ids = new Set(panels.map((panel) => String(panel.id)));
  const result = items.filter((item) => ids.has(item.i));
  let bottom = Math.max(0, ...result.map((item) => item.y + item.h));
  for (const panel of panels) {
    if (!result.some((item) => item.i === String(panel.id))) {
      const h = Math.max(12, Math.ceil((panel.height * 30 + gapY) / rowPitch));
      result.push({ i: String(panel.id), x: 0, y: bottom, w: Math.min(48, Math.max(4, panel.width * 2)), h });
      bottom += h;
    }
  }
  return result;
}
