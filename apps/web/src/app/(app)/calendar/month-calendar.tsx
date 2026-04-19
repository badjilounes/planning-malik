'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { TaskOccurrenceDto } from '@planning/types';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PRIORITY_DOT: Record<TaskOccurrenceDto['priority'], string> = {
  LOW: 'bg-priority-low',
  MEDIUM: 'bg-priority-medium',
  HIGH: 'bg-priority-high',
  URGENT: 'bg-priority-urgent',
};

interface Props {
  /** First day of the month being displayed, in UTC. */
  month: Date;
  occurrences: TaskOccurrenceDto[];
}

export function MonthCalendar({ month, occurrences }: Props) {
  const router = useRouter();
  const today = startOfDay(new Date());
  const cells = buildMonthCells(month);
  const byDay = groupByDayKey(occurrences);

  const goto = (d: Date) => router.push(`/calendar?month=${toMonthParam(d)}`);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {month.toLocaleDateString([], { month: 'long', year: 'numeric' })}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {occurrences.length} occurrence{occurrences.length === 1 ? '' : 's'} this view.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            className="h-10 w-10 p-0"
            aria-label="Previous month"
            onClick={() => goto(addMonths(month, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => goto(today)}
          >
            Today
          </Button>
          <Button
            variant="secondary"
            size="md"
            className="h-10 w-10 p-0"
            aria-label="Next month"
            onClick={() => goto(addMonths(month, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Link href="/tasks/new">
            <Button size="md">
              <Plus className="h-4 w-4" />
              New task
            </Button>
          </Link>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-soft">
        <div className="grid grid-cols-7 border-b border-border bg-surface-muted/40 text-xs font-medium text-fg-muted">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-3 py-2 text-left">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            const key = toDayKey(cell.date);
            const items = byDay.get(key) ?? [];
            return (
              <DayCell
                key={key}
                date={cell.date}
                items={items}
                inMonth={cell.inMonth}
                isToday={isSameDay(cell.date, today)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayCell({
  date,
  items,
  inMonth,
  isToday,
}: {
  date: Date;
  items: TaskOccurrenceDto[];
  inMonth: boolean;
  isToday: boolean;
}) {
  const visible = items.slice(0, 3);
  const overflow = items.length - visible.length;
  const dayKey = toDayKey(date);

  return (
    <div
      className={cn(
        'min-h-28 border-b border-r border-border p-2 text-left transition-colors',
        'last:border-r-0 [&:nth-child(7n)]:border-r-0',
        inMonth ? 'bg-surface-elevated' : 'bg-surface-muted/30 text-fg-subtle',
      )}
    >
      <div
        className={cn(
          'mb-1 flex h-6 w-6 items-center justify-center text-xs font-medium',
          isToday
            ? 'rounded-full bg-brand-600 text-white'
            : inMonth
              ? 'text-fg'
              : 'text-fg-subtle',
        )}
      >
        {date.getDate()}
      </div>
      <div className="space-y-1">
        {visible.map((o) => (
          <Link
            key={o.occurrenceId}
            href={
              o.isRecurring
                ? `/tasks/${o.taskId}/occurrences/${dayKey}/edit`
                : `/tasks/${o.taskId}/edit`
            }
            className={cn(
              'group flex items-center gap-1.5 rounded-lg border border-border/50 bg-surface px-2 py-1',
              'text-xs text-fg transition-colors hover:border-border hover:shadow-pop',
              o.status === 'DONE' && 'opacity-50 line-through',
            )}
          >
            <span
              className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[o.priority])}
              aria-hidden
            />
            <span className="truncate">{o.title}</span>
          </Link>
        ))}
        {overflow > 0 && (
          <div className="px-2 text-[11px] text-fg-subtle">+{overflow} more</div>
        )}
      </div>
    </div>
  );
}

function buildMonthCells(month: Date): { date: Date; inMonth: boolean }[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  // Monday-first: 0=Sun..6=Sat → shift so Mon=0, Sun=6.
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ date: d, inMonth: d.getMonth() === month.getMonth() });
  }
  return cells;
}

function groupByDayKey(items: TaskOccurrenceDto[]): Map<string, TaskOccurrenceDto[]> {
  const map = new Map<string, TaskOccurrenceDto[]>();
  for (const o of items) {
    const key = o.occurrenceDate.slice(0, 10);
    const bucket = map.get(key);
    if (bucket) bucket.push(o);
    else map.set(key, [o]);
  }
  return map;
}

function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toMonthParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
