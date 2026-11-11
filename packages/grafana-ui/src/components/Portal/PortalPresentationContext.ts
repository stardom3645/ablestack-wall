import type { CSSObject } from '@emotion/react';
import { createContext } from 'react';

/** Opt-in presentation for dialogs and menus survives portals; other callers retain native styling. */
export const PortalPresentationContext = createContext<CSSObject | undefined>(undefined);
