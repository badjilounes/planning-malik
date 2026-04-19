/**
 * Return the start of the given date in UTC (00:00:00.000).
 */
export function startOfUtcDay(input: Date): Date {
  const d = new Date(input);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Return the end of the given date in UTC (23:59:59.999).
 */
export function endOfUtcDay(input: Date): Date {
  const d = new Date(input);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * True if `a` and `b` fall on the same UTC calendar day.
 */
export function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/**
 * Parse an ISO datetime or date string. Throws on invalid input — we
 * prefer fail-fast at the boundary over silent NaN propagation.
 */
export function parseIsoStrict(value: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid ISO date: ${value}`);
  }
  return d;
}
