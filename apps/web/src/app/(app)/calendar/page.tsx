import { apiGet } from '@/lib/api';
import type { TaskOccurrenceDto } from '@planning/types';
import { MonthCalendar } from './month-calendar';

interface Props {
  searchParams: Promise<{ month?: string }>;
}

export default async function CalendarPage({ searchParams }: Props) {
  const { month } = await searchParams;
  const current = parseMonth(month);

  // Grid covers 6 weeks (42 days) starting from the Monday of the week
  // containing day 1. We request a padded range so occurrences in the
  // leading/trailing days of neighbouring months are fetched too.
  const first = new Date(current.getFullYear(), current.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const rangeStart = new Date(first);
  rangeStart.setDate(first.getDate() - offset);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeStart.getDate() + 42);

  const occurrences = await apiGet<TaskOccurrenceDto[]>(
    `/tasks?rangeStart=${rangeStart.toISOString()}&rangeEnd=${rangeEnd.toISOString()}`,
    { cache: 'no-store' },
  );

  return <MonthCalendar month={current} occurrences={occurrences} />;
}

function parseMonth(raw: string | undefined): Date {
  if (raw) {
    const match = /^(\d{4})-(\d{2})$/.exec(raw);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, 1);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
