// Adapted from shadcn/ui's Base UI Tabs composition (MIT).
// Source and license: ../../DESIGN_SYSTEM.md, ./SHADCN-LICENSE.txt.
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

import { cn } from '../../ui';

export function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root data-slot="tabs" className={cn('wall-ui-tabs wl-flex wl-flex-col', className)} {...props} />
  );
}

const listVariants = cva('wall-ui-tabs-list wl-flex wl-items-center', {
  variants: { variant: { default: 'wall-ui-tabs-segmented', line: 'wall-ui-tabs-line' } },
  defaultVariants: { variant: 'default' },
});

export function TabsList({
  className,
  variant,
  children,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof listVariants>) {
  return (
    <TabsPrimitive.List data-slot="tabs-list" className={cn(listVariants({ variant }), className)} {...props}>
      {children}
      <TabsPrimitive.Indicator className="wall-tabs-indicator" />
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn('wall-ui-tabs-trigger wl-inline-flex wl-items-center wl-gap-2', className)}
      {...props}
    />
  );
}

export const TabsContent = forwardRef<HTMLDivElement, TabsPrimitive.Panel.Props>(({ className, ...props }, ref) => (
  <TabsPrimitive.Panel
    ref={ref}
    data-slot="tabs-content"
    className={cn('wall-ui-tabs-content wl-outline-none', className)}
    {...props}
  />
));
TabsContent.displayName = 'WallTabsContent';
