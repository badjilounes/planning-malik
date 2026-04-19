const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * "Today · 14:30" / "Tomorrow · 09:00" / "Mon, May 5 · 14:30"
 * Relative labels for the next few days, calendar format beyond that.
 */
export function formatOccurrence(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const label = relativeDayLabel(d, now);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${label} · ${time}`;
}

export function formatDay(iso: string, now = new Date()): string {
  return relativeDayLabel(new Date(iso), now);
}

function relativeDayLabel(d: Date, now: Date): string {
  const diff = Math.floor((startOfDay(d).getTime() - startOfDay(now).getTime()) / DAY_MS);
  if (diff === -1) return 'Hier';
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff > 1 && diff < 7) {
    return d.toLocaleDateString('fr-FR', { weekday: 'long' });
  }
  return d.toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' });
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function groupByDay<T extends { occurrenceDate: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = item.occurrenceDate.slice(0, 10);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return map;
}
