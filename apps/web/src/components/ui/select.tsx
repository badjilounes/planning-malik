import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...rest }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-fg',
        'shadow-soft hover:border-fg-subtle/60 focus:border-brand-500',
        'disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';
