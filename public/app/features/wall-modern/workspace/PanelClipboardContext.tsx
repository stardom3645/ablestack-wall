import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import { AppEvents } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { VizPanel } from '@grafana/scenes';
import appEvents from 'app/core/app_events';
import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';

import { useLayoutHistory } from './LayoutHistoryContext';
import { selectedWorkspaceTab } from './model';
import { ClipboardGrid, CopiedPanel, copyPanelSettings, pastePanelWithHistory } from './panelClipboard';
import { WallDocument } from './wallDocument';

const Context = createContext<
  | {
      enabled: boolean;
      register: (grid: ClipboardGrid) => () => void;
      copy: (panel: VizPanel) => boolean;
      duplicate: (panel: VizPanel) => boolean;
    }
  | undefined
>(undefined);
export const usePanelClipboard = () => useContext(Context);

export function allowsPanelClipboard(event: KeyboardEvent, doc: Document) {
  const target = event.target;
  return (
    !event.defaultPrevented &&
    !event.isComposing &&
    !event.altKey &&
    !event.shiftKey &&
    !event.repeat &&
    (event.ctrlKey || event.metaKey) &&
    target instanceof Element &&
    !target.closest(
      'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="combobox"],[role="dialog"],[role="menu"],.monaco-editor,.cm-editor,.ace_editor'
    ) &&
    !doc.getSelection()?.toString().length &&
    Boolean(target.closest('.wall-dashboard-workspace'))
  );
}

/** Buffer lifetime is this dashboard Scene, not localStorage or the system clipboard. */
export function PanelClipboardProvider({
  dashboard,
  enabled,
  getDocument,
  children,
}: {
  dashboard: DashboardScene;
  enabled: boolean;
  getDocument?: () => WallDocument;
  children?: ReactNode;
}) {
  const buffer = useRef<CopiedPanel>();
  const history = useLayoutHistory();
  const documentRef = useRef(getDocument);
  documentRef.current = getDocument;
  const grids = useRef(new Map<string, ClipboardGrid>());
  const insert = useCallback(
    (copied: CopiedPanel, grid: ClipboardGrid) => {
      const id = pastePanelWithHistory(dashboard, copied, grid, documentRef.current?.(), history);
      if (id !== undefined) {
        requestAnimationFrame(() =>
          grid
            .root()
            ?.querySelector<HTMLElement>(`[data-wall-layout-item="${id}"]`)
            ?.scrollIntoView?.({ block: 'nearest' })
        );
      }
      return id;
    },
    [dashboard, history]
  );
  const value = useMemo(
    () => ({
      enabled,
      register(grid: ClipboardGrid) {
        grids.current.set(grid.key, grid);
        return () => {
          if (grids.current.get(grid.key) === grid) {
            grids.current.delete(grid.key);
          }
        };
      },
      copy(panel: VizPanel) {
        if (!enabled) {
          return false;
        }
        const grid = [...grids.current.values()].find((grid) =>
          grid.positions().some((item) => item.i === panel.state.key?.replace('panel-', ''))
        );
        if (!grid || grid.busy()) {
          return false;
        }
        try {
          buffer.current = copyPanelSettings(dashboard, panel, grid.positions());
          appEvents.emit(AppEvents.alertSuccess, [
            '패널을 복사했습니다. 현재 대시보드의 탭에서 Ctrl/⌘+V로 붙여넣으세요.',
          ]);
          return true;
        } catch (error) {
          appEvents.emit(AppEvents.alertError, ['패널 복사 실패', String(error)]);
          return false;
        }
      },
      duplicate(panel: VizPanel) {
        if (!enabled) {
          return false;
        }
        const grid = [...grids.current.values()].find((grid) =>
          grid.positions().some((item) => item.i === panel.state.key?.replace('panel-', ''))
        );
        if (!grid || grid.busy()) {
          return false;
        }
        try {
          return insert(copyPanelSettings(dashboard, panel, grid.positions()), grid) !== undefined;
        } catch (error) {
          appEvents.emit(AppEvents.alertError, ['패널 복제 실패', String(error)]);
          return false;
        }
      },
    }),
    [dashboard, enabled, insert]
  );
  useEffect(() => {
    buffer.current = undefined;
  }, [dashboard]);
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const keydown = (event: KeyboardEvent) => {
      if (!allowsPanelClipboard(event, document)) {
        return;
      }
      const tab = selectedWorkspaceTab(locationService.getLocation().search);
      const grid = [...grids.current.values()].find((grid) => grid.tab === tab);
      if (!grid || grid.busy()) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'c') {
        const ids = grid.selected();
        const focused = (event.target as Element).closest<HTMLElement>('[data-wall-layout-item]')?.dataset
          .wallLayoutItem;
        const id = ids.length === 1 ? ids[0] : ids.length ? undefined : focused;
        if (!id || Number(id) <= 0 || !grid.root()?.contains(event.target as Node)) {
          return;
        }
        const panel = dashboard.state.body.getVizPanels().find((panel) => panel.state.key === `panel-${id}`);
        if (panel && value.copy(panel)) {
          event.preventDefault();
          event.stopPropagation();
        }
      } else if (key === 'v' && buffer.current && buffer.current.uid === dashboard.state.uid) {
        try {
          const id = insert(buffer.current, grid);
          if (id !== undefined) {
            event.preventDefault();
            event.stopPropagation();
          }
        } catch (error) {
          appEvents.emit(AppEvents.alertError, ['패널 붙여넣기 실패', String(error)]);
        }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, [dashboard, enabled, value, insert]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
