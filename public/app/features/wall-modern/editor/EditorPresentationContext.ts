import { createContext, type ReactNode } from 'react';

/** Opt-in presentation only. Native Scenes remain the editing model. */
export const editorPresentationContext = createContext(false);

/** Which property surface is visible; editing state still belongs to the native pane. */
export const editorInspectorContext = createContext<'visual' | 'panel' | undefined>(undefined);

/** One live preview tree, shared controls and workspace expansion without remounting the chart. */
export const studioPreviewContext = createContext<
  | {
      controls?: ReactNode;
      resultStatus?: ReactNode;
      expanded: boolean;
      onToggleExpand: () => void;
    }
  | undefined
>(undefined);

/** Stable DOM slots for native controls; no query state or serialized data lives here. */
export const queryAdvancedSlotContext = createContext<{ host: HTMLElement | null; active: boolean } | undefined>(
  undefined
);
export const queryWorkspaceViewContext = createContext<
  { expanded: boolean; onToggleExpand: () => void; request?: { refId: string } } | undefined
>(undefined);

/** Optional host UI composition passed to native code-capable plugins; never serialized. */
export interface WallCodeQueryPresentation {
  codeHeight: number;
  options: (children: ReactNode) => ReactNode;
  actions: (onRun: () => void, loading: boolean) => ReactNode;
}
