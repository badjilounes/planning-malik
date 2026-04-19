// Mirrors libs/data-access/prisma/schema.prisma. Kept in sync by hand —
// this lib intentionally has no Prisma dependency so it's safe to import
// from edge / client runtimes.

export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const RecurrenceFreq = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  CUSTOM: 'CUSTOM',
} as const;
export type RecurrenceFreq = (typeof RecurrenceFreq)[keyof typeof RecurrenceFreq];

export const ExceptionAction = {
  SKIP: 'SKIP',
  MODIFY: 'MODIFY',
} as const;
export type ExceptionAction = (typeof ExceptionAction)[keyof typeof ExceptionAction];
