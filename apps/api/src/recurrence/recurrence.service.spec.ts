import { RecurrenceService, type TaskWithRecurrence } from './recurrence.service';
import {
  ExceptionAction,
  RecurrenceFreq,
  TaskPriority,
  TaskStatus,
} from '@planning/data-access';
import { buildRruleString } from '@planning/utils';

describe('RecurrenceService', () => {
  const service = new RecurrenceService();

  describe('non-recurring tasks', () => {
    it('returns a task whose dueDate is inside the range', () => {
      const task = makeTask({
        id: 't1',
        title: 'One-shot',
        dueDate: iso('2026-05-10T10:00:00Z'),
      });
      const out = service.expand([task], iso('2026-05-01'), iso('2026-05-31'));
      expect(out).toHaveLength(1);
      expect(out[0].taskId).toBe('t1');
      expect(out[0].isRecurring).toBe(false);
    });

    it('excludes a task whose dueDate is outside the range', () => {
      const task = makeTask({
        id: 't2',
        title: 'Out of range',
        dueDate: iso('2026-06-10T10:00:00Z'),
      });
      const out = service.expand([task], iso('2026-05-01'), iso('2026-05-31'));
      expect(out).toHaveLength(0);
    });
  });

  describe('daily recurrence', () => {
    it('produces one occurrence per day in range', () => {
      const startsOn = iso('2026-05-01T09:00:00Z');
      const task = makeTask({
        id: 't3',
        title: 'Daily standup',
        dueDate: startsOn,
        recurrence: makeRule({
          id: 'r3',
          taskId: 't3',
          freq: RecurrenceFreq.DAILY,
          startsOn,
        }),
      });
      const out = service.expand([task], iso('2026-05-01'), iso('2026-05-08'));
      expect(out).toHaveLength(7);
      expect(out[0].isRecurring).toBe(true);
      expect(out.map((o) => o.occurrenceDate.slice(0, 10))).toEqual([
        '2026-05-01',
        '2026-05-02',
        '2026-05-03',
        '2026-05-04',
        '2026-05-05',
        '2026-05-06',
        '2026-05-07',
      ]);
    });
  });

  describe('weekly recurrence', () => {
    it('produces occurrences only on the selected weekdays', () => {
      // May 4, 2026 is a Monday. ISO weekdays: 0=Mon..6=Sun.
      // Pick Mon (0) + Wed (2) + Fri (4).
      const startsOn = iso('2026-05-04T18:00:00Z');
      const task = makeTask({
        id: 't4',
        title: 'Gym',
        dueDate: startsOn,
        recurrence: makeRule({
          id: 'r4',
          taskId: 't4',
          freq: RecurrenceFreq.WEEKLY,
          byWeekday: [0, 2, 4],
          startsOn,
        }),
      });
      const out = service.expand([task], iso('2026-05-04'), iso('2026-05-11'));
      // Mon, Wed, Fri of that week.
      expect(out).toHaveLength(3);
      expect(out.map((o) => o.occurrenceDate.slice(0, 10))).toEqual([
        '2026-05-04',
        '2026-05-06',
        '2026-05-08',
      ]);
    });
  });

  describe('monthly recurrence', () => {
    it('produces one occurrence on the chosen day of month', () => {
      const startsOn = iso('2026-01-01T09:00:00Z');
      const task = makeTask({
        id: 't5',
        title: 'Rent',
        dueDate: startsOn,
        recurrence: makeRule({
          id: 'r5',
          taskId: 't5',
          freq: RecurrenceFreq.MONTHLY,
          byMonthDay: [1],
          startsOn,
        }),
      });
      const out = service.expand([task], iso('2026-01-01'), iso('2026-07-01'));
      expect(out.map((o) => o.occurrenceDate.slice(0, 10))).toEqual([
        '2026-01-01',
        '2026-02-01',
        '2026-03-01',
        '2026-04-01',
        '2026-05-01',
        '2026-06-01',
      ]);
    });
  });

  describe('exceptions', () => {
    it('SKIP hides the occurrence from the output', () => {
      const startsOn = iso('2026-05-01T09:00:00Z');
      const task = makeTask({
        id: 't6',
        title: 'Daily',
        dueDate: startsOn,
        recurrence: makeRule({
          id: 'r6',
          taskId: 't6',
          freq: RecurrenceFreq.DAILY,
          startsOn,
        }),
        exceptions: [
          {
            id: 'ex1',
            taskId: 't6',
            originalDate: iso('2026-05-03T09:00:00Z'),
            action: ExceptionAction.SKIP,
            title: null,
            description: null,
            dueDate: null,
            status: null,
            priority: null,
            createdAt: new Date(),
          },
        ],
      });
      const out = service.expand([task], iso('2026-05-01'), iso('2026-05-06'));
      expect(out).toHaveLength(4);
      expect(out.map((o) => o.occurrenceDate.slice(0, 10))).not.toContain('2026-05-03');
    });

    it('MODIFY overrides the specified fields for that occurrence only', () => {
      const startsOn = iso('2026-05-01T09:00:00Z');
      const task = makeTask({
        id: 't7',
        title: 'Daily',
        dueDate: startsOn,
        priority: TaskPriority.LOW,
        recurrence: makeRule({
          id: 'r7',
          taskId: 't7',
          freq: RecurrenceFreq.DAILY,
          startsOn,
        }),
        exceptions: [
          {
            id: 'ex2',
            taskId: 't7',
            originalDate: iso('2026-05-03T09:00:00Z'),
            action: ExceptionAction.MODIFY,
            title: 'Special edition',
            description: null,
            dueDate: null,
            status: null,
            priority: TaskPriority.URGENT,
            createdAt: new Date(),
          },
        ],
      });
      const out = service.expand([task], iso('2026-05-01'), iso('2026-05-06'));
      const modified = out.find((o) => o.occurrenceDate.startsWith('2026-05-03'));
      expect(modified).toBeDefined();
      expect(modified!.title).toBe('Special edition');
      expect(modified!.priority).toBe(TaskPriority.URGENT);
      expect(modified!.isException).toBe(true);

      const untouched = out.find((o) => o.occurrenceDate.startsWith('2026-05-02'));
      expect(untouched!.title).toBe('Daily');
      expect(untouched!.priority).toBe(TaskPriority.LOW);
      expect(untouched!.isException).toBe(false);
    });
  });

  describe('output ordering', () => {
    it('sorts occurrences across tasks by date ascending', () => {
      const a = makeTask({
        id: 'a',
        title: 'A',
        dueDate: iso('2026-05-05T10:00:00Z'),
      });
      const b = makeTask({
        id: 'b',
        title: 'B',
        dueDate: iso('2026-05-02T10:00:00Z'),
      });
      const out = service.expand([a, b], iso('2026-05-01'), iso('2026-05-31'));
      expect(out.map((o) => o.taskId)).toEqual(['b', 'a']);
    });
  });
});

// ─── fixtures ────────────────────────────────────────────────────────────

function iso(value: string): Date {
  return new Date(value);
}

function makeTask(partial: {
  id: string;
  title: string;
  dueDate: Date;
  priority?: TaskPriority;
  recurrence?: TaskWithRecurrence['recurrence'];
  exceptions?: TaskWithRecurrence['exceptions'];
}): TaskWithRecurrence {
  return {
    id: partial.id,
    userId: 'u1',
    title: partial.title,
    description: null,
    dueDate: partial.dueDate,
    priority: partial.priority ?? TaskPriority.MEDIUM,
    status: TaskStatus.TODO,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    recurrence: partial.recurrence ?? null,
    exceptions: partial.exceptions ?? [],
  };
}

function makeRule(partial: {
  id: string;
  taskId: string;
  freq: RecurrenceFreq;
  interval?: number;
  byWeekday?: number[];
  byMonthDay?: number[];
  startsOn: Date;
  endsOn?: Date | null;
  count?: number | null;
}): NonNullable<TaskWithRecurrence['recurrence']> {
  return {
    id: partial.id,
    taskId: partial.taskId,
    freq: partial.freq,
    interval: partial.interval ?? 1,
    byWeekday: partial.byWeekday ?? [],
    byMonthDay: partial.byMonthDay ?? [],
    startsOn: partial.startsOn,
    endsOn: partial.endsOn ?? null,
    count: partial.count ?? null,
    rruleString: buildRruleString({
      freq: partial.freq,
      interval: partial.interval,
      byWeekday: partial.byWeekday,
      byMonthDay: partial.byMonthDay,
      startsOn: partial.startsOn,
      endsOn: partial.endsOn,
      count: partial.count,
    }),
  };
}
