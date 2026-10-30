import { ReactNode, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { wallSurfaceTokens } from '../surfaceTokens';

import { PanelLayoutGrid } from './PanelLayoutGrid';
import { useWallTextPanel } from './WallTextPanel';
import { KpiPosition } from './kpiLayout';
import { WorkspacePanel } from './model';
import { validatePanelLayout } from './panelLayout';

import './overviewFlow.css';

// Display-only group identity; not a saved Grafana panel ID.
const usageGroupId = -1004;
const gap = wallSurfaceTokens.cardGap;
const rowPitch = 2;
type FlowItem<T> =
  | { kind: 'data'; panel: WorkspacePanel<T> }
  | { kind: 'trends' }
  | { kind: 'storage' }
  | { kind: 'usage' };

/** Preserve the approved DOM geometry, including legacy browser layouts, in one coordinate space. */
export function projectOverviewFlow(
  rects: Array<{ id: string; x: number; y: number; width: number; height: number }>,
  width: number
) {
  const pitch = (width + gap) / 48;
  return rects.map((rect) => {
    const x = Math.max(0, Math.round(rect.x / pitch));
    const end = Math.min(48, Math.round((rect.x + rect.width + gap) / pitch));
    return {
      i: rect.id,
      x,
      y: Math.max(0, Math.round(rect.y / rowPitch)),
      w: Math.max(4, end - x),
      h: Math.max(12, Math.ceil((rect.height + gap) / rowPitch)),
    };
  });
}

/** One native Grid for the overview's text, charts, usage card and storage tiles. */
export function OverviewFlowLayout<T>({
  storageKey,
  draftCache,
  trends,
  storage,
  usage,
  original,
  renderPanel,
  renderActions,
}: {
  storageKey?: string;
  draftCache: Map<string, KpiPosition[]>;
  trends: Array<WorkspacePanel<T>>;
  storage: Array<WorkspacePanel<T>>;
  usage: ReactNode;
  original: ReactNode;
  renderPanel: (panel: WorkspacePanel<T>, fill: boolean) => ReactNode;
  renderActions?: (panel: WorkspacePanel<T>) => ReactNode;
}) {
  const trendText = useWallTextPanel('trends', storageKey);
  const storageText = useWallTextPanel('storage', storageKey);
  const root = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<KpiPosition[]>();
  const panels = useMemo<Array<WorkspacePanel<FlowItem<T>>>>(
    () => [
      { ...trendText.panels[0], model: { kind: 'trends' } },
      ...trends.map((panel) => ({ ...panel, model: { kind: 'data' as const, panel } })),
      {
        id: usageGroupId,
        title: '자원 사용률',
        type: 'wall-usage-group',
        width: 16,
        height: 0,
        model: { kind: 'usage' },
      },
      { ...storageText.panels[0], model: { kind: 'storage' } },
      ...storage.map((panel) => ({ ...panel, model: { kind: 'data' as const, panel } })),
    ],
    [trendText.panels, storageText.panels, trends, storage]
  );
  const ids = panels.map((panel) => String(panel.id)).join(',');
  const validate = useCallback((value: unknown) => validatePanelLayout(value, ids.split(',')), [ids]);
  useLayoutEffect(() => {
    const element = root.current;
    if (!storageKey || !element || profile) {
      return;
    }
    // Nested legacy Grids restore their browser state after mount. Measure after that commit.
    let live = true;
    let frame = 0;
    const capture = () => {
      if (!live) {
        return;
      }
      const bounds = element.getBoundingClientRect();
      if (bounds.width < 760) {
        return;
      }
      const rects = ids.split(',').flatMap((id) => {
        const selector =
          id === String(usageGroupId)
            ? '[data-wall-flow-group="usage"]'
            : id === '-1001'
              ? '[data-wall-text-panel="trends"]'
              : id === '-1002'
                ? '[data-wall-text-panel="storage"]'
                : `[data-wall-panel-id="${id}"]`;
        const node = element.querySelector<HTMLElement>(selector);
        if (!node) {
          return [];
        }
        const rect = node.getBoundingClientRect();
        return [{ id, x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height }];
      });
      const next = projectOverviewFlow(rects, bounds.width);
      if (rects.every((rect) => rect.height > 0) && validate(next)) {
        setProfile(next);
      }
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
  }, [storageKey, profile, ids, validate]);
  const bounds = useCallback(
    (panel: WorkspacePanel<FlowItem<T>>) => {
      const initial = profile!.find((item) => item.i === String(panel.id))!;
      const text = panel.model.kind === 'trends' || panel.model.kind === 'storage';
      return { minW: text ? 12 : 8, minH: text ? 30 : panel.type === 'timeseries' ? 86 : initial.h, maxH: 2000 };
    },
    [profile]
  );
  return (
    <div ref={root} className="wall-overview-flow" data-wall-flow-shared={Boolean(profile)}>
      {profile && storageKey ? (
        <PanelLayoutGrid
          panels={panels}
          initialLayout={profile}
          validate={validate}
          storageKey={`${storageKey}:region:overview:workspace-flow`}
          draftCache={draftCache}
          label="개요 Workspace"
          rowPitch={rowPitch}
          gapX={gap}
          gapY={gap}
          minimumWidth={760}
          maxWidth={Infinity}
          bounds={bounds}
          original={original}
          renderPanel={({ model }) =>
            model.kind === 'trends' ? (
              trendText.card(true)
            ) : model.kind === 'storage' ? (
              storageText.card(true)
            ) : model.kind === 'usage' ? (
              <div className="wall-overview-flow-usage wall-kpi-no-drag">{usage}</div>
            ) : (
              renderPanel(model.panel, true)
            )
          }
          renderActions={({ model }) =>
            model.kind === 'trends'
              ? trendText.editor()
              : model.kind === 'storage'
                ? storageText.editor()
                : model.kind === 'data'
                  ? renderActions?.(model.panel)
                  : null
          }
        />
      ) : (
        original
      )}
    </div>
  );
}
