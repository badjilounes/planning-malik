'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Check, Circle, CircleDashed, MoreHorizontal, Repeat } from 'lucide-react';
import { TaskStatus, type TaskOccurrenceDto } from '@planning/types';
import { cn } from '@/lib/cn';
import { formatOccurrence } from '@/lib/format';
import { PriorityBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  setTaskStatusAction,
  skipOccurrenceAction,
  deleteTaskAction,
  clearExceptionAction,
} from './actions';

export function TaskCard({ occurrence }: { occurrence: TaskOccurrenceDto }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, startTransition] = useTransition();

  const toggleStatus = () => {
    const next: TaskStatus = occurrence.status === 'DONE' ? 'TODO' : 'DONE';
    startTransition(() => {
      void setTaskStatusAction(occurrence.taskId, next);
    });
  };

  return (
    <Card
      className={cn(
        'group relative flex items-center gap-3 px-4 py-3 transition-colors hover:shadow-pop',
        occurrence.status === 'DONE' && 'opacity-70',
      )}
    >
      <button
        type="button"
        onClick={toggleStatus}
        aria-label={occurrence.status === 'DONE' ? 'Mark as to do' : 'Mark as done'}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-fg-subtle transition-colors hover:border-brand-500 hover:text-brand-600"
      >
        {occurrence.status === 'DONE' ? (
          <Check className="h-3.5 w-3.5" />
        ) : occurrence.status === 'IN_PROGRESS' ? (
          <CircleDashed className="h-3.5 w-3.5" />
        ) : (
          <Circle className="h-3.5 w-3.5" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'truncate text-sm font-medium',
              occurrence.status === 'DONE' && 'line-through',
            )}
          >
            {occurrence.title}
          </p>
          {occurrence.isRecurring && (
            <span title={occurrence.isException ? 'Occurrence modifiée' : 'Récurrente'}>
              <Repeat
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  occurrence.isException ? 'text-amber-500' : 'text-fg-subtle',
                )}
              />
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-fg-muted">
          <span>{formatOccurrence(occurrence.occurrenceDate)}</span>
          <PriorityBadge priority={occurrence.priority} />
          {occurrence.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-fg-subtle">
              #{t}
            </span>
          ))}
        </div>
      </div>

      <OccurrenceMenu
        occurrence={occurrence}
        open={menuOpen}
        onOpenChange={setMenuOpen}
      />
    </Card>
  );
}

function OccurrenceMenu({
  occurrence,
  open,
  onOpenChange,
}: {
  occurrence: TaskOccurrenceDto;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [, startTransition] = useTransition();

  const close = () => onOpenChange(false);

  const onSkip = () => {
    startTransition(() => {
      void skipOccurrenceAction(occurrence.taskId, occurrence.occurrenceDate);
    });
    close();
  };
  const onClearException = () => {
    startTransition(() => {
      void clearExceptionAction(occurrence.taskId, occurrence.occurrenceDate);
    });
    close();
  };
  const onDelete = () => {
    if (
      confirm(
        occurrence.isRecurring
          ? 'Supprimer toute la série ? Toutes les occurrences seront retirées.'
          : 'Supprimer cette tâche ?',
      )
    ) {
      startTransition(() => {
        void deleteTaskAction(occurrence.taskId);
      });
    }
    close();
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Ouvrir le menu de la tâche"
        onClick={() => onOpenChange(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-subtle opacity-0 transition-opacity hover:bg-surface-muted hover:text-fg group-hover:opacity-100 data-[open=true]:opacity-100"
        data-open={open}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-hidden
            onClick={close}
          />
          <div className="absolute right-0 top-9 z-20 w-56 animate-fade-in overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-pop">
            <MenuItem href={`/tasks/${occurrence.taskId}/edit`} onClick={close}>
              {occurrence.isRecurring ? 'Modifier la série' : 'Modifier la tâche'}
            </MenuItem>
            {occurrence.isRecurring && (
              <>
                <MenuItem
                  href={`/tasks/${occurrence.taskId}/occurrences/${encodeURIComponent(
                    occurrence.occurrenceDate,
                  )}/edit`}
                  onClick={close}
                >
                  Modifier cette occurrence
                </MenuItem>
                <MenuButton onClick={onSkip}>Ignorer cette occurrence</MenuButton>
                {occurrence.isException && (
                  <MenuButton onClick={onClearException}>
                    Restaurer l&apos;occurrence initiale
                  </MenuButton>
                )}
              </>
            )}
            <div className="border-t border-border" />
            <MenuButton onClick={onDelete} destructive>
              {occurrence.isRecurring ? 'Supprimer la série' : 'Supprimer la tâche'}
            </MenuButton>
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2 text-sm text-fg hover:bg-surface-muted"
    >
      {children}
    </Link>
  );
}

function MenuButton({
  onClick,
  destructive,
  children,
}: {
  onClick: () => void;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'block w-full px-3 py-2 text-left text-sm hover:bg-surface-muted',
        destructive ? 'text-red-600 dark:text-red-400' : 'text-fg',
      )}
    >
      {children}
    </button>
  );
}
