'use client';

import { useTransition } from 'react';
import { EventManager, type Event } from '@/components/shadcn/event-manager';
import type { TaskOccurrenceDto, TaskPriority } from '@planning/types';
import {
  createCalendarTaskAction,
  deleteCalendarTaskAction,
  updateCalendarTaskAction,
} from './actions';

const COLORS = [
  { name: 'Faible', value: 'slate', bg: 'bg-slate-500', text: 'text-slate-700' },
  { name: 'Moyenne', value: 'blue', bg: 'bg-blue-500', text: 'text-blue-700' },
  { name: 'Haute', value: 'amber', bg: 'bg-amber-500', text: 'text-amber-700' },
  { name: 'Urgente', value: 'red', bg: 'bg-red-500', text: 'text-red-700' },
];

const PRIORITY_TO_COLOR: Record<TaskPriority, string> = {
  LOW: 'slate',
  MEDIUM: 'blue',
  HIGH: 'amber',
  URGENT: 'red',
};

const COLOR_TO_PRIORITY: Record<string, TaskPriority> = {
  slate: 'LOW',
  blue: 'MEDIUM',
  amber: 'HIGH',
  red: 'URGENT',
};

function toEvent(o: TaskOccurrenceDto): Event {
  const start = new Date(o.occurrenceDate);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    id: o.occurrenceId,
    title: o.title,
    description: o.description ?? undefined,
    startTime: start,
    endTime: end,
    color: PRIORITY_TO_COLOR[o.priority],
    category: o.isRecurring ? 'Récurrente' : 'Unique',
    tags: o.tags,
  };
}

export function CalendarClient({ occurrences }: { occurrences: TaskOccurrenceDto[] }) {
  const events = occurrences.map(toEvent);
  const byId = new Map(occurrences.map((o) => [o.occurrenceId, o]));
  const [, startTransition] = useTransition();

  const onEventCreate = (ev: Omit<Event, 'id'>) => {
    startTransition(() => {
      void createCalendarTaskAction({
        title: ev.title,
        description: ev.description ?? null,
        dueDate: ev.startTime.toISOString(),
        priority: COLOR_TO_PRIORITY[ev.color] ?? 'MEDIUM',
        tags: ev.tags ?? [],
      });
    });
  };

  const onEventUpdate = (id: string, patch: Partial<Event>) => {
    const src = byId.get(id);
    if (!src) return;
    // Updating a single recurring occurrence should go through the
    // exception flow — for now we only edit the parent template.
    startTransition(() => {
      void updateCalendarTaskAction(src.taskId, {
        title: patch.title,
        description: patch.description ?? undefined,
        dueDate: patch.startTime?.toISOString(),
        priority: patch.color ? COLOR_TO_PRIORITY[patch.color] : undefined,
        tags: patch.tags,
      });
    });
  };

  const onEventDelete = (id: string) => {
    const src = byId.get(id);
    if (!src) return;
    startTransition(() => {
      void deleteCalendarTaskAction(src.taskId);
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] w-full md:h-[calc(100vh-6rem)]">
      <EventManager
        events={events}
        onEventCreate={onEventCreate}
        onEventUpdate={onEventUpdate}
        onEventDelete={onEventDelete}
        colors={COLORS}
        categories={['Unique', 'Récurrente']}
        defaultView="week"
      />
    </div>
  );
}
