import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 ' +
  'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-soft hover:bg-brand-700 hover:shadow-pop dark:bg-brand-500 dark:hover:bg-brand-400',
  secondary:
    'bg-surface-elevated border border-border text-fg hover:bg-surface-muted',
  ghost: 'text-fg-muted hover:text-fg hover:bg-surface-muted',
  danger:
    'bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, type, ...rest }, ref) => (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...rest}
    />
  ),
);
Button.displayName = 'Button';
