import { createContext, type CSSProperties, type ComponentType } from 'react';

/** Application presentation only: Modal retains its dismissal, focus and overlay contract. */
export interface ModalPresentation {
  className: string;
  style: CSSProperties;
  CloseButton: ComponentType<{ onClick?: () => void; 'aria-label': string; 'data-testid'?: string }>;
}

export const ModalPresentationContext = createContext<ModalPresentation | undefined>(undefined);
