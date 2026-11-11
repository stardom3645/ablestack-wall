import { css, cx } from '@emotion/css';
import { useDialog } from '@react-aria/dialog';
import { FocusScope } from '@react-aria/focus';
import { OverlayContainer, useOverlay } from '@react-aria/overlays';
import { PropsWithChildren, useContext, useRef } from 'react';
import * as React from 'react';

import { useStyles2 } from '../../themes';
import { IconName } from '../../types';
import { t } from '../../utils/i18n';
import { IconButton } from '../IconButton/IconButton';
import { Stack } from '../Layout/Stack/Stack';
import { PortalPresentationContext } from '../Portal/PortalPresentationContext';

import { ModalHeader } from './ModalHeader';
import { ModalPresentationContext } from './ModalPresentationContext';
import { getModalStyles } from './getModalStyles';

export interface Props {
  /** @deprecated no longer used */
  icon?: IconName;
  /** @deprecated no longer used */
  iconTooltip?: string;
  /** Title for the modal or custom header element */
  title: string | JSX.Element;
  className?: string;
  contentClassName?: string;
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  trapFocus?: boolean;

  isOpen?: boolean;
  onDismiss?: () => void;

  /** If not set will call onDismiss if that is set. */
  onClickBackdrop?: () => void;
}

export function Modal(props: PropsWithChildren<Props>) {
  const {
    title,
    children,
    isOpen = false,
    closeOnEscape = true,
    closeOnBackdropClick = true,
    className,
    contentClassName,
    onDismiss,
    onClickBackdrop,
    trapFocus = true,
  } = props;
  const presentation = useContext(PortalPresentationContext);
  const modalPresentation = useContext(ModalPresentationContext);
  const styles = useStyles2(getModalStyles);

  const ref = useRef<HTMLDivElement>(null);

  // Handle interacting outside the dialog and pressing
  // the Escape key to close the modal.
  const { overlayProps, underlayProps } = useOverlay(
    { isKeyboardDismissDisabled: !closeOnEscape, isOpen, onClose: onDismiss },
    ref
  );

  // Get props for the dialog and its title
  const { dialogProps, titleProps } = useDialog({}, ref);
  const CloseButton = modalPresentation?.CloseButton;

  if (!isOpen) {
    return null;
  }

  const headerClass = cx(styles.modalHeader, typeof title !== 'string' && styles.modalHeaderWithTabs);

  return (
    <OverlayContainer>
      <div
        role="presentation"
        className={cx(styles.modalBackdrop, modalPresentation && 'wall-modal-backdrop')}
        style={modalPresentation?.style}
        onClick={onClickBackdrop || (closeOnBackdropClick ? onDismiss : undefined)}
        {...underlayProps}
      />
      <FocusScope contain={trapFocus} autoFocus restoreFocus>
        <div
          className={cx(styles.modal, className, presentation && css(presentation), modalPresentation?.className)}
          style={modalPresentation?.style}
          ref={ref}
          {...overlayProps}
          {...dialogProps}
        >
          <header className={cx(headerClass, modalPresentation && 'wall-modal-header')}>
            <div className={modalPresentation && 'wall-modal-heading'} id={titleProps.id}>
              {typeof title === 'string' ? <DefaultModalHeader {...props} title={title} /> : title}
            </div>
            <div className={cx(styles.modalHeaderClose, modalPresentation && 'wall-modal-close-slot')}>
              {CloseButton ? (
                <CloseButton onClick={onDismiss} aria-label={t('grafana-ui.modal.close-tooltip', 'Close')} />
              ) : (
                <IconButton
                  name="times"
                  size="xl"
                  onClick={onDismiss}
                  aria-label={t('grafana-ui.modal.close-tooltip', 'Close')}
                />
              )}
            </div>
          </header>
          <div className={cx(styles.modalContent, contentClassName, modalPresentation && 'wall-modal-content')}>
            {children}
          </div>
        </div>
      </FocusScope>
    </OverlayContainer>
  );
}

function ModalButtonRow({ leftItems, children }: { leftItems?: React.ReactNode; children: React.ReactNode }) {
  const styles = useStyles2(getModalStyles);

  if (leftItems) {
    return (
      <footer className={styles.modalButtonRow} data-slot="modal-footer">
        <Stack justifyContent="space-between">
          <Stack justifyContent="flex-start" gap={2}>
            {leftItems}
          </Stack>
          <Stack justifyContent="flex-end" gap={2}>
            {children}
          </Stack>
        </Stack>
      </footer>
    );
  }

  return (
    <footer className={styles.modalButtonRow} data-slot="modal-footer">
      <Stack justifyContent="flex-end" gap={2} wrap="wrap">
        {children}
      </Stack>
    </footer>
  );
}

Modal.ButtonRow = ModalButtonRow;

interface DefaultModalHeaderProps {
  id?: string;
  title: string;
  icon?: IconName;
  iconTooltip?: string;
}

function DefaultModalHeader({ icon, iconTooltip, title, id }: DefaultModalHeaderProps): JSX.Element {
  return <ModalHeader icon={icon} iconTooltip={iconTooltip} title={title} id={id} />;
}
