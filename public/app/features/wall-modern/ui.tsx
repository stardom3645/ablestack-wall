// Button composition adapted from shadcn/ui (MIT), using Base UI primitives.
// Components stay local to Wall; Grafana's shared UI package is intentionally unchanged.
import { Button as BaseButton } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { forwardRef, type ComponentProps, type HTMLAttributes } from 'react';
import { extendTailwindMerge } from 'tailwind-merge';

const merge = extendTailwindMerge({ prefix: 'wl-' });

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}

const buttonVariants = cva(
  'wall-button wl-inline-flex wl-items-center wl-justify-center wl-gap-2 wl-rounded-lg wl-text-sm wl-font-medium wl-transition-colors disabled:wl-opacity-50',
  {
    variants: {
      variant: {
        default: 'wall-button-primary',
        outline: 'wall-button-outline',
        ghost: 'wall-button-ghost',
      },
      size: { default: 'wl-h-9 wl-px-3', icon: 'wl-h-9 wl-w-9 wl-p-0', sm: 'wl-h-8 wl-px-2.5' },
    },
    defaultVariants: { variant: 'outline', size: 'default' },
  }
);

type ButtonProps = Omit<ComponentProps<typeof BaseButton>, 'className'> &
  VariantProps<typeof buttonVariants> & { className?: string };
export const Button = forwardRef<HTMLElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <BaseButton ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'WallButton';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('wall-card wl-rounded-xl wl-border', className)} {...props} />;
}
