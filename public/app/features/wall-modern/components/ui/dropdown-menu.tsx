// Wall's local shadcn-style composition, using the same Base UI menu as its dashboard toolbar.
import { Menu } from '@base-ui/react/menu';
import { useContext } from 'react';

import { useTheme2 } from '@grafana/ui';

import { WallTypographyContext, wallTypographyVariables } from '../../typography';
import { cn } from '../../ui';

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuSub = Menu.SubmenuRoot;
export const DropdownMenuSubTrigger = Menu.SubmenuTrigger;
export const DropdownMenuItem = Menu.Item;
export const DropdownMenuGroup = Menu.Group;
export const DropdownMenuLabel = Menu.GroupLabel;
export const DropdownMenuSeparator = Menu.Separator;

export function DropdownMenuContent({
  className,
  side = 'bottom',
  align = 'end',
  style,
  ...props
}: Menu.Popup.Props & Pick<Menu.Positioner.Props, 'side' | 'align'>) {
  const theme = useTheme2();
  const typography = useContext(WallTypographyContext);
  return (
    <Menu.Portal>
      <Menu.Positioner className="wall-toolbar-positioner" side={side} align={align} sideOffset={6}>
        <Menu.Popup
          {...props}
          className={cn('wall-modern wall-panel-actions-menu', className)}
          data-wall-theme={theme.isDark ? 'dark' : 'light'}
          data-wall-typography={typography ? 'storage-vm' : undefined}
          style={{ ...(typography ? wallTypographyVariables : {}), ...style }}
        />
      </Menu.Positioner>
    </Menu.Portal>
  );
}
