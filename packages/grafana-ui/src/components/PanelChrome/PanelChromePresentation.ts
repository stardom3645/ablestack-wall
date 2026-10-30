import { createContext, ReactElement, ReactNode } from 'react';

/** Optional application-owned display slots. Native panel actions and rendering remain the owners. */
export interface PanelChromePresentation {
  headerHeight: number;
  contentPadding?: { horizontal: number; vertical: number };
  hideMenu?: boolean;
  renderHeader: (props: { title: ReactNode; titleId: string; children: ReactNode }) => ReactNode;
  renderMenuButton?: (props: { title?: string; testId: string; className?: string }) => ReactElement;
}

export const PanelChromePresentationContext = createContext<PanelChromePresentation | undefined>(undefined);
