import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-brand-500 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800',
        accent: 'bg-accent-500 text-brand-900 shadow-sm hover:bg-accent-600',
        outline: 'border border-slate-200 bg-white text-brand-500 shadow-sm hover:bg-brand-50',
        ghost: 'text-slate-600 hover:bg-slate-100',
        danger: 'border border-red-200 bg-white text-price hover:bg-price-soft',
        solidDanger: 'bg-price text-white shadow-sm hover:bg-price-dark',
        white: 'bg-white text-brand-500 shadow-sm hover:bg-brand-50',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-5',
        lg: 'h-11 px-7 text-[15px]',
        icon: 'h-9 w-9',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  }
);

export const Button = React.forwardRef(({ className, variant, size, block, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size, block }), className)} {...props} />
));
Button.displayName = 'Button';
