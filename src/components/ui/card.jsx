import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('rounded-xl border border-line bg-white shadow-card', className)} {...props} />
));
Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col gap-1 px-4 pt-4 sm:px-5 sm:pt-5', className)} {...props} />
);
export const CardTitle = ({ className, ...props }) => (
  <h3 className={cn('text-[15px] font-semibold tracking-tight text-ink', className)} {...props} />
);
export const CardContent = ({ className, ...props }) => (
  <div className={cn('p-4 pt-0 sm:p-5 sm:pt-0', className)} {...props} />
);

const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-transparent px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      color: {
        default: 'bg-slate-100 text-slate-700',
        brand: 'bg-brand-50 text-brand-600',
        green: 'bg-emerald-50 text-emerald-700',
        red: 'bg-red-50 text-price-dark',
        accent: 'bg-accent-100 text-accent-700',
      },
    },
    defaultVariants: { color: 'default' },
  }
);
export const Badge = ({ className, color, ...props }) => (
  <span className={cn(badgeVariants({ color }), className)} {...props} />
);
