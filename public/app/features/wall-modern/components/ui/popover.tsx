// Adapted from shadcn/ui's Base UI Popover composition (MIT).
// Source and license: ../../DESIGN_SYSTEM.md, ./SHADCN-LICENSE.txt.
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { useContext } from 'react';

import { useTheme2 } from '@grafana/ui';

import { WallTypographyContext, wallTypographyVariables } from '../../typography';
import { cn } from '../../ui';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export function PopoverContent({
  className,
  align = 'end',
  sideOffset = 8,
  anchor,
  ...props
}: PopoverPrimitive.Popup.Props & Pick<PopoverPrimitive.Positioner.Props, 'align' | 'sideOffset' | 'anchor'>) {
  const theme = useTheme2();
  const typography = useContext(WallTypographyContext);
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        anchor={anchor}
        align={align}
        sideOffset={sideOffset}
        className="wall-toolbar-positioner"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          data-wall-typography={typography ? 'storage-vm' : undefined}
          style={typography ? wallTypographyVariables : undefined}
          data-wall-theme={theme.isDark ? 'dark' : 'light'}
          className={cn('wall-modern wall-toolbar-popover', className)}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}
