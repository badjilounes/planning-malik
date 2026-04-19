import type { TaskPriority, TaskStatus } from './enums';
import type { RecurrenceRuleDto } from './recurrence.types';

export interface TaskDto {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  recurrence: RecurrenceRuleDto | null;
}

/**
 * A single occurrence of a task as rendered on a view. For non-recurring
 * tasks this is identical to the Task. For recurring tasks it's the result
 * of rule expansion + exception merging.
 */
export interface TaskOccurrenceDto {
  taskId: string;
  /** Unique per (taskId, occurrenceDate) — used as React key. */
  occurrenceId: string;
  title: string;
  description: string | null;
  /** ISO datetime. */
  occurrenceDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  isRecurring: boolean;
  /** True if this occurrence has a MODIFY exception applied. */
  isException: boolean;
}
