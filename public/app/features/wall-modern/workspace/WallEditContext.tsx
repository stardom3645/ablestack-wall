import { createContext, ReactNode, useContext, useEffect, useRef } from 'react';

import { contextSrv } from 'app/core/services/context_srv';
import { getDashboardChangesFromScene } from 'app/features/dashboard-scene/saving/getDashboardChangesFromScene';
import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';

import { WallLayoutHistoryControls } from '../toolbar/WallLayoutHistoryControls';
import { Button } from '../ui';

import { useLayoutHistory } from './LayoutHistoryContext';
import { PanelClipboardProvider } from './PanelClipboardContext';
import { canAdjustKpiLayout, KpiPosition } from './kpiLayout';
import { wallDocument, WallDocument, wallRegionKey, normalizeWallDocument } from './wallDocument';

type Text = WallDocument['texts'][string];
interface Editing {
  readOnly: boolean;
  kiosk: boolean;
  begin: () => void;
  layoutReadOnly: boolean;
  revision: string;
  saved: (key: string, fallback: KpiPosition[]) => KpiPosition[];
  draft: (key: string) => KpiPosition[] | undefined;
  update: (key: string, items: KpiPosition[]) => void;
  text: (key: string, fallback: Text) => Text;
  updateText: (key: string, text: Text) => void;
}
const Context = createContext<Editing | undefined>(undefined);
export const useWallEditing = () => useContext(Context);

/** One Scene-owned document across all tabs, native editors and kiosk visibility changes. */
export function WallEditingProvider({ dashboard, children }: { dashboard: DashboardScene; children: ReactNode }) {
  const state = dashboard.useState();
  const history = useLayoutHistory();
  const defaults = useRef<WallDocument>({ version: 1, layouts: {}, texts: {} });
  const legacyLayouts = useRef(new Set<string>());
  const initial = () => wallDocument((dashboard.getInitialSaveModel() as { wallModern?: unknown })?.wallModern);
  const readOnly = Boolean(state.kioskMode) || !dashboard.canEditDashboard();
  const updateDocument = (next: WallDocument) => {
    if (readOnly) {
      return;
    }
    dashboard.onEnterEditMode(); // Native change tracking / unsaved prompt, without switching the Wall renderer.
    dashboard.setState({ wallModern: normalizeWallDocument(next, initial(), defaults.current) });
    dashboard.setState({ isDirty: getDashboardChangesFromScene(dashboard).hasChanges });
  };
  const current = () => state.wallModern ?? initial() ?? { version: 1 as const, layouts: {}, texts: {} };
  useEffect(() => {
    history?.clearAll();
  }, [state.version, history]);
  useEffect(() => {
    if (!state.isEditing) {
      history?.clearAll();
    }
  }, [state.isEditing, history]);
  const value: Editing = {
    readOnly,
    kiosk: Boolean(state.kioskMode),
    begin: () => {
      if (!readOnly) {
        dashboard.onEnterEditMode();
      }
    },
    layoutReadOnly: readOnly || !canAdjustKpiLayout(contextSrv.user, dashboard.canEditDashboard()),
    revision: `${state.version}:${state.isEditing}:${JSON.stringify(state.wallModern)}`,
    saved(key, fallback) {
      const region = wallRegionKey(key);
      if (!defaults.current.layouts[region]) {
        let legacy;
        try {
          legacy = JSON.parse(localStorage.getItem(key) ?? 'null')?.items;
        } catch {
          /* optional migration */
        }
        if (legacy) {
          legacyLayouts.current.add(region);
        }
        defaults.current.layouts[region] = initial()?.layouts[region] ?? legacy ?? fallback;
      }
      // Data arrives after the first Grid measurement. Let untouched defaults
      // follow content height, while every user/saved/legacy/Undo baseline stays fixed.
      if (
        !initial()?.layouts[region] &&
        !state.wallModern?.layouts[region] &&
        !legacyLayouts.current.has(region) &&
        !history?.getBaseline(key) &&
        !history?.getSnapshot().blocked
      ) {
        defaults.current.layouts[region] = fallback;
      }
      return initial()?.layouts[region] ?? defaults.current.layouts[region];
    },
    draft: (key) => state.wallModern?.layouts[wallRegionKey(key)],
    update(key, items) {
      const doc = current();
      updateDocument({
        ...doc,
        layouts: { ...defaults.current.layouts, ...doc.layouts, [wallRegionKey(key)]: items },
        texts: { ...defaults.current.texts, ...doc.texts },
      });
    },
    text(key, fallback) {
      const region = wallRegionKey(key);
      defaults.current.texts[region] ??= initial()?.texts[region] ?? fallback;
      return state.wallModern?.texts[region] ?? initial()?.texts[region] ?? defaults.current.texts[region];
    },
    updateText(key, text) {
      const doc = current();
      updateDocument({
        ...doc,
        layouts: { ...defaults.current.layouts, ...doc.layouts },
        texts: { ...defaults.current.texts, ...doc.texts, [wallRegionKey(key)]: text },
      });
    },
  };
  return (
    <Context.Provider value={value}>
      <PanelClipboardProvider
        dashboard={dashboard}
        enabled={!readOnly}
        getDocument={() => ({
          ...current(),
          layouts: { ...defaults.current.layouts, ...current().layouts },
          texts: { ...defaults.current.texts, ...current().texts },
        })}
      >
        {children}
        {state.isDirty && !readOnly && !state.editPanel && !state.editview && (
          <div className="wall-document-savebar" role="group" aria-label="대시보드 변경 사항">
            <span title="저장하지 않은 대시보드 변경 사항">변경 사항</span>
            <WallLayoutHistoryControls />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                dashboard.exitEditMode({ skipConfirm: true, restoreInitialState: true });
                history?.clearAll();
              }}
            >
              변경 취소
            </Button>
            <Button size="sm" onClick={() => dashboard.openSaveDrawer({})}>
              변경 사항 저장
            </Button>
          </div>
        )}
      </PanelClipboardProvider>
    </Context.Provider>
  );
}
