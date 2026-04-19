import { addDays, endOfWeek, startOfWeek } from 'date-fns';
import { apiGet } from '@/lib/api';
import type { TaskOccurrenceDto } from '@planning/types';
import { WeekCalendar } from './week-calendar';

interface Props {
  searchParams: Promise<{ week?: string }>;
}

export default async function CalendarPage({ searchParams }: Props) {
  const { week } = await searchParams;
  const anchor = parseWeekAnchor(week);
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  const end = endOfWeek(anchor, { weekStartsOn: 1 });

  const occurrences = await apiGet<TaskOccurrenceDto[]>(
    `/tasks?rangeStart=${start.toISOString()}&rangeEnd=${addDays(end, 1).toISOString()}`,
    { cache: 'no-store' },
  );

  return <WeekCalendar weekStart={start} occurrences={occurrences} />;
}

function parseWeekAnchor(raw: string | undefined): Date {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}
