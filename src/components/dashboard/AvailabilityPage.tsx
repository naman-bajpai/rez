"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CalendarClock, CalendarDays, Check, Clock, Loader2, Plus, Save, Trash2 } from "lucide-react";

type TimeBlock = {
  id: string;
  start_time: string;
  end_time: string;
  note?: string;
};

type AvailabilityDay = {
  day_of_week: number;
  label: string;
  shortLabel: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  unavailable_blocks: TimeBlock[];
};

type DateOverride = {
  date: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  unavailable_blocks: TimeBlock[];
};

const defaultAvailability: AvailabilityDay[] = [
  { day_of_week: 0, label: "Sunday", shortLabel: "Sun", start_time: "09:00", end_time: "17:00", is_active: false, unavailable_blocks: [] },
  { day_of_week: 1, label: "Monday", shortLabel: "Mon", start_time: "09:00", end_time: "17:00", is_active: true, unavailable_blocks: [] },
  { day_of_week: 2, label: "Tuesday", shortLabel: "Tue", start_time: "09:00", end_time: "17:00", is_active: true, unavailable_blocks: [] },
  { day_of_week: 3, label: "Wednesday", shortLabel: "Wed", start_time: "09:00", end_time: "17:00", is_active: true, unavailable_blocks: [] },
  { day_of_week: 4, label: "Thursday", shortLabel: "Thu", start_time: "09:00", end_time: "17:00", is_active: true, unavailable_blocks: [] },
  { day_of_week: 5, label: "Friday", shortLabel: "Fri", start_time: "09:00", end_time: "17:00", is_active: true, unavailable_blocks: [] },
  { day_of_week: 6, label: "Saturday", shortLabel: "Sat", start_time: "10:00", end_time: "15:00", is_active: false, unavailable_blocks: [] },
];

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeBlock(start = "12:00", end = "13:00"): TimeBlock {
  return { id: makeId(), start_time: start, end_time: end };
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function makeBlockInsideRange(start: string, end: string) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  const blockEnd = Math.min(endMinutes, startMinutes + 60);

  return makeBlock(
    minutesToTime(startMinutes),
    minutesToTime(blockEnd > startMinutes ? blockEnd : endMinutes)
  );
}

function normalizeBlocks(value: unknown): TimeBlock[] {
  if (!Array.isArray(value)) return [];

  const blocks: TimeBlock[] = [];
  for (const block of value) {
    if (!block || typeof block !== "object") continue;

    const candidate = block as Partial<TimeBlock>;
    const start = typeof candidate.start_time === "string" ? candidate.start_time : "12:00";
    const end = typeof candidate.end_time === "string" ? candidate.end_time : "13:00";
    const nextBlock: TimeBlock = {
      id: typeof candidate.id === "string" ? candidate.id : makeId(),
      start_time: start,
      end_time: end,
    };

    if (typeof candidate.note === "string") {
      nextBlock.note = candidate.note;
    }

    blocks.push(nextBlock);
  }

  return blocks.sort((a, b) => a.start_time.localeCompare(b.start_time));
}

function toDisplayTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toMonthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthDays(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);
  if (!year || !month) return [];

  const days: Date[] = [];
  const lastDay = new Date(year, month, 0).getDate();
  for (let day = 1; day <= lastDay; day++) {
    days.push(new Date(year, month - 1, day));
  }
  return days;
}

function validateTimeBlocks(label: string, start: string, end: string, blocks: TimeBlock[]) {
  if (!timePattern.test(start) || !timePattern.test(end) || start >= end) {
    throw new Error(`${label}: start time must be before end time`);
  }

  const sorted = [...blocks].sort((a, b) => a.start_time.localeCompare(b.start_time));
  for (let index = 0; index < sorted.length; index++) {
    const block = sorted[index];
    if (
      !timePattern.test(block.start_time) ||
      !timePattern.test(block.end_time) ||
      block.start_time >= block.end_time
    ) {
      throw new Error(`${label}: unavailable block ${index + 1} needs a valid start and end time`);
    }

    if (block.start_time < start || block.end_time > end) {
      throw new Error(`${label}: unavailable blocks must stay inside open hours`);
    }

    if (index > 0 && block.start_time < sorted[index - 1].end_time) {
      throw new Error(`${label}: unavailable blocks cannot overlap`);
    }
  }
}

function BlockEditor({
  blocks,
  disabled,
  onAdd,
  onUpdate,
  onRemove,
}: {
  blocks: TimeBlock[];
  disabled?: boolean;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Pick<TimeBlock, "start_time" | "end_time">>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium" style={{ color: "var(--dash-muted)" }}>
          Unavailable blocks
        </p>
        <Button
          type="button"
          size="sm"
          variant="dashOutline"
          className="h-8 rounded-lg px-3 text-xs"
          disabled={disabled}
          onClick={onAdd}
        >
          <Plus className="h-3.5 w-3.5" />
          Add block
        </Button>
      </div>

      {blocks.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-2 text-xs" style={{ borderColor: "var(--dash-divider)", color: "var(--dash-muted)" }}>
          No blocked time.
        </p>
      ) : (
        <div className="space-y-2">
          {blocks.map((block) => (
            <div key={block.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                type="time"
                value={block.start_time}
                disabled={disabled}
                onChange={(event) => onUpdate(block.id, { start_time: event.target.value })}
                className="dash-input h-9 rounded-lg text-sm disabled:opacity-60"
                aria-label="Unavailable block starts"
              />
              <Input
                type="time"
                value={block.end_time}
                disabled={disabled}
                onChange={(event) => onUpdate(block.id, { end_time: event.target.value })}
                className="dash-input h-9 rounded-lg text-sm disabled:opacity-60"
                aria-label="Unavailable block ends"
              />
              <Button
                type="button"
                size="icon"
                variant="dashGhost"
                className="h-9 w-9 rounded-lg"
                disabled={disabled}
                onClick={() => onRemove(block.id)}
                aria-label="Remove unavailable block"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AvailabilityPage() {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [availability, setAvailability] = useState<AvailabilityDay[]>(defaultAvailability);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [deletedOverrideDates, setDeletedOverrideDates] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(toMonthValue(new Date()));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/availability", { signal: controller.signal })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error ?? "Failed to load availability");

        const rows = Array.isArray(data.availability) ? data.availability : [];
        setAvailability((current) =>
          current.map((day) => {
            const savedDay = rows.find(
              (row: { day_of_week: number }) => row.day_of_week === day.day_of_week
            );

            return savedDay
              ? {
                  ...day,
                  start_time: savedDay.start_time ?? day.start_time,
                  end_time: savedDay.end_time ?? day.end_time,
                  is_active: Boolean(savedDay.is_active),
                  unavailable_blocks: normalizeBlocks(savedDay.unavailable_blocks),
                }
              : day;
          })
        );

        const savedOverrides = Array.isArray(data.overrides) ? data.overrides : [];
        setOverrides(
          savedOverrides.map((override: DateOverride) => ({
            date: override.date,
            start_time: override.start_time,
            end_time: override.end_time,
            is_active: Boolean(override.is_active),
            unavailable_blocks: normalizeBlocks(override.unavailable_blocks),
          }))
        );
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Failed to load availability");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const activeDays = useMemo(
    () => availability.filter((day) => day.is_active),
    [availability]
  );

  const overrideMap = useMemo(
    () => new Map(overrides.map((override) => [override.date, override])),
    [overrides]
  );

  const monthDays = useMemo(() => getMonthDays(selectedMonth), [selectedMonth]);
  const monthOffset = monthDays[0]?.getDay() ?? 0;
  const selectedOverride = overrideMap.get(selectedDate);
  const selectedWeekday = availability[new Date(`${selectedDate}T00:00:00`).getDay()];
  const selectedEffectiveSchedule = selectedOverride ?? selectedWeekday;

  const clearSavedState = () => {
    setSaved(false);
    setError(null);
  };

  const updateDay = (
    dayOfWeek: number,
    patch: Partial<Pick<AvailabilityDay, "start_time" | "end_time" | "is_active" | "unavailable_blocks">>
  ) => {
    clearSavedState();
    setAvailability((current) =>
      current.map((day) =>
        day.day_of_week === dayOfWeek ? { ...day, ...patch } : day
      )
    );
  };

  const addDayBlock = (day: AvailabilityDay) => {
    updateDay(day.day_of_week, {
      unavailable_blocks: [
        ...day.unavailable_blocks,
        makeBlockInsideRange(day.start_time, day.end_time),
      ],
    });
  };

  const updateDayBlock = (
    day: AvailabilityDay,
    blockId: string,
    patch: Partial<Pick<TimeBlock, "start_time" | "end_time">>
  ) => {
    updateDay(day.day_of_week, {
      unavailable_blocks: day.unavailable_blocks.map((block) =>
        block.id === blockId ? { ...block, ...patch } : block
      ),
    });
  };

  const removeDayBlock = (day: AvailabilityDay, blockId: string) => {
    updateDay(day.day_of_week, {
      unavailable_blocks: day.unavailable_blocks.filter((block) => block.id !== blockId),
    });
  };

  const setOverride = (nextOverride: DateOverride) => {
    clearSavedState();
    setOverrides((current) => {
      const exists = current.some((override) => override.date === nextOverride.date);
      return exists
        ? current.map((override) => override.date === nextOverride.date ? nextOverride : override)
        : [...current, nextOverride].sort((a, b) => a.date.localeCompare(b.date));
    });
    setDeletedOverrideDates((current) => current.filter((date) => date !== nextOverride.date));
  };

  const createOverride = () => {
    const source = selectedEffectiveSchedule;
    setOverride({
      date: selectedDate,
      start_time: source.start_time,
      end_time: source.end_time,
      is_active: source.is_active,
      unavailable_blocks: source.unavailable_blocks.map((block) => ({ ...block, id: makeId() })),
    });
  };

  const updateSelectedOverride = (
    patch: Partial<Pick<DateOverride, "start_time" | "end_time" | "is_active" | "unavailable_blocks">>
  ) => {
    const source = selectedOverride ?? {
      date: selectedDate,
      start_time: selectedWeekday.start_time,
      end_time: selectedWeekday.end_time,
      is_active: selectedWeekday.is_active,
      unavailable_blocks: selectedWeekday.unavailable_blocks.map((block) => ({ ...block, id: makeId() })),
    };

    setOverride({ ...source, ...patch });
  };

  const removeSelectedOverride = () => {
    clearSavedState();
    setOverrides((current) => current.filter((override) => override.date !== selectedDate));
    setDeletedOverrideDates((current) =>
      current.includes(selectedDate) ? current : [...current, selectedDate]
    );
  };

  const saveAvailability = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      for (const day of availability) {
        validateTimeBlocks(day.label, day.start_time, day.end_time, day.unavailable_blocks);
      }

      for (const override of overrides) {
        validateTimeBlocks(override.date, override.start_time, override.end_time, override.unavailable_blocks);
      }

      const res = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availability: availability.map(
            ({ day_of_week, start_time, end_time, is_active, unavailable_blocks }) => ({
              day_of_week,
              start_time,
              end_time,
              is_active,
              unavailable_blocks: unavailable_blocks.map(({ id, start_time, end_time, note }) => ({
                id,
                start_time,
                end_time,
                note,
              })),
            })
          ),
          overrides: overrides.map(({ date, start_time, end_time, is_active, unavailable_blocks }) => ({
            date,
            start_time,
            end_time,
            is_active,
            unavailable_blocks: unavailable_blocks.map(({ id, start_time, end_time, note }) => ({
              id,
              start_time,
              end_time,
              note,
            })),
          })),
          deleted_override_dates: deletedOverrideDates,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save availability");

      const savedOverrides = Array.isArray(data.overrides) ? data.overrides : overrides;
      setOverrides(
        savedOverrides.map((override: DateOverride) => ({
          date: override.date,
          start_time: override.start_time,
          end_time: override.end_time,
          is_active: Boolean(override.is_active),
          unavailable_blocks: normalizeBlocks(override.unavailable_blocks),
        }))
      );
      setDeletedOverrideDates([]);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="dash-card overflow-hidden">
        <CardHeader className="grid gap-4 border-b sm:grid-cols-[1fr_auto] sm:items-end" style={{ borderColor: "var(--dash-divider)" }}>
          <div>
            <p className="dash-eyebrow">Booking hours</p>
            <CardTitle className="dash-h1 mt-3">Availability</CardTitle>
            <CardDescription className="dash-subtitle mt-2 max-w-2xl">
              Set weekly hours, future date overrides, and blocked time inside each day.
            </CardDescription>
          </div>
          <Button
            variant="dash"
            onClick={saveAvailability}
            disabled={loading || saving}
            className="h-11 shrink-0 rounded-lg px-5"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving" : saved ? "Saved" : "Save availability"}
          </Button>
        </CardHeader>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="dash-card overflow-hidden">
            <CardHeader className="border-b pb-4" style={{ borderColor: "var(--dash-divider)" }}>
              <CardTitle className="text-lg font-semibold tracking-tight" style={{ color: "var(--dash-text)" }}>
                Weekly schedule
              </CardTitle>
              <CardDescription className="text-sm" style={{ color: "var(--dash-muted)" }}>
                These hours repeat every week unless a future date has its own schedule.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-16" style={{ color: "var(--dash-muted)" }}>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading availability...
                </div>
              ) : (
                availability.map((day) => (
                  <div key={day.day_of_week} className="dash-card-muted grid gap-4 p-3 lg:grid-cols-[150px_1fr_auto] lg:items-start">
                    <div className="flex items-center justify-between gap-3 lg:justify-start">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold" style={{ background: "var(--dash-icon-tile)", color: "var(--dash-icon-fg)" }}>
                        {day.shortLabel}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                          {day.label}
                        </p>
                        <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                          {day.is_active ? "Accepting bookings" : "Closed"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1 text-xs font-medium" style={{ color: "var(--dash-muted)" }}>
                          Opens
                          <Input
                            type="time"
                            value={day.start_time}
                            disabled={!day.is_active}
                            onChange={(event) => updateDay(day.day_of_week, { start_time: event.target.value })}
                            className="dash-input h-10 rounded-lg text-sm disabled:opacity-60"
                          />
                        </label>
                        <label className="grid gap-1 text-xs font-medium" style={{ color: "var(--dash-muted)" }}>
                          Closes
                          <Input
                            type="time"
                            value={day.end_time}
                            disabled={!day.is_active}
                            onChange={(event) => updateDay(day.day_of_week, { end_time: event.target.value })}
                            className="dash-input h-10 rounded-lg text-sm disabled:opacity-60"
                          />
                        </label>
                      </div>

                      <BlockEditor
                        blocks={day.unavailable_blocks}
                        disabled={!day.is_active}
                        onAdd={() => addDayBlock(day)}
                        onUpdate={(id, patch) => updateDayBlock(day, id, patch)}
                        onRemove={(id) => removeDayBlock(day, id)}
                      />
                    </div>

                    <Button
                      type="button"
                      variant={day.is_active ? "dash" : "dashOutline"}
                      className="h-10 rounded-lg"
                      onClick={() => updateDay(day.day_of_week, { is_active: !day.is_active })}
                    >
                      {day.is_active ? "Open" : "Closed"}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </div>

          <div className="dash-card overflow-hidden">
            <CardHeader className="border-b pb-4" style={{ borderColor: "var(--dash-divider)" }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-semibold tracking-tight" style={{ color: "var(--dash-text)" }}>
                    Future overrides
                  </CardTitle>
                  <CardDescription className="text-sm" style={{ color: "var(--dash-muted)" }}>
                    Customize a single day for travel, holidays, longer hours, or blocked time.
                  </CardDescription>
                </div>
                <label className="grid gap-1 text-xs font-medium" style={{ color: "var(--dash-muted)" }}>
                  Month
                  <Input
                    type="month"
                    min={todayKey.slice(0, 7)}
                    value={selectedMonth}
                    onChange={(event) => {
                      const nextMonth = event.target.value;
                      setSelectedMonth(nextMonth);
                      const nextDays = getMonthDays(nextMonth);
                      const firstFutureDay = nextDays.find((date) => toDateKey(date) >= todayKey) ?? nextDays[0];
                      if (firstFutureDay) setSelectedDate(toDateKey(firstFutureDay));
                    }}
                    className="dash-input h-10 rounded-lg text-sm"
                  />
                </label>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 pt-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase" style={{ color: "var(--dash-muted)" }}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: monthOffset }).map((_, index) => (
                    <span key={`blank-${index}`} aria-hidden className="aspect-square" />
                  ))}
                  {monthDays.map((date) => {
                    const key = toDateKey(date);
                    const hasOverride = overrideMap.has(key);
                    const isSelected = selectedDate === key;
                    const isPast = key < todayKey;

                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={isPast}
                        onClick={() => setSelectedDate(key)}
                        className="relative aspect-square rounded-lg border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-30"
                        style={{
                          borderColor: isSelected ? "var(--dash-accent)" : "var(--dash-divider)",
                          background: isSelected ? "var(--dash-accent)" : "var(--dash-surface)",
                          color: isSelected ? "var(--dash-accent-fg)" : "var(--dash-text)",
                        }}
                        aria-pressed={isSelected}
                      >
                        {date.getDate()}
                        {hasOverride && (
                          <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full" style={{ background: isSelected ? "var(--dash-accent-fg)" : "var(--dash-accent)" }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="dash-card-muted space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                      {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                      {selectedOverride ? "Custom schedule" : "Using weekly schedule"}
                    </p>
                  </div>
                  {selectedOverride ? (
                    <Button type="button" variant="dashOutline" size="sm" className="h-8 rounded-lg text-xs" onClick={removeSelectedOverride}>
                      Remove
                    </Button>
                  ) : (
                    <Button type="button" variant="dash" size="sm" className="h-8 rounded-lg text-xs" onClick={createOverride}>
                      Customize
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs font-medium" style={{ color: "var(--dash-muted)" }}>
                    Opens
                    <Input
                      type="time"
                      value={selectedEffectiveSchedule.start_time}
                      disabled={!selectedOverride || !selectedEffectiveSchedule.is_active}
                      onChange={(event) => updateSelectedOverride({ start_time: event.target.value })}
                      className="dash-input h-10 rounded-lg text-sm disabled:opacity-60"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium" style={{ color: "var(--dash-muted)" }}>
                    Closes
                    <Input
                      type="time"
                      value={selectedEffectiveSchedule.end_time}
                      disabled={!selectedOverride || !selectedEffectiveSchedule.is_active}
                      onChange={(event) => updateSelectedOverride({ end_time: event.target.value })}
                      className="dash-input h-10 rounded-lg text-sm disabled:opacity-60"
                    />
                  </label>
                </div>

                <Button
                  type="button"
                  variant={selectedEffectiveSchedule.is_active ? "dash" : "dashOutline"}
                  className="h-10 w-full rounded-lg"
                  disabled={!selectedOverride}
                  onClick={() => updateSelectedOverride({ is_active: !selectedEffectiveSchedule.is_active })}
                >
                  {selectedEffectiveSchedule.is_active ? "Open on this date" : "Closed on this date"}
                </Button>

                <BlockEditor
                  blocks={selectedEffectiveSchedule.unavailable_blocks}
                  disabled={!selectedOverride || !selectedEffectiveSchedule.is_active}
                  onAdd={() =>
                    updateSelectedOverride({
                      unavailable_blocks: [
                        ...selectedEffectiveSchedule.unavailable_blocks,
                        makeBlockInsideRange(
                          selectedEffectiveSchedule.start_time,
                          selectedEffectiveSchedule.end_time
                        ),
                      ],
                    })
                  }
                  onUpdate={(id, patch) =>
                    updateSelectedOverride({
                      unavailable_blocks: selectedEffectiveSchedule.unavailable_blocks.map((block) =>
                        block.id === id ? { ...block, ...patch } : block
                      ),
                    })
                  }
                  onRemove={(id) =>
                    updateSelectedOverride({
                      unavailable_blocks: selectedEffectiveSchedule.unavailable_blocks.filter((block) => block.id !== id),
                    })
                  }
                />
              </div>
            </CardContent>
          </div>
        </div>

        <div className="dash-card h-fit overflow-hidden">
          <CardHeader>
            <div className="dash-icon-circle mb-1 h-10 w-10">
              <CalendarClock className="h-4 w-4" />
            </div>
            <CardTitle className="text-lg font-semibold tracking-tight" style={{ color: "var(--dash-text)" }}>
              Booking window
            </CardTitle>
            <CardDescription className="text-sm leading-6" style={{ color: "var(--dash-muted)" }}>
              Guests only see slots inside active hours, minus bookings and unavailable blocks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" style={{ backgroundColor: "var(--dash-divider)" }} />
            <div className="space-y-4">
              {activeDays.length === 0 ? (
                <p className="dash-empty px-3 py-4 text-sm" style={{ color: "var(--dash-muted)" }}>
                  No bookable days are active yet.
                </p>
              ) : (
                activeDays.map((day) => (
                  <div key={day.day_of_week} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="secondary" className="rounded-lg" style={{ background: "var(--dash-icon-tile)", color: "var(--dash-text)" }}>
                        {day.shortLabel}
                      </Badge>
                      <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--dash-text-secondary)" }}>
                        <Clock className="h-3.5 w-3.5" style={{ color: "var(--dash-muted)" }} />
                        {toDisplayTime(day.start_time)} - {toDisplayTime(day.end_time)}
                      </span>
                    </div>
                    {day.unavailable_blocks.length > 0 && (
                      <div className="space-y-1 pl-12">
                        {day.unavailable_blocks.map((block) => (
                          <p key={block.id} className="text-xs" style={{ color: "var(--dash-muted)" }}>
                            Blocked {toDisplayTime(block.start_time)} - {toDisplayTime(block.end_time)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <Separator className="my-4" style={{ backgroundColor: "var(--dash-divider)" }} />
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
              <CalendarDays className="h-4 w-4" style={{ color: "var(--dash-muted)" }} />
              {overrides.length} future override{overrides.length === 1 ? "" : "s"}
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
}
