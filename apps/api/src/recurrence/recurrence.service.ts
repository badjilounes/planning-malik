import { Injectable, Logger } from '@nestjs/common';
import { rrulestr } from 'rrule';
import type { Task, RecurrenceRule, TaskException } from '@planning/data-access';
import { ExceptionAction } from '@planning/data-access';
import type { TaskOccurrenceDto } from '@planning/types';

/**
 * A Task row joined with its (optional) recurrence + exceptions.
 * This is the only shape the expansion engine needs.
 */
export type TaskWithRecurrence = Task & {
  recurrence: RecurrenceRule | null;
  exceptions: TaskException[];
};

@Injectable()
export class RecurrenceService {
  private readonly logger = new Logger(RecurrenceService.name);

  /**
   * Expand a list of (possibly recurring) tasks into concrete occurrences
   * that fall within [rangeStart, rangeEnd). Exceptions (SKIP / MODIFY) are
   * applied on top of rule-generated occurrences.
   *
   * Invariants:
   *   * rangeEnd is exclusive
   *   * Non-recurring tasks are included only if their dueDate is in range
   *   * Recurring tasks yield zero or more occurrences
   *   * Dates returned are UTC
   */
  expand(
    tasks: TaskWithRecurrence[],
    rangeStart: Date,
    rangeEnd: Date,
  ): TaskOccurrenceDto[] {
    const out: TaskOccurrenceDto[] = [];

    for (const task of tasks) {
      if (!task.recurrence) {
        if (task.dueDate >= rangeStart && task.dueDate < rangeEnd) {
          out.push(this.toOccurrence(task, task.dueDate, false));
        }
        continue;
      }

      const exceptionsByKey = indexExceptionsByDay(task.exceptions);
      const occurrences = this.expandRule(task.recurrence, rangeStart, rangeEnd);

      for (const occurrenceDate of occurrences) {
        const exception = exceptionsByKey.get(dayKey(occurrenceDate));
        if (exception?.action === ExceptionAction.SKIP) continue;

        if (exception?.action === ExceptionAction.MODIFY) {
          out.push(this.applyException(task, occurrenceDate, exception));
        } else {
          out.push(this.toOccurrence(task, occurrenceDate, true));
        }
      }
    }

    return out.sort(
      (a, b) => new Date(a.occurrenceDate).getTime() - new Date(b.occurrenceDate).getTime(),
    );
  }

  /**
   * Raw rule expansion for a single RecurrenceRule. Exposed for tests and
   * for callers that only need dates (e.g. next-occurrence preview).
   */
  expandRule(rule: RecurrenceRule, rangeStart: Date, rangeEnd: Date): Date[] {
    try {
      const rruleSet = rrulestr(rule.rruleString, { forceset: true });
      // `between` is inclusive on both ends; we want [start, end) so subtract
      // 1ms from the end. Good enough for minute-granular tasks.
      return rruleSet.between(rangeStart, new Date(rangeEnd.getTime() - 1), true);
    } catch (err) {
      this.logger.error(`Failed to expand rule ${rule.id}: ${(err as Error).message}`);
      return [];
    }
  }

  // ─── internals ─────────────────────────────────────────────────────────

  private toOccurrence(
    task: TaskWithRecurrence,
    occurrenceDate: Date,
    isRecurring: boolean,
  ): TaskOccurrenceDto {
    return {
      taskId: task.id,
      occurrenceId: `${task.id}:${occurrenceDate.toISOString()}`,
      title: task.title,
      description: task.description,
      occurrenceDate: occurrenceDate.toISOString(),
      priority: task.priority,
      status: task.status,
      tags: task.tags,
      isRecurring,
      isException: false,
    };
  }

  private applyException(
    task: TaskWithRecurrence,
    occurrenceDate: Date,
    exception: TaskException,
  ): TaskOccurrenceDto {
    return {
      taskId: task.id,
      occurrenceId: `${task.id}:${occurrenceDate.toISOString()}`,
      title: exception.title ?? task.title,
      description: exception.description ?? task.description,
      occurrenceDate: (exception.dueDate ?? occurrenceDate).toISOString(),
      priority: exception.priority ?? task.priority,
      status: exception.status ?? task.status,
      tags: task.tags,
      isRecurring: true,
      isException: true,
    };
  }
}

/** Calendar-day key in UTC. Used to match exceptions to occurrences. */
export function dayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function indexExceptionsByDay(exceptions: TaskException[]): Map<string, TaskException> {
  const map = new Map<string, TaskException>();
  for (const ex of exceptions) map.set(dayKey(ex.originalDate), ex);
  return map;
}
