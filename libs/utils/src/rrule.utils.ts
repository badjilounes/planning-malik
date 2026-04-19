import { RecurrenceFreq } from '@planning/types';

export interface BuildRruleInput {
  freq: RecurrenceFreq;
  interval?: number;
  byWeekday?: number[]; // 0=Monday..6=Sunday (ISO)
  byMonthDay?: number[];
  startsOn: Date;
  endsOn?: Date | null;
  count?: number | null;
}

const FREQ_MAP: Record<RecurrenceFreq, string> = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  CUSTOM: 'DAILY', // CUSTOM is surfaced to users but stored as a tweaked DAILY/WEEKLY rule.
};

// RFC 5545 day tokens. Our internal 0..6 is Mon..Sun (ISO).
const ISO_WEEKDAY_TO_RFC = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

/**
 * Build a canonical RFC 5545 RRULE string from our structured input.
 *
 * The returned string is what gets stored in `RecurrenceRule.rruleString`
 * and fed to the `rrule` library for expansion.
 */
export function buildRruleString(input: BuildRruleInput): string {
  const parts: string[] = [];

  parts.push(`FREQ=${FREQ_MAP[input.freq]}`);

  if (input.interval && input.interval > 1) {
    parts.push(`INTERVAL=${input.interval}`);
  }

  if (input.freq === 'WEEKLY' && input.byWeekday?.length) {
    const days = input.byWeekday
      .map((d) => {
        if (d < 0 || d > 6) throw new Error(`byWeekday out of range: ${d}`);
        return ISO_WEEKDAY_TO_RFC[d];
      })
      .join(',');
    parts.push(`BYDAY=${days}`);
  }

  if (input.freq === 'MONTHLY' && input.byMonthDay?.length) {
    for (const d of input.byMonthDay) {
      if (d < 1 || d > 31) throw new Error(`byMonthDay out of range: ${d}`);
    }
    parts.push(`BYMONTHDAY=${input.byMonthDay.join(',')}`);
  }

  if (input.count != null) {
    parts.push(`COUNT=${input.count}`);
  } else if (input.endsOn) {
    parts.push(`UNTIL=${formatRruleDate(input.endsOn)}`);
  }

  // DTSTART goes in its own line per RFC 5545.
  return `DTSTART:${formatRruleDate(input.startsOn)}\nRRULE:${parts.join(';')}`;
}

function formatRruleDate(d: Date): string {
  // YYYYMMDDTHHmmssZ
  const pad = (n: number, width = 2) => n.toString().padStart(width, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}
