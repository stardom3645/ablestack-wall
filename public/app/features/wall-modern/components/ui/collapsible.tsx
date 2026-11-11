// Wall composition of the installed Base UI primitive. Its transition lifecycle owns height/focus.
import { Collapsible as Primitive } from '@base-ui/react/collapsible';
import { forwardRef } from 'react';

import { cn } from '../../ui';

const Panel = forwardRef<HTMLDivElement, Primitive.Panel.Props>(({ children, className, ...props }, ref) => (
  <Primitive.Panel {...props} keepMounted ref={ref} className={cn('wall-collapsible-panel', className)}>
    <div className="wall-collapsible-content">{children}</div>
  </Primitive.Panel>
));
Panel.displayName = 'WallCollapsiblePanel';
export const Collapsible = { Root: Primitive.Root, Trigger: Primitive.Trigger, Panel };
