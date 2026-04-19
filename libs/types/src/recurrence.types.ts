import type { RecurrenceFreq } from './enums';

export interface RecurrenceRuleInput {
  freq: RecurrenceFreq;
  interval?: number;
  /** 0=Monday..6=Sunday (ISO). Used when freq = WEEKLY. */
  byWeekday?: number[];
  /** 1..31. Used when freq = MONTHLY. */
  byMonthDay?: number[];
  /** ISO date (YYYY-MM-DD) or full ISO datetime. */
  startsOn: string;
  /** ISO date. If null, rule is open-ended. */
  endsOn?: string | null;
  /** Max number of occurrences. If null, open-ended. */
  count?: number | null;
}

export interface RecurrenceRuleDto {
  id: string;
  freq: RecurrenceFreq;
  interval: number;
  byWeekday: number[];
  byMonthDay: number[];
  startsOn: string;
  endsOn: string | null;
  count: number | null;
  rruleString: string;
}
