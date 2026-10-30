import { cx } from '@emotion/css';
import { ReactElement, useCallback, useContext } from 'react';

import { selectors } from '@grafana/e2e-selectors';

import { Dropdown } from '../Dropdown/Dropdown';
import { ToolbarButton } from '../ToolbarButton';
import { TooltipPlacement } from '../Tooltip';

import { PanelChromePresentationContext } from './PanelChromePresentation';

interface PanelMenuProps {
  menu: ReactElement | (() => ReactElement);
  menuButtonClass?: string;
  dragClassCancel?: string;
  title?: string;
  placement?: TooltipPlacement;
  offset?: [number, number];
  onOpenMenu?: () => void;
}

export function PanelMenu({
  menu,
  title,
  placement = 'bottom',
  offset,
  dragClassCancel,
  menuButtonClass,
  onOpenMenu,
}: PanelMenuProps) {
  const presentation = useContext(PanelChromePresentationContext);
  const testId = title ? selectors.components.Panels.Panel.menu(title) : `panel-menu-button`;

  const handleVisibility = useCallback(
    (show: boolean) => {
      if (show && onOpenMenu) {
        onOpenMenu();
      }
    },
    [onOpenMenu]
  );

  if (presentation?.hideMenu) {
    return null;
  }

  return (
    <Dropdown overlay={menu} placement={placement} offset={offset} onVisibleChange={handleVisibility}>
      {presentation?.renderMenuButton ? (
        presentation.renderMenuButton({ title, testId, className: cx(menuButtonClass, dragClassCancel) })
      ) : (
        <ToolbarButton
          aria-label={`Menu for panel with ${title ? `title ${title}` : 'no title'}`}
          title="Menu"
          icon="ellipsis-v"
          iconSize="md"
          narrow
          data-testid={testId}
          className={cx(menuButtonClass, dragClassCancel)}
        />
      )}
    </Dropdown>
  );
}
