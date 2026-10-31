import { createContext } from 'react';

/** Opt-in presentation only. Native Scenes remain the editing model. */
export const editorPresentationContext = createContext(false);

/** Which property surface is visible; editing state still belongs to the native pane. */
export const editorInspectorContext = createContext<'visual' | 'panel' | undefined>(undefined);
