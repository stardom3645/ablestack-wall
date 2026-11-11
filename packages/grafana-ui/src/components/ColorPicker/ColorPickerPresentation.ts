import { createContext, ReactNode } from 'react';

/** Optional application-owned presentation; native picker callbacks and values remain unchanged. */
export const ColorPickerPresentationContext = createContext<
  | {
      render: (props: {
        color: string;
        onChange: (color: string) => void;
        palette: ReactNode;
        spectrum: ReactNode;
        extra: Array<{ id: string; label: string; content: ReactNode }>;
      }) => ReactNode;
    }
  | undefined
>(undefined);
