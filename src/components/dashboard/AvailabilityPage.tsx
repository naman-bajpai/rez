"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CalendarClock, Check, Clock, Loader2, Save } from "lucide-react";

type AvailabilityDay = {
  day_of_week: number;
  label: string;
  shortLabel: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

const defaultAvailability: AvailabilityDay[] = [
  { day_of_week: 0, label: "Sunday", shortLabel: "Sun", start_time: "09:00", end_time: "17:00", is_active: false },
  { day_of_week: 1, label: "Monday", shortLabel: "Mon", start_time: "09:00", end_time: "17:00", is_active: true },
  { day_of_week: 2, label: "Tuesday", shortLabel: "Tue", start_time: "09:00", end_time: "17:00", is_active: true },
  { day_of_week: 3, label: "Wednesday", shortLabel: "Wed", start_time: "09:00", end_time: "17:00", is_active: true },
  { day_of_week: 4, label: "Thursday", shortLabel: "Thu", start_time: "09:00", end_time: "17:00", is_active: true },
  { day_of_week: 5, label: "Friday", shortLabel: "Fri", start_time: "09:00", end_time: "17:00", is_active: true },
  { day_of_week: 6, label: "Saturday", shortLabel: "Sat", start_time: "10:00", end_time: "15:00", is_active: false },
];

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

export function AvailabilityPage() {
  const [availability, setAvailability] = useState<AvailabilityDay[]>(defaultAvailability);
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
                }
              : day;
          })
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

  const updateDay = (
    dayOfWeek: number,
    patch: Partial<Pick<AvailabilityDay, "start_time" | "end_time" | "is_active">>
  ) => {
    setSaved(false);
    setError(null);
    setAvailability((current) =>
      current.map((day) =>
        day.day_of_week === dayOfWeek ? { ...day, ...patch } : day
      )
    );
  };

  const saveAvailability = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const invalid = availability.find((day) => day.start_time >= day.end_time);
      if (invalid) {
        throw new Error(`${invalid.label}: start time must be before end time`);
      }

      const res = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availability: availability.map(
            ({ day_of_week, start_time, end_time, is_active }) => ({
              day_of_week,
              start_time,
              end_time,
              is_active,
            })
          ),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save availability");

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-zinc-200 bg-[oklch(0.997_0.005_95)] shadow-[0_30px_90px_-60px_rgba(39,39,42,0.7)]">
        <CardHeader className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Booking hours
            </p>
            <CardTitle className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">
              Availability
            </CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              Choose the days and hours guests can book appointments.
            </CardDescription>
          </div>
          <Button
            onClick={saveAvailability}
            disabled={loading || saving}
            className="h-11 rounded-lg bg-zinc-950 px-5 text-[#fbfaf7] hover:bg-zinc-800"
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
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden border-zinc-200 bg-[oklch(0.997_0.005_95)] shadow-[0_30px_90px_-60px_rgba(39,39,42,0.7)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold tracking-tight text-zinc-950">
              Weekly schedule
            </CardTitle>
            <CardDescription className="text-sm text-zinc-500">
              Inactive days will not appear in booking slots.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-16 text-zinc-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading availability...
              </div>
            ) : (
              availability.map((day) => (
                <div
                  key={day.day_of_week}
                  className="grid gap-3 rounded-lg border border-zinc-200 bg-white/80 p-3 sm:grid-cols-[150px_1fr_auto] sm:items-center"
                >
                  <div className="flex items-center justify-between gap-3 sm:justify-start">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-700">
                      {day.shortLabel}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-950">{day.label}</p>
                      <p className="text-xs text-zinc-500">
                        {day.is_active ? "Accepting bookings" : "Closed"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1 text-xs font-medium text-zinc-500">
                      Opens
                      <Input
                        type="time"
                        value={day.start_time}
                        disabled={!day.is_active}
                        onChange={(event) =>
                          updateDay(day.day_of_week, { start_time: event.target.value })
                        }
                        className="h-10 rounded-lg border-zinc-200 bg-white text-sm text-zinc-950 disabled:bg-zinc-50"
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-zinc-500">
                      Closes
                      <Input
                        type="time"
                        value={day.end_time}
                        disabled={!day.is_active}
                        onChange={(event) =>
                          updateDay(day.day_of_week, { end_time: event.target.value })
                        }
                        className="h-10 rounded-lg border-zinc-200 bg-white text-sm text-zinc-950 disabled:bg-zinc-50"
                      />
                    </label>
                  </div>

                  <Button
                    type="button"
                    variant={day.is_active ? "default" : "outline"}
                    className={
                      day.is_active
                        ? "h-10 rounded-lg bg-zinc-950 text-[#fbfaf7] hover:bg-zinc-800"
                        : "h-10 rounded-lg border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                    }
                    onClick={() =>
                      updateDay(day.day_of_week, { is_active: !day.is_active })
                    }
                  >
                    {day.is_active ? "Open" : "Closed"}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="h-fit border-zinc-200 bg-white/82 shadow-[0_24px_80px_-64px_rgba(39,39,42,0.8)]">
          <CardHeader>
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
              <CalendarClock className="h-4 w-4" />
            </div>
            <CardTitle className="text-lg font-semibold tracking-tight text-zinc-950">
              Booking window
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-zinc-500">
              Guests only see slots inside active days, minus existing pending and confirmed bookings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4 bg-zinc-200" />
            <div className="space-y-3">
              {activeDays.length === 0 ? (
                <p className="rounded-lg bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
                  No bookable days are active yet.
                </p>
              ) : (
                activeDays.map((day) => (
                  <div key={day.day_of_week} className="flex items-center justify-between gap-3">
                    <Badge variant="secondary" className="rounded-lg bg-zinc-100 text-zinc-700">
                      {day.shortLabel}
                    </Badge>
                    <span className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      {toDisplayTime(day.start_time)} - {toDisplayTime(day.end_time)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
