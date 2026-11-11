// Local shadcn-style composition of the installed Base UI Dialog primitive (MIT).
// Uses the same source license and Wall tokens as ./tabs.tsx and ./SHADCN-LICENSE.txt.
import { Dialog as Primitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { useRef, type ReactNode } from 'react';

import { useTheme2 } from '@grafana/ui';

import { wallModalVariables } from '../../modals/modalTokens';
import { wallSurfaceVariables, wallStudioVariables } from '../../surfaceTokens';
import { wallTypographyVariables, wallEditorTypographyVariables } from '../../typography';
import { Button } from '../../ui';

export function Dialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  const theme = useTheme2();
  // This dialog is opened programmatically, without a Dialog.Trigger. Keep its return target
  // explicit even when the picker owner unmounts the whole dialog in onOpenChange.
  const returnFocus = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      <Primitive.Portal>
        <Primitive.Backdrop
          className="wall-modern wall-dialog-backdrop wall-modal-backdrop"
          style={{ ...wallModalVariables(theme.isDark), zIndex: theme.zIndex.modalBackdrop }}
        />
        <Primitive.Viewport
          className="wall-dialog-viewport"
          style={{ ...wallModalVariables(theme.isDark), zIndex: theme.zIndex.modal }}
        >
          <Primitive.Popup
            finalFocus={returnFocus}
            className="wall-modern wall-modal wall-studio-dialog"
            data-wall-theme={theme.isDark ? 'dark' : 'light'}
            data-wall-typography="storage-vm"
            style={{
              ...wallTypographyVariables,
              ...wallEditorTypographyVariables,
              ...wallStudioVariables,
              ...wallSurfaceVariables(theme.isDark, true),
              ...wallModalVariables(theme.isDark),
            }}
          >
            <header className="wall-dialog-header wall-modal-header">
              <div className="wall-modal-heading">
                <Primitive.Title>{title}</Primitive.Title>
              </div>
              <Primitive.Close
                render={<Button className="wall-modal-close" variant="ghost" size="icon" />}
                aria-label="닫기"
              >
                <X size={16} />
              </Primitive.Close>
            </header>
            {children}
          </Primitive.Popup>
        </Primitive.Viewport>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
