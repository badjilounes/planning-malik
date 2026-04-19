import { addDays, startOfWeek } from 'date-fns';
import { apiGet } from '@/lib/api';
import type { TaskOccurrenceDto } from '@planning/types';
import { CalendarClient } from './calendar-client';

interface Props {
  searchParams: Promise<{ week?: string }>;
}

export default async function CalendarPage({ searchParams }: Props) {
  const { week } = await searchParams;
  const anchor = parseWeekAnchor(week);
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  // Give the event-manager enough history/future to freely navigate.
  const rangeStart = addDays(start, -30);
  const rangeEnd = addDays(start, 60);

  const occurrences = await apiGet<TaskOccurrenceDto[]>(
    `/tasks?rangeStart=${rangeStart.toISOString()}&rangeEnd=${rangeEnd.toISOString()}`,
    { cache: 'no-store' },
  );

  return <CalendarClient occurrences={occurrences} />;
}

function parseWeekAnchor(raw: string | undefined): Date {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}
