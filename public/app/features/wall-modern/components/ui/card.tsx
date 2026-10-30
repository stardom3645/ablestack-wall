// shadcn/ui Card composition adapted to Wall tokens and Tailwind 3's wl- prefix.
// Source and MIT license: ../../DESIGN_SYSTEM.md, ./SHADCN-LICENSE.txt.
import { ComponentProps } from 'react';

import { cn } from '../../ui';

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card" className={cn('wall-ui-card wl-flex wl-flex-col wl-min-w-0', className)} {...props} />;
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('wall-ui-card-header', className)} {...props} />;
}

export function CardTitle({ className, children, ...props }: ComponentProps<'h3'>) {
  return (
    <h3 data-slot="card-title" className={cn('wall-ui-card-title', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="card-description" className={cn('wall-ui-card-description', className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('wall-ui-card-content wl-min-w-0', className)} {...props} />;
}
