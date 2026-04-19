'use client';

import { useState } from 'react';
import { RecurrenceFreq, type RecurrenceRuleDto } from '@planning/types';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/cn';

// 0=Mon..6=Sun (ISO) — matches backend convention.
const WEEKDAYS = [
  { iso: 0, label: 'Mon' },
  { iso: 1, label: 'Tue' },
  { iso: 2, label: 'Wed' },
  { iso: 3, label: 'Thu' },
  { iso: 4, label: 'Fri' },
  { iso: 5, label: 'Sat' },
  { iso: 6, label: 'Sun' },
];

export function RecurrenceEditor({ initial }: { initial: RecurrenceRuleDto | null }) {
  const [freq, setFreq] = useState<RecurrenceFreq>(initial?.freq ?? RecurrenceFreq.WEEKLY);
  const [byWeekday, setByWeekday] = useState<number[]>(initial?.byWeekday ?? []);

  const toggleWeekday = (iso: number) => {
    setByWeekday((prev) =>
      prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso].sort(),
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="freq">Frequency</Label>
          <Select
            id="freq"
            name="freq"
            value={freq}
            onChange={(e) => setFreq(e.target.value as RecurrenceFreq)}
          >
            <option value={RecurrenceFreq.DAILY}>Daily</option>
            <option value={RecurrenceFreq.WEEKLY}>Weekly</option>
            <option value={RecurrenceFreq.MONTHLY}>Monthly</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="interval">Every</Label>
          <div className="flex items-center gap-2">
            <Input
              id="interval"
              name="interval"
              type="number"
              min={1}
              max={365}
              defaultValue={initial?.interval ?? 1}
            />
            <span className="text-xs text-fg-muted">
              {freq === RecurrenceFreq.DAILY
                ? 'day(s)'
                : freq === RecurrenceFreq.WEEKLY
                  ? 'week(s)'
                  : 'month(s)'}
            </span>
          </div>
        </div>
      </div>

      {freq === RecurrenceFreq.WEEKLY && (
        <div>
          <Label>Repeat on</Label>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((d) => {
              const on = byWeekday.includes(d.iso);
              return (
                <label
                  key={d.iso}
                  className={cn(
                    'cursor-pointer select-none rounded-full border px-3 py-1.5 text-xs transition-colors',
                    on
                      ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                      : 'border-border bg-surface-elevated text-fg-muted hover:border-fg-subtle',
                  )}
                >
                  <input
                    type="checkbox"
                    name="byWeekday"
                    value={d.iso}
                    checked={on}
                    onChange={() => toggleWeekday(d.iso)}
                    className="sr-only"
                  />
                  {d.label}
                </label>
              );
            })}
          </div>
          {byWeekday.length === 0 && (
            <p className="mt-1 text-xs text-fg-subtle">
              Pick at least one day or the rule falls back to the start day.
            </p>
          )}
        </div>
      )}

      {freq === RecurrenceFreq.MONTHLY && (
        <div>
          <Label htmlFor="byMonthDay">Days of month</Label>
          <Input
            id="byMonthDay"
            name="byMonthDay"
            defaultValue={initial?.byMonthDay?.join(', ') ?? ''}
            placeholder="e.g. 1, 15"
          />
          <p className="mt-1 text-xs text-fg-subtle">
            Comma-separated. Leave empty to use the same day each month as the start date.
          </p>
        </div>
      )}
    </div>
  );
}
