"use client"

import { useMemo } from "react"
import { Repeat } from "lucide-react"
import { RecurrenceFreq, type RecurrenceRuleInput } from "@planning/types"
import { Input } from "@/components/shadcn/ui/input"
import { Label } from "@/components/shadcn/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/ui/select"
import { cn } from "@/lib/utils"

export type RecurrencePreset =
  | "none"
  | "daily"
  | "weekdays"
  | "weekly"
  | "monthly"
  | "custom"

export interface RecurrenceState {
  preset: RecurrencePreset
  interval: number
  customFreq: RecurrenceFreq
  byWeekday: number[]
  endMode: "never" | "on" | "after"
  endDate: string
  count: number
}

export const defaultRecurrenceState: RecurrenceState = {
  preset: "none",
  interval: 1,
  customFreq: RecurrenceFreq.WEEKLY,
  byWeekday: [],
  endMode: "never",
  endDate: "",
  count: 10,
}

// ISO weekday: 0 = Mon .. 6 = Sun (matches the backend convention).
const WEEKDAYS = [
  { iso: 0, short: "L", label: "Lundi" },
  { iso: 1, short: "M", label: "Mardi" },
  { iso: 2, short: "M", label: "Mercredi" },
  { iso: 3, short: "J", label: "Jeudi" },
  { iso: 4, short: "V", label: "Vendredi" },
  { iso: 5, short: "S", label: "Samedi" },
  { iso: 6, short: "D", label: "Dimanche" },
]

const WEEKDAY_LABELS = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
]

export function isoWeekdayOf(date: Date): number {
  // Date#getDay: 0=Sun..6=Sat → shift to 0=Mon..6=Sun.
  return (date.getDay() + 6) % 7
}

export function recurrenceLabel(state: RecurrenceState, startDate: Date | undefined): string {
  switch (state.preset) {
    case "none":
      return "Ne se répète pas"
    case "daily":
      return "Tous les jours"
    case "weekdays":
      return "Tous les jours de la semaine"
    case "weekly":
      return startDate
        ? `Toutes les semaines le ${WEEKDAY_LABELS[isoWeekdayOf(startDate)]}`
        : "Toutes les semaines"
    case "monthly":
      return startDate
        ? `Tous les mois le ${startDate.getDate()}`
        : "Tous les mois"
    case "custom":
      return "Personnalisée"
  }
}

/** Convert UI state + start date to the API payload, or null if no recurrence. */
export function toRecurrenceInput(
  state: RecurrenceState,
  startDate: Date | undefined,
): RecurrenceRuleInput | null {
  if (state.preset === "none" || !startDate) return null

  const base = {
    startsOn: startDate.toISOString(),
    ...(state.endMode === "on" && state.endDate
      ? { endsOn: new Date(state.endDate).toISOString() }
      : {}),
    ...(state.endMode === "after" && state.count > 0 ? { count: state.count } : {}),
  }

  switch (state.preset) {
    case "daily":
      return { ...base, freq: RecurrenceFreq.DAILY, interval: 1 }
    case "weekdays":
      return {
        ...base,
        freq: RecurrenceFreq.WEEKLY,
        interval: 1,
        byWeekday: [0, 1, 2, 3, 4],
      }
    case "weekly":
      return {
        ...base,
        freq: RecurrenceFreq.WEEKLY,
        interval: 1,
        byWeekday: [isoWeekdayOf(startDate)],
      }
    case "monthly":
      return {
        ...base,
        freq: RecurrenceFreq.MONTHLY,
        interval: 1,
        byMonthDay: [startDate.getDate()],
      }
    case "custom":
      return {
        ...base,
        freq: state.customFreq,
        interval: Math.max(1, state.interval),
        ...(state.customFreq === RecurrenceFreq.WEEKLY && state.byWeekday.length > 0
          ? { byWeekday: [...state.byWeekday].sort() }
          : {}),
        ...(state.customFreq === RecurrenceFreq.MONTHLY && startDate
          ? { byMonthDay: [startDate.getDate()] }
          : {}),
      }
  }
}

export function RecurrenceSection({
  state,
  onChange,
  startDate,
}: {
  state: RecurrenceState
  onChange: (next: RecurrenceState) => void
  startDate: Date | undefined
}) {
  const options = useMemo(
    () => [
      { value: "none", label: "Ne se répète pas" },
      { value: "daily", label: "Tous les jours" },
      { value: "weekdays", label: "Tous les jours de la semaine" },
      {
        value: "weekly",
        label: startDate
          ? `Toutes les semaines le ${WEEKDAY_LABELS[isoWeekdayOf(startDate)]}`
          : "Toutes les semaines",
      },
      {
        value: "monthly",
        label: startDate ? `Tous les mois le ${startDate.getDate()}` : "Tous les mois",
      },
      { value: "custom", label: "Personnalisée…" },
    ],
    [startDate],
  )

  const toggleWeekday = (iso: number) => {
    const next = state.byWeekday.includes(iso)
      ? state.byWeekday.filter((d) => d !== iso)
      : [...state.byWeekday, iso]
    onChange({ ...state, byWeekday: next })
  }

  const unit =
    state.customFreq === RecurrenceFreq.DAILY
      ? "jour(s)"
      : state.customFreq === RecurrenceFreq.WEEKLY
        ? "semaine(s)"
        : state.customFreq === RecurrenceFreq.MONTHLY
          ? "mois"
          : "unité(s)"

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Repeat className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Récurrence</Label>
      </div>

      <Select
        value={state.preset}
        onValueChange={(value: string) =>
          onChange({ ...state, preset: value as RecurrencePreset })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {state.preset === "custom" && (
        <div className="animate-in fade-in slide-in-from-top-1 space-y-3 rounded-lg border bg-muted/40 p-3 duration-200">
          <div className="grid grid-cols-[auto_1fr_1fr] items-end gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="rec-interval" className="text-xs text-muted-foreground">
                Répéter tous les
              </Label>
              <Input
                id="rec-interval"
                type="number"
                min={1}
                max={365}
                value={state.interval}
                onChange={(e) =>
                  onChange({
                    ...state,
                    interval: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className="w-20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Unité</Label>
              <Select
                value={state.customFreq}
                onValueChange={(value: string) =>
                  onChange({ ...state, customFreq: value as RecurrenceFreq })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RecurrenceFreq.DAILY}>jour(s)</SelectItem>
                  <SelectItem value={RecurrenceFreq.WEEKLY}>semaine(s)</SelectItem>
                  <SelectItem value={RecurrenceFreq.MONTHLY}>mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pb-2 text-xs text-muted-foreground">
              {state.interval > 1 ? unit : unit.replace("(s)", "")}
            </div>
          </div>

          {state.customFreq === RecurrenceFreq.WEEKLY && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Jours de la semaine</Label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d) => {
                  const on = state.byWeekday.includes(d.iso)
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => toggleWeekday(d.iso)}
                      aria-pressed={on}
                      aria-label={d.label}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                        on
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-primary/60 hover:text-foreground",
                      )}
                    >
                      {d.short}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {state.preset !== "none" && (
        <div className="animate-in fade-in slide-in-from-top-1 space-y-2 rounded-lg border bg-muted/40 p-3 duration-200">
          <Label className="text-xs text-muted-foreground">Fin de la récurrence</Label>
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="end-mode"
                className="h-4 w-4 accent-[color:var(--color-primary)]"
                checked={state.endMode === "never"}
                onChange={() => onChange({ ...state, endMode: "never" })}
              />
              <span>Jamais</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="end-mode"
                className="h-4 w-4 accent-[color:var(--color-primary)]"
                checked={state.endMode === "on"}
                onChange={() => onChange({ ...state, endMode: "on" })}
              />
              <span className="min-w-[3.75rem]">À la date</span>
              <Input
                type="date"
                value={state.endDate}
                disabled={state.endMode !== "on"}
                onChange={(e) => onChange({ ...state, endDate: e.target.value })}
                className="h-8 w-auto flex-1"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="end-mode"
                className="h-4 w-4 accent-[color:var(--color-primary)]"
                checked={state.endMode === "after"}
                onChange={() => onChange({ ...state, endMode: "after" })}
              />
              <span className="min-w-[3.75rem]">Après</span>
              <Input
                type="number"
                min={1}
                max={1000}
                value={state.count}
                disabled={state.endMode !== "after"}
                onChange={(e) =>
                  onChange({
                    ...state,
                    count: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className="h-8 w-20"
              />
              <span className="text-muted-foreground">occurrence(s)</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
