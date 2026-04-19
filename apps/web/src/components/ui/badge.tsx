import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import type { TaskPriority, TaskStatus } from '@planning/types';

export function Badge({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        'border border-border bg-surface-muted text-fg-muted',
        className,
      )}
      {...rest}
    />
  );
}

const priorityClass: Record<TaskPriority, string> = {
  LOW: 'border-transparent bg-slate-400/10 text-slate-600 dark:text-slate-300',
  MEDIUM: 'border-transparent bg-blue-400/10 text-blue-600 dark:text-blue-300',
  HIGH: 'border-transparent bg-amber-400/15 text-amber-700 dark:text-amber-300',
  URGENT: 'border-transparent bg-red-400/15 text-red-600 dark:text-red-300',
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge className={priorityClass[priority]}>{priority.toLowerCase()}</Badge>;
}

const statusClass: Record<TaskStatus, string> = {
  TODO: 'text-fg-muted',
  IN_PROGRESS: 'text-brand-600 dark:text-brand-400',
  DONE: 'text-emerald-600 dark:text-emerald-400 line-through',
};
export const statusLabel: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge className={cn('border-transparent bg-transparent px-0', statusClass[status])}>
      {statusLabel[status]}
    </Badge>
  );
}
