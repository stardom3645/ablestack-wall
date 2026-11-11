import { createContext } from 'react';

/** Opt-in host for a native Select inside an already-positioned popup. No second portal/scroll lock. */
export const EmbeddedSelectContext = createContext<{ onClose: () => void; maxHeight: number } | undefined>(undefined);
