import { isEqual } from 'lodash';

import { KpiPosition, sameKpiLayout } from './kpiLayout';

/** Wall presentation metadata. Native 24-column gridPos and panel configuration stay untouched. */
export interface WallDocument {
  version: 1;
  panelSources?: Record<number, number>;
  layouts: Record<string, KpiPosition[]>;
  texts: Record<string, { title: string; description: string }>;
}
export function wallDocument(value: unknown): WallDocument | undefined {
  return isWallDocument(value) ? value : undefined;
}
// Validate the native envelope here; individual regions retain their existing layout validation.
function isWallDocument(value: unknown): value is WallDocument {
  return (
    value !== null &&
    typeof value === 'object' &&
    'version' in value &&
    value.version === 1 &&
    'layouts' in value &&
    Boolean(value.layouts) &&
    typeof value.layouts === 'object' &&
    'texts' in value &&
    Boolean(value.texts) &&
    typeof value.texts === 'object'
  );
}

export const wallRegionKey = (key: string) => key.replace(/^wall-modern:kpi-layout:v1:[^:]+:[^:]+:[^:]+/, '') || 'kpi';

/** Native removal must also remove the deleted ID's presentation, never its neighbours. */
export function removeWallPanel(document: WallDocument, id: number): WallDocument {
  const panelSources = { ...document.panelSources };
  delete panelSources[id];
  const next: WallDocument = {
    ...document,
    layouts: Object.fromEntries(
      Object.entries(document.layouts).map(([key, items]) => [key, items.filter((item) => item.i !== String(id))])
    ),
    panelSources,
  };
  if (!Object.keys(panelSources).length) {
    delete next.panelSources;
  }
  return next;
}

/** Empty transactions / Undo to the saved baseline must not manufacture metadata dirtiness. */
export function normalizeWallDocument(next: WallDocument, saved: WallDocument | undefined, defaults: WallDocument) {
  const layoutsChanged = Object.entries(next.layouts).some(([key, value]) => {
    const baseline = saved?.layouts[key] ?? defaults.layouts[key];
    // RGL item order and transient flags are not persisted geometry. Match the
    // Grid's own dirty/Undo comparison rather than comparing native objects.
    return !baseline || !sameKpiLayout(value, baseline);
  });
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
