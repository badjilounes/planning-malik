import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const fieldBase =
  'w-full rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-sm ' +
  'text-fg placeholder:text-fg-subtle shadow-soft transition-colors ' +
  'hover:border-fg-subtle/60 focus:border-brand-500 focus:shadow-pop ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input ref={ref} className={cn(fieldBase, className)} {...rest} />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 3, ...rest }, ref) => (
  <textarea ref={ref} rows={rows} className={cn(fieldBase, 'resize-none', className)} {...rest} />
));
Textarea.displayName = 'Textarea';

export function Label({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('block text-xs font-medium text-fg-muted mb-1.5', className)}
    >
      {children}
    </label>
  );
}
