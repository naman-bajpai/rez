"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="dash-card overflow-hidden">
        <CardHeader className="grid gap-4 border-b sm:grid-cols-[1fr_auto] sm:items-end" style={{ borderColor: "var(--dash-divider)" }}>
          <div>
            <p className="dash-eyebrow">Booking hours</p>
            <CardTitle className="dash-h1 mt-3">Availability</CardTitle>
            <CardDescription className="dash-subtitle mt-2 max-w-2xl">
              Choose the days and hours guests can book appointments.
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="dash-card overflow-hidden">
          <CardHeader className="border-b pb-4" style={{ borderColor: "var(--dash-divider)" }}>
            <CardTitle className="text-lg font-semibold tracking-tight" style={{ color: "var(--dash-text)" }}>
              Weekly schedule
            </CardTitle>
            <CardDescription className="text-sm" style={{ color: "var(--dash-muted)" }}>
              Inactive days will not appear in booking slots.
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
                <div
                  key={day.day_of_week}
                  className="dash-card-muted grid gap-3 p-3 sm:grid-cols-[150px_1fr_auto] sm:items-center"
                >
                  <div className="flex items-center justify-between gap-3 sm:justify-start">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
                      style={{
                        background: "var(--dash-icon-tile)",
                        color: "var(--dash-icon-fg)",
                      }}
                    >
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

                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1 text-xs font-medium" style={{ color: "var(--dash-muted)" }}>
                      Opens
                      <Input
                        type="time"
                        value={day.start_time}
                        disabled={!day.is_active}
                        onChange={(event) =>
                          updateDay(day.day_of_week, { start_time: event.target.value })
                        }
                        className="dash-input h-10 rounded-lg text-sm disabled:opacity-60"
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-medium" style={{ color: "var(--dash-muted)" }}>
                      Closes
                      <Input
                        type="time"
                        value={day.end_time}
                        disabled={!day.is_active}
                        onChange={(event) =>
                          updateDay(day.day_of_week, { end_time: event.target.value })
                        }
                        className="dash-input h-10 rounded-lg text-sm disabled:opacity-60"
                      />
                    </label>
                  </div>

                  <Button
                    type="button"
                    variant={day.is_active ? "dash" : "dashOutline"}
                    className="h-10 rounded-lg"
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
              Guests only see slots inside active days, minus existing pending and confirmed bookings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" style={{ backgroundColor: "var(--dash-divider)" }} />
            <div className="space-y-3">
              {activeDays.length === 0 ? (
                <p className="dash-empty px-3 py-4 text-sm" style={{ color: "var(--dash-muted)" }}>
                  No bookable days are active yet.
                </p>
              ) : (
                activeDays.map((day) => (
                  <div key={day.day_of_week} className="flex items-center justify-between gap-3">
                    <Badge variant="secondary" className="rounded-lg" style={{ background: "var(--dash-icon-tile)", color: "var(--dash-text)" }}>
                      {day.shortLabel}
                    </Badge>
                    <span
                      className="flex items-center gap-2 text-sm font-medium"
                      style={{ color: "var(--dash-text-secondary)" }}
                    >
                      <Clock className="h-3.5 w-3.5" style={{ color: "var(--dash-muted)" }} />
                      {toDisplayTime(day.start_time)} - {toDisplayTime(day.end_time)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
}
