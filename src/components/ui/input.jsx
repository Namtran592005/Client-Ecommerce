import * as React from 'react';
import { cn } from '../../lib/utils';

const base =
  'w-full rounded-lg border border-slate-200 bg-white text-sm text-[#212529] shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70';

export const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(base, 'h-10 px-3', className)} {...props} />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, 'min-h-[90px] px-3 py-2', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(base, 'h-10 cursor-pointer px-3 pr-8', className)} {...props}>
    {children}
  </select>
));
Select.displayName = 'Select';

export const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    className={cn('size-4 shrink-0 cursor-pointer accent-brand-500', className)}
    {...props}
  />
));
Checkbox.displayName = 'Checkbox';

export const Field = ({ label, required, hint, error, children, className }) => (
  <div className={cn('grid gap-1.5', className)}>
    {label && (
      <label className="text-[13px] font-semibold text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-price">*</span>}
      </label>
    )}
    {children}
    {hint && !error && <span className="text-xs text-slate-500">{hint}</span>}
    {error && <span className="text-xs text-price">{error}</span>}
  </div>
);
