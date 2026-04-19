import Link from 'next/link';
import type { TaskOccurrenceDto } from '@planning/types';
import { formatDay, groupByDay } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { CalendarPlus } from 'lucide-react';
import { TaskCard } from './task-card';

export function TaskList({ occurrences }: { occurrences: TaskOccurrenceDto[] }) {
  if (occurrences.length === 0) return <EmptyState />;
  const grouped = Array.from(groupByDay(occurrences).entries());

  return (
    <div className="space-y-8">
      {grouped.map(([dayKey, items]) => (
        <section key={dayKey}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
            {formatDay(items[0].occurrenceDate)}
          </h2>
          <div className="space-y-2">
            {items.map((o) => (
              <TaskCard key={o.occurrenceId} occurrence={o} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="flex flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
        <CalendarPlus className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-medium">No tasks scheduled</p>
        <p className="text-sm text-fg-muted">Create your first task to see it here.</p>
      </div>
      <Link
        href="/tasks/new"
        className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
      >
        New task →
      </Link>
    </Card>
  );
}
