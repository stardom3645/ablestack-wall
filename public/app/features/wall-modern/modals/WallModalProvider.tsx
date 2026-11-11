import { X } from 'lucide-react';
import { useMemo, type PropsWithChildren } from 'react';

import { useTheme2 } from '@grafana/ui';
import { ModalPresentationContext } from '@grafana/ui/src/components/Modal/ModalPresentationContext';

import { wallSurfaceVariables } from '../surfaceTokens';
import { wallEditorTypographyVariables, wallTypographyVariables } from '../typography';
import { Button } from '../ui';

import { wallModalVariables } from './modalTokens';

import '../typography.css';
import '../motion.css';
import './modals.css';

export function WallModalClose(props: { onClick?: () => void; 'aria-label': string; 'data-testid'?: string }) {
  return (
    <Button {...props} className="wall-modal-close" variant="ghost" size="icon">
      <X size={16} />
    </Button>
  );
}

/** Above routing and the event-bus overlays, so settings, plugins and dashboard modals share one frame. */
export function WallModalProvider({ children }: PropsWithChildren) {
  const theme = useTheme2();
  const value = useMemo(
    () => ({
      className: 'wall-modern wall-modal',
      style: {
        ...wallTypographyVariables,
        ...wallEditorTypographyVariables,
        ...wallSurfaceVariables(theme.isDark, true),
        ...wallModalVariables(theme.isDark),
      },
      CloseButton: WallModalClose,
    }),
    [theme.isDark]
  );
  return <ModalPresentationContext.Provider value={value}>{children}</ModalPresentationContext.Provider>;
}
