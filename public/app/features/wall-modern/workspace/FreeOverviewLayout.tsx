import { ReactNode, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';

import { wallSurfaceTokens } from '../surfaceTokens';
import { displayKinds } from '../visualizations/model';

import { projectOverviewFlow } from './OverviewFlowLayout';
import { PanelLayoutGrid } from './PanelLayoutGrid';
import { useWallTextPanel } from './WallTextPanel';
import { KpiPosition } from './kpiLayout';
import { WorkspacePanel } from './model';
import { validatePanelLayout } from './panelLayout';

import './freeOverview.css';

const textNames = ['resources', 'trends', 'storage', 'services'] as const;
type Item<T> = { kind: 'data'; panel: WorkspacePanel<T> } | { kind: (typeof textNames)[number] };
const native = GridLayout as unknown as {
  utils: { compact: (items: Layout[], type: null, cols: number) => Layout[] };
};

/** Rebase legacy browser regions into one grid, resolving only newly introduced gutters. */
export function projectFreeOverview(
  rects: Array<{ id: string; x: number; y: number; width: number; height: number }>,
  width: number
): KpiPosition[] {
  return native.utils
    .compact(projectOverviewFlow(rects, width), null, 48)
    .map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));
}

/** Legacy regions are measured once for migration; the live overview has one grid and no groups. */
export function FreeOverviewLayout<T>({
  panels,
  storageKey,
  draftCache,
  original,
  renderPanel,
  renderActions,
  requested,
  onModeChange,
}: {
  panels: Array<WorkspacePanel<T>>;
  storageKey?: string;
  draftCache: Map<string, KpiPosition[]>;
  original: ReactNode;
  renderPanel: (panel: WorkspacePanel<T>, fill: boolean) => ReactNode;
  renderActions?: (panel: WorkspacePanel<T>) => ReactNode;
  requested?: boolean;
  onModeChange?: (editing: boolean) => void;
}) {
  const resources = useWallTextPanel('resources', storageKey);
  const trends = useWallTextPanel('trends', storageKey);
  const storage = useWallTextPanel('storage', storageKey);
  const services = useWallTextPanel('services', storageKey);
  const texts = { resources, trends, storage, services };
  const root = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<KpiPosition[]>();
  const items = useMemo<Array<WorkspacePanel<Item<T>>>>(
    () => [
      ...panels.map((panel) => ({ ...panel, model: { kind: 'data' as const, panel } })),
      ...textNames.map((kind, index) => ({
        ...[resources.panels[0], trends.panels[0], storage.panels[0], services.panels[0]][index],
        model: { kind },
      })),
    ],
    [panels, resources.panels, trends.panels, storage.panels, services.panels]
  );
  const ids = items.map((item) => String(item.id)).join(',');
  const validate = useCallback((value: unknown) => validatePanelLayout(value, ids.split(',')), [ids]);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element || profile) {
      return;
    }
    let live = true;
    let frame = 0;
    let previous = '';
    const capture = () => {
      if (!live) {
        return;
      }
      const bounds = element.getBoundingClientRect();
      if (bounds.width < 760) {
        return;
      }
      const rects = items.flatMap((item) => {
        const selector =
          item.model.kind === 'data'
            ? `[data-wall-panel-id="${item.id}"]`
            : `[data-wall-text-panel="${item.model.kind}"]`;
        const node = element.querySelector<HTMLElement>(selector);
        if (!node) {
          return [];
        }
        const rect = node.getBoundingClientRect();
        return [
          {
            id: String(item.id),
            x: rect.left - bounds.left,
            y: rect.top - bounds.top,
            width: rect.width,
            height: rect.height,
          },
        ];
      });
      const signature = JSON.stringify(rects);
      if (rects.length === items.length && rects.every((rect) => rect.height > 0) && signature === previous) {
        const next = projectFreeOverview(rects, bounds.width);
        if (validate(next)) {
          setProfile(next);
          return;
        }
      }
      previous = signature;
      frame = requestAnimationFrame(capture);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(capture);
    };
    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [profile, ids, items, validate]);
  const bounds = useCallback((item: WorkspacePanel<Item<T>>, width: number) => {
    const kind = item.model.kind === 'data' ? displayKinds[item.presentationId ?? item.id] : 'text';
    const minHeight =
      item.type === 'timeseries' ? 160 : kind === 'text' ? 48 : kind === 'usage' ? 64 : kind === 'service' ? 54 : 84;
    return {
      minW: Math.max(4, Math.ceil(((kind === 'text' ? 180 : 120) * 48) / (width + wallSurfaceTokens.cardGap))),
      minH: Math.ceil((minHeight + 12) / 2),
      maxH: 2000,
    };
  }, []);
  const card = (item: WorkspacePanel<Item<T>>, fill: boolean) =>
    item.model.kind === 'data' ? renderPanel(item.model.panel, fill) : texts[item.model.kind].card(fill);
  const fallback = (
    <div className="wall-free-overview-fallback">
      {items.map((item) => (
        <div key={item.id} data-wall-fallback-kind={item.model.kind === 'data' ? 'data' : 'text'}>
          {card(item, false)}
        </div>
      ))}
    </div>
  );
  return (
    <div ref={root} className="wall-free-overview" data-wall-free-layout={Boolean(profile)}>
      {profile ? (
        <PanelLayoutGrid
          panels={items}
          initialLayout={profile}
          validate={validate}
          storageKey={storageKey ? `${storageKey}:tab:overview:free-layout` : undefined}
          draftCache={draftCache}
          readOnly={!storageKey}
          label="개요"
          rowPitch={2}
          gapX={12}
          gapY={12}
          maxWidth={Infinity}
          minimumWidth={760}
          bounds={bounds}
          original={fallback}
          requested={requested}
          onModeChange={onModeChange}
          renderPanel={(item) => card(item, true)}
          renderActions={({ model }) =>
            model.kind === 'data' ? renderActions?.(model.panel) : texts[model.kind].editor()
          }
        />
      ) : (
        original
      )}
    </div>
  );
}
