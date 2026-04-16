"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Bot, CheckCircle2, Loader2 } from "lucide-react";

type BookingMode = "calendar" | "ai_chat";

const modes: {
  id: BookingMode;
  icon: React.ReactNode;
  title: string;
  description: string;
}[] = [
  {
    id: "calendar",
    icon: <CalendarDays className="h-5 w-5" />,
    title: "Calendar booking",
    description: "Customers pick a service and choose from a calendar of available time slots — clean and familiar.",
  },
  {
    id: "ai_chat",
    icon: <Bot className="h-5 w-5" />,
    title: "AI chat booking",
    description: "An AI assistant guides customers through booking via natural conversation — no forms, just chat.",
  },
];

export function BookingModeSelector() {
  const [currentMode, setCurrentMode] = useState<BookingMode>("calendar");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/booking-mode")
      .then((r) => r.json())
      .then((d: { booking_mode?: BookingMode }) => {
        setCurrentMode(d.booking_mode ?? "calendar");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const select = async (mode: BookingMode) => {
    if (mode === currentMode || saving) return;
    setSaving(true);
    setSaved(false);

    const res = await fetch("/api/settings/booking-mode", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_mode: mode }),
    });

    if (res.ok) {
      setCurrentMode(mode);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div
        className="flex items-center gap-2 rounded-2xl p-4 text-sm"
        style={{ color: "var(--dash-muted)", background: "var(--dash-surface-muted)" }}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
      }}
    >
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
          Booking experience
        </p>
        {saved && (
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ color: "oklch(0.45 0.13 160)", background: "oklch(0.95 0.05 160 / 0.5)" }}
          >
            <CheckCircle2 className="h-3 w-3" /> Saved
          </span>
        )}
      </div>
      <p className="mb-4 text-xs" style={{ color: "var(--dash-muted)" }}>
        Choose how customers book appointments on your public page.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {modes.map((m) => {
          const active = currentMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => select(m.id)}
              disabled={saving}
              className="group relative flex flex-col gap-2 rounded-xl p-4 text-left transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: active ? "var(--rez-highlight)" : "var(--dash-surface-muted)",
                border: active
                  ? "1.5px solid var(--rez-glow)"
                  : "1.5px solid var(--dash-border)",
                boxShadow: active ? "0 0 0 3px var(--rez-glow-dim)" : "none",
              }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  background: active ? "var(--rez-glow)" : "var(--dash-icon-tile)",
                  color: active ? "white" : "var(--dash-icon-fg)",
                }}
              >
                {m.icon}
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--dash-text)" }}
                >
                  {m.title}
                </p>
                <p
                  className="mt-0.5 text-[12px] leading-relaxed"
                  style={{ color: "var(--dash-muted)" }}
                >
                  {m.description}
                </p>
              </div>
              {active && (
                <CheckCircle2
                  className="absolute right-3 top-3 h-4 w-4"
                  style={{ color: "var(--rez-glow)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
