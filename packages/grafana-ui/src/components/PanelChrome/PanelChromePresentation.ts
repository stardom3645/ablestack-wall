import { createContext, ReactElement, ReactNode, SyntheticEvent } from 'react';

export interface PanelHeaderPresentationProps {
  title: ReactNode;
  titleId: string;
  children: ReactNode;
  dragClass?: string;
  dragClassCancel?: string;
}

/** Optional application-owned display slots. Native panel actions and rendering remain the owners. */
export interface PanelChromePresentation {
  name?: string;
  headerHeight: number;
  getHeaderHeight?: (size: { width?: number; height?: number }) => number;
  contentPadding?: { horizontal: number; vertical: number };
  /** Let the painted viewport follow its host before measured renderer sizes catch up. */
  fitToContainer?: boolean;
  hideMenu?: boolean;
  renderHeader: (props: PanelHeaderPresentationProps) => ReactNode;
  renderHoverHeader?: (props: PanelHeaderPresentationProps) => ReactNode;
  renderStatus?: (props: { message: string; onClick?: (event: SyntheticEvent) => void }) => ReactNode;
  renderContent?: (children: ReactNode) => ReactNode;
  renderMenuButton?: (props: { title?: string; testId: string; className?: string }) => ReactElement;
}

export const PanelChromePresentationContext = createContext<PanelChromePresentation | undefined>(undefined);
