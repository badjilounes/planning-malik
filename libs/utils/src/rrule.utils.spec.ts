import { buildRruleString } from './rrule.utils';

describe('buildRruleString', () => {
  const startsOn = new Date(Date.UTC(2026, 0, 1, 9, 0, 0));

  it('builds a DAILY rule', () => {
    const s = buildRruleString({ freq: 'DAILY', startsOn });
    expect(s).toContain('DTSTART:20260101T090000Z');
    expect(s).toContain('FREQ=DAILY');
    expect(s).not.toContain('INTERVAL=');
  });

  it('includes INTERVAL when > 1', () => {
    const s = buildRruleString({ freq: 'DAILY', interval: 3, startsOn });
    expect(s).toContain('INTERVAL=3');
  });

  it('maps ISO weekdays to RFC 5545 tokens (WEEKLY)', () => {
    const s = buildRruleString({
      freq: 'WEEKLY',
      byWeekday: [0, 2, 4], // Mon, Wed, Fri
      startsOn,
    });
    expect(s).toContain('BYDAY=MO,WE,FR');
  });

  it('supports BYMONTHDAY for MONTHLY', () => {
    const s = buildRruleString({ freq: 'MONTHLY', byMonthDay: [1, 15], startsOn });
    expect(s).toContain('BYMONTHDAY=1,15');
  });

  it('prefers COUNT over UNTIL when both supplied', () => {
    const s = buildRruleString({
      freq: 'DAILY',
      startsOn,
      endsOn: new Date(Date.UTC(2026, 5, 1)),
      count: 10,
    });
    expect(s).toContain('COUNT=10');
    expect(s).not.toContain('UNTIL=');
  });

  it('emits UNTIL when endsOn is provided without count', () => {
    const endsOn = new Date(Date.UTC(2026, 5, 1, 0, 0, 0));
    const s = buildRruleString({ freq: 'DAILY', startsOn, endsOn });
    expect(s).toContain('UNTIL=20260601T000000Z');
  });

  it('rejects out-of-range weekdays', () => {
    expect(() =>
      buildRruleString({ freq: 'WEEKLY', byWeekday: [7], startsOn }),
    ).toThrow(/byWeekday/);
  });

  it('rejects out-of-range month days', () => {
    expect(() =>
      buildRruleString({ freq: 'MONTHLY', byMonthDay: [32], startsOn }),
    ).toThrow(/byMonthDay/);
  });
});
