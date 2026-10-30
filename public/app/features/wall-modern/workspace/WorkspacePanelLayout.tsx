import { ReactNode, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { displayKinds } from '../visualizations/model';

import { PanelLayoutGrid } from './PanelLayoutGrid';
import { useWallEditing } from './WallEditContext';
import { kpiGrid, KpiPosition } from './kpiLayout';
import { WorkspacePanel } from './model';
import { PanelGeometry, projectPanelLayout, validatePanelLayout } from './panelLayout';
import { reconcileWallLayout } from './wallDocument';

interface Profile {
  geometry: PanelGeometry[];
  gapX: number;
  gapY: number;
}

/** Capture the approved CSS layout once, then reuse the native Grid engine for direct manipulation. */
export function WorkspacePanelLayout<T>({
  panels,
  className,
  label,
  storageKey,
  heights,
  draftCache,
  renderPanel,
  renderActions,
}: {
  panels: Array<WorkspacePanel<T>>;
  className: string;
  label: string;
  storageKey?: string;
  heights: Record<number, number>;
  draftCache: Map<string, KpiPosition[]>;
  renderPanel: (panel: WorkspacePanel<T>, fill: boolean) => ReactNode;
  renderActions?: (panel: WorkspacePanel<T>) => ReactNode;
}) {
  const persistence = useWallEditing();
  const region = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<Profile>();
  const idsKey = panels.map((panel) => String(panel.id)).join(',');
  const validate = useCallback((value: unknown) => validatePanelLayout(value, idsKey.split(',')), [idsKey]);
  useLayoutEffect(() => {
    if (!region.current || profile) {
      return;
    }
    const root = region.current;
    const capture = () => {
      const style = getComputedStyle(root);
      const number = (value: string) => parseFloat(value) || 0;
      const paddingLeft = number(style.paddingLeft);
      const paddingRight = number(style.paddingRight);
      const width = root.clientWidth - paddingLeft - paddingRight;
      if (width < 200) {
        return;
      }
      const gapX = number(style.columnGap);
      const gapY = number(style.rowGap);
      const bounds = root.getBoundingClientRect();
      const left = bounds.left + number(style.borderLeftWidth) + paddingLeft;
      const top = bounds.top + number(style.borderTopWidth) + number(style.paddingTop);
      const pitch = (width + gapX) / kpiGrid.columns;
      const geometry = Array.from(root.querySelectorAll<HTMLElement>('[data-wall-panel-id]')).map((card) => {
        const rect = card.getBoundingClientRect();
        const x = Math.max(0, Math.round((rect.left - left) / pitch));
        const end = Math.min(48, Math.round((rect.right - left + gapX) / pitch));
        return {
          id: card.dataset.wallPanelId!,
          x,
          w: Math.max(4, end - x),
          row: Math.round(rect.top - top),
          height: rect.height,
        };
      });
      if (geometry.length === panels.length && geometry.every((item) => item.height > 0)) {
        setProfile({ geometry, gapX, gapY });
      }
    };
    capture();
    const observer = new ResizeObserver(capture);
    observer.observe(root);
    return () => observer.disconnect();
  }, [storageKey, profile, idsKey, panels.length]);

  const initialLayout = useMemo(
    () =>
      profile
        ? reconcileWallLayout(projectPanelLayout(profile.geometry, heights, profile.gapY), panels, 2, profile.gapY)
        : [],
    [profile, heights, panels]
  );
  const constraints = useCallback(
    (panel: WorkspacePanel<T>, width: number) => {
      const initial = initialLayout.find((item) => item.i === String(panel.id)) ?? {
        w: Math.min(48, panel.width * 2),
        h: Math.ceil((panel.height * 30 + (profile?.gapY ?? 0)) / 2),
      };
      const kind = displayKinds[panel.presentationId ?? panel.id];
      const minPixels = panel.type === 'timeseries' ? 220 : kind === 'service' ? 120 : 160;
      const minHeight = panel.type === 'timeseries' ? 160 : kind === 'service' ? 54 : kind === 'usage' ? 64 : 84;
      return {
        minW: Math.max(4, Math.min(initial.w, Math.ceil((minPixels * 48) / (width + (profile?.gapX ?? 0))))),
        minH: Math.max(12, Math.min(initial.h, Math.ceil((minHeight + (profile?.gapY ?? 0)) / 2))),
        maxH: 2000,
      };
    },
    [initialLayout, profile]
  );
  const original = panels.map((panel) => renderPanel(panel, false));
  const managed = Boolean(profile && validate(initialLayout));
  return (
    <div
      ref={region}
      className={className}
      data-wall-layout-region={label}
      data-wall-managed-layout={managed ? '' : undefined}
      style={managed ? { display: 'block' } : undefined}
    >
      {managed ? (
        <PanelLayoutGrid
          panels={panels}
          storageKey={storageKey}
          readOnly={Boolean(persistence?.layoutReadOnly || !storageKey)}
          label={label}
          initialLayout={initialLayout}
          validate={validate}
          original={original}
          renderPanel={(panel) => renderPanel(panel, true)}
          renderActions={renderActions}
          rowPitch={2}
          gapX={profile!.gapX}
          gapY={profile!.gapY}
          minimumWidth={200}
          maxWidth={Infinity}
          bounds={constraints}
          draftCache={draftCache}
        />
      ) : (
        original
      )}
    </div>
  );
}
