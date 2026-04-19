'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { TaskOccurrenceDto } from '@planning/types';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

const PRIORITY_DOT: Record<TaskOccurrenceDto['priority'], string> = {
  LOW: 'bg-priority-low',
  MEDIUM: 'bg-priority-medium',
  HIGH: 'bg-priority-high',
  URGENT: 'bg-priority-urgent',
};

interface Props {
  /** Monday of the displayed week. */
  weekStart: Date;
  occurrences: TaskOccurrenceDto[];
}

export function WeekCalendar({ weekStart, occurrences }: Props) {
  const router = useRouter();
  const today = startOfToday();
  const start = startOfWeek(weekStart, { weekStartsOn: 1 });
  const end = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const goto = (d: Date) => router.push(`/calendar?week=${format(d, 'yyyy-MM-dd')}`);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Semaine du {format(start, 'd MMM', { locale: fr })} –{' '}
            {format(end, 'd MMM yyyy', { locale: fr })}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {occurrences.length} tâche{occurrences.length === 1 ? '' : 's'} cette semaine.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1">
            <Button
              variant="secondary"
              size="md"
              className="h-10 w-10 p-0"
              aria-label="Semaine précédente"
              onClick={() => goto(addWeeks(start, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="md" onClick={() => goto(today)}>
              Aujourd&apos;hui
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="h-10 w-10 p-0"
              aria-label="Semaine suivante"
              onClick={() => goto(addWeeks(start, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Link href="/tasks/new" className="ml-auto md:ml-0">
            <Button size="md">
              <Plus className="h-4 w-4" />
              Nouvelle tâche
            </Button>
          </Link>
        </div>
      </header>

      {/* Mobile: stacked day cards */}
      <div className="space-y-3 md:hidden">
        {days.map((day) => (
          <DayRow
            key={day.toISOString()}
            day={day}
            occurrences={occurrences}
            today={today}
          />
        ))}
      </div>

      {/* Desktop: 7-column grid */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-soft md:grid md:grid-cols-7">
        {days.map((day) => (
          <DayColumn
            key={day.toISOString()}
            day={day}
            occurrences={occurrences}
            today={today}
          />
        ))}
      </div>
    </div>
  );
}

function DayRow({
  day,
  occurrences,
  today,
}: {
  day: Date;
  occurrences: TaskOccurrenceDto[];
  today: Date;
}) {
  const items = occurrences.filter((o) => isSameDay(new Date(o.occurrenceDate), day));
  const isNow = isSameDay(day, today);
  const dayKey = format(day, 'yyyy-MM-dd');

  return (
    <section
      className={cn(
        'rounded-2xl border border-border bg-surface-elevated p-4 shadow-soft',
        isNow && 'border-brand-500/60',
      )}
    >
      <header className="mb-2 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'text-sm font-medium capitalize',
              isNow ? 'text-brand-600 dark:text-brand-400' : 'text-fg',
            )}
          >
            {format(day, 'EEEE', { locale: fr })}
          </span>
          <span className="text-xs text-fg-muted">
            {format(day, 'd MMM', { locale: fr })}
          </span>
        </div>
        {items.length > 0 && (
          <span className="text-xs text-fg-subtle">{items.length}</span>
        )}
      </header>
      {items.length === 0 ? (
        <p className="text-xs text-fg-subtle">Aucune tâche.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((o) => (
            <TaskChip key={o.occurrenceId} occurrence={o} dayKey={dayKey} />
          ))}
        </ul>
      )}
    </section>
  );
}

function DayColumn({
  day,
  occurrences,
  today,
}: {
  day: Date;
  occurrences: TaskOccurrenceDto[];
  today: Date;
}) {
  const items = occurrences.filter((o) => isSameDay(new Date(o.occurrenceDate), day));
  const isNow = isSameDay(day, today);
  const dayKey = format(day, 'yyyy-MM-dd');

  return (
    <div className="flex min-h-64 flex-col border-b border-r border-border p-2 last:border-r-0 [&:nth-child(7n)]:border-r-0">
      <header className="mb-2 flex items-baseline justify-between px-1">
        <span
          className={cn(
            'text-xs font-medium uppercase tracking-wide',
            isNow ? 'text-brand-600 dark:text-brand-400' : 'text-fg-muted',
          )}
        >
          {format(day, 'EEE', { locale: fr })}
        </span>
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center text-xs font-semibold',
            isNow ? 'rounded-full bg-brand-600 text-white' : 'text-fg',
          )}
        >
          {format(day, 'd')}
        </span>
      </header>
      <ul className="space-y-1">
        {items.map((o) => (
          <TaskChip key={o.occurrenceId} occurrence={o} dayKey={dayKey} />
        ))}
      </ul>
    </div>
  );
}

function TaskChip({
  occurrence: o,
  dayKey,
}: {
  occurrence: TaskOccurrenceDto;
  dayKey: string;
}) {
  return (
    <li>
      <Link
        href={
          o.isRecurring
            ? `/tasks/${o.taskId}/occurrences/${dayKey}/edit`
            : `/tasks/${o.taskId}/edit`
        }
        className={cn(
          'flex items-center gap-1.5 rounded-lg border border-border/50 bg-surface px-2 py-1.5',
          'text-xs text-fg transition-colors hover:border-border hover:shadow-pop',
          o.status === 'DONE' && 'opacity-50 line-through',
        )}
      >
        <span
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', PRIORITY_DOT[o.priority])}
          aria-hidden
        />
        <span className="truncate">{o.title}</span>
      </Link>
    </li>
  );
}
