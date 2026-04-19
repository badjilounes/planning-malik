'use client';

import { useState } from 'react';
import { RecurrenceFreq, type RecurrenceRuleDto } from '@planning/types';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/cn';

// 0=Lun..6=Dim (ISO) — matches backend convention.
const WEEKDAYS = [
  { iso: 0, label: 'Lun' },
  { iso: 1, label: 'Mar' },
  { iso: 2, label: 'Mer' },
  { iso: 3, label: 'Jeu' },
  { iso: 4, label: 'Ven' },
  { iso: 5, label: 'Sam' },
  { iso: 6, label: 'Dim' },
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
          <Label htmlFor="freq">Fréquence</Label>
          <Select
            id="freq"
            name="freq"
            value={freq}
            onChange={(e) => setFreq(e.target.value as RecurrenceFreq)}
          >
            <option value={RecurrenceFreq.DAILY}>Quotidien</option>
            <option value={RecurrenceFreq.WEEKLY}>Hebdomadaire</option>
            <option value={RecurrenceFreq.MONTHLY}>Mensuel</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="interval">Tous les</Label>
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
                ? 'jour(s)'
                : freq === RecurrenceFreq.WEEKLY
                  ? 'semaine(s)'
                  : 'mois'}
            </span>
          </div>
        </div>
      </div>

      {freq === RecurrenceFreq.WEEKLY && (
        <div>
          <Label>Répéter le</Label>
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
              Choisissez au moins un jour, sinon la règle repart du jour de début.
            </p>
          )}
        </div>
      )}

      {freq === RecurrenceFreq.MONTHLY && (
        <div>
          <Label htmlFor="byMonthDay">Jours du mois</Label>
          <Input
            id="byMonthDay"
            name="byMonthDay"
            defaultValue={initial?.byMonthDay?.join(', ') ?? ''}
            placeholder="ex. 1, 15"
          />
          <p className="mt-1 text-xs text-fg-subtle">
            Séparés par virgule. Vide = même jour que la date de début.
          </p>
        </div>
      )}
    </div>
  );
}
