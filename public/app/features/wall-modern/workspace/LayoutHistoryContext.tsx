import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { createLayoutHistory, LayoutHistory } from './layoutHistory';

const LayoutHistoryContext = createContext<LayoutHistory | undefined>(undefined);
export const useLayoutHistory = () => useContext(LayoutHistoryContext);

export function WallLayoutHistoryProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const [history] = useState(createLayoutHistory);
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.altKey || !(event.metaKey || event.ctrlKey)) {
        return;
      }
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="dialog"],[role="menu"]'
        )
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      const redo =
        (key === 'z' && event.shiftKey) || (key === 'y' && event.ctrlKey && !event.metaKey && !event.shiftKey);
      if (key !== 'z' && !redo) {
        return;
      }
      if (redo ? history.redo() : history.undo()) {
        event.preventDefault();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, [enabled, history]);
  return <LayoutHistoryContext.Provider value={history}>{children}</LayoutHistoryContext.Provider>;
}
