import Link from 'next/link';
import { Plus } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type { TaskOccurrenceDto } from '@planning/types';
import { TaskList } from './task-list';

const RANGE_DAYS = 35;

export default async function TasksPage() {
  const { rangeStart, rangeEnd } = computeDefaultRange();

  const occurrences = await apiGet<TaskOccurrenceDto[]>(
    `/tasks?rangeStart=${rangeStart.toISOString()}&rangeEnd=${rangeEnd.toISOString()}`,
    { cache: 'no-store' },
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {occurrences.length} occurrence{occurrences.length === 1 ? '' : 's'} in the next{' '}
            {RANGE_DAYS} days.
          </p>
        </div>
        <Link href="/tasks/new">
          <Button size="md">
            <Plus className="h-4 w-4" />
            New task
          </Button>
        </Link>
      </div>

      <TaskList occurrences={occurrences} />
    </div>
  );
}

function computeDefaultRange(): { rangeStart: Date; rangeEnd: Date } {
  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart.getTime() + RANGE_DAYS * 24 * 60 * 60 * 1000);
  return { rangeStart, rangeEnd };
}
