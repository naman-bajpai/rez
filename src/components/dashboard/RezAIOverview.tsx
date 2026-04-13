"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Bot,
  MessageCircle,
  DollarSign,
  CalendarDays,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

type Message = {
  id: string;
  name: string;
  initial: string;
  preview: string;
  service: string;
  relTime: string;
  resolved: boolean;
  isNew?: boolean;
};

type UpcomingBooking = {
  id: string;
  starts_at: string;
  guest_name: string;
  services: { name: string } | null;
};

type Analytics = {
  revenue: number;
  confirmed_bookings: number;
  business: { name: string; slug: string } | null;
  upcoming: UpcomingBooking[];
};

// ─── Simulated DM data ───────────────────────────────────────────

const SEED_MESSAGES: Omit<Message, "id" | "isNew">[] = [
  { name: "Jasmine T.",  initial: "J", preview: "Can I book a haircut for Saturday?",       service: "Haircut",      relTime: "just now", resolved: false },
  { name: "Marcus W.",  initial: "M", preview: "What's your earliest slot tomorrow?",       service: "Beard Trim",   relTime: "1m ago",   resolved: false },
  { name: "Aisha K.",   initial: "A", preview: "Confirmed for 2 PM — thank you so much! ✓", service: "Full Color",   relTime: "4m ago",   resolved: true  },
  { name: "Devon R.",   initial: "D", preview: "Do you take walk-ins on Sunday?",            service: "Cut & Style",  relTime: "8m ago",   resolved: false },
  { name: "Priya M.",   initial: "P", preview: "Appointment confirmed, you guys are fast!",  service: "Blowout",      relTime: "13m ago",  resolved: true  },
  { name: "Tyler B.",   initial: "T", preview: "Can Rez move my 3 PM slot later?",           service: "Trim",         relTime: "18m ago",  resolved: false },
];

const INCOMING_POOL: Omit<Message, "id" | "relTime" | "isNew">[] = [
  { name: "Sofia L.",   initial: "S", preview: "What services do you offer?",               service: "Consultation", resolved: false },
  { name: "Noah P.",    initial: "N", preview: "Is Friday 4 PM still available?",            service: "Fade",         resolved: false },
  { name: "Carmen V.",  initial: "C", preview: "I'm locked in — love how fast this was! ✓", service: "Highlights",   resolved: true  },
  { name: "James O.",   initial: "J", preview: "Can I bring my son for a kids cut too?",     service: "Kids Cut",     resolved: false },
  { name: "Rena H.",    initial: "R", preview: "Already booked, you're amazing!",            service: "Locs",         resolved: true  },
  { name: "Leo D.",     initial: "L", preview: "Any cancellations for this evening?",        service: "Shape-Up",     resolved: false },
  { name: "Keisha M.",  initial: "K", preview: "Do you have anything open Sunday AM?",       service: "Silk Press",   resolved: false },
  { name: "Orion F.",   initial: "O", preview: "Booked! See you Thursday at noon. ✓",        service: "Cut",          resolved: true  },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function greet() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Working late";
}

function shortName(businessName: string) {
  const words = businessName.trim().split(/\s+/);
  return words.length > 2 ? words.slice(0, 2).join(" ") : businessName;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function isNearNow(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 60000;
  return diff >= -75 && diff <= 75;
}

function isPast(iso: string) {
  return new Date(iso).getTime() < Date.now();
}

// ─── Component ───────────────────────────────────────────────────

export function RezAIOverview() {
  const [data, setData]       = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>(() =>
    SEED_MESSAGES.map((s) => ({ ...s, id: uid() }))
  );
  const [activeChats, setActiveChats] = useState(14);
  const poolIdx = useRef(0);

  // ── Fetch analytics ──────────────────────────────────────────
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/analytics?period=1d", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, []);

  // ── Simulate live DM stream ───────────────────────────────────
  const addMessage = useCallback(() => {
    const next = INCOMING_POOL[poolIdx.current % INCOMING_POOL.length];
    poolIdx.current++;
    const msg: Message = { ...next, id: uid(), relTime: "just now", isNew: true };
    setMessages((prev) => [msg, ...prev.slice(0, 5)]);
    setActiveChats((n) => Math.min(n + 1, 24));
    window.setTimeout(() => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isNew: false } : m)));
    }, 700);
  }, []);

  useEffect(() => {
    const t = setInterval(addMessage, 4800);
    return () => clearInterval(t);
  }, [addMessage]);

  // ── Derived ───────────────────────────────────────────────────
  const businessName = data?.business?.name ?? "your business";
  const greeting     = greet();
  const upcoming     = data?.upcoming ?? [];

  // Group upcoming by day for calendar display
  const calendarDays = upcoming.reduce<{ label: string; bookings: UpcomingBooking[] }[]>((acc, b) => {
    const label = fmtDay(b.starts_at);
    const existing = acc.find((g) => g.label === label);
    if (existing) existing.bookings.push(b);
    else acc.push({ label, bookings: [b] });
    return acc;
  }, []);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="rez-bento-grid">

      {/* ──────────── Greeting ──────────── */}
      <div className="rez-greeting-area rez-bento-card px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--dash-muted)" }}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h1
              className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl"
              style={{ color: "var(--dash-text)" }}
            >
              {greeting},{" "}
              <span style={{ color: "var(--rez-glow)" }}>
                {loading ? "…" : shortName(businessName)}.
              </span>
            </h1>
          </div>

          {/* AI status pill */}
          <div
            className="flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2 text-sm"
            style={{
              background: "var(--rez-highlight)",
              border: "1px solid var(--rez-glow-dim)",
              color: "var(--dash-text-secondary)",
            }}
          >
            <span className="rez-pulse" />
            <span className="font-medium">Rez is online</span>
            <span style={{ color: "var(--dash-border-strong)" }}>·</span>
            <span className="font-bold tabular-nums" style={{ color: "var(--dash-text)" }}>
              {activeChats}
            </span>
            <span className="font-medium">active chats</span>
          </div>
        </div>
      </div>

      {/* ──────────── Live DM Stream ──────────── */}
      <div className="rez-dm-area rez-bento-card flex flex-col" style={{ minHeight: 400 }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--dash-divider)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="dash-icon-circle h-8 w-8">
              <MessageCircle className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none" style={{ color: "var(--dash-text)" }}>
                Live DM Stream
              </p>
              <p className="mt-0.5 text-[11px]" style={{ color: "var(--dash-muted)" }}>
                AI-to-customer, in real time
              </p>
            </div>
          </div>
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums"
            style={{
              background: "var(--rez-highlight)",
              color: "var(--dash-text-secondary)",
              border: "1px solid var(--rez-glow-dim)",
            }}
          >
            {activeChats} live
          </span>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-hidden px-3 py-2">
          <div className="space-y-0.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={msg.isNew ? "rez-msg-enter" : ""}
                style={{
                  padding: "10px 10px",
                  borderRadius: "0.625rem",
                  background: msg.isNew ? "var(--rez-highlight)" : "transparent",
                  transition: "background 0.5s ease",
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                    style={{
                      background: "var(--dash-icon-tile)",
                      color: "var(--dash-icon-fg)",
                      border: "1px solid var(--dash-border)",
                    }}
                  >
                    {msg.initial}
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: "var(--dash-text)" }}>
                        {msg.name}
                      </span>
                      <span
                        className="rounded px-1.5 py-px text-[10px] font-medium leading-tight"
                        style={{
                          background: "var(--dash-surface-muted)",
                          color: "var(--dash-muted)",
                          border: "1px solid var(--dash-border)",
                        }}
                      >
                        {msg.service}
                      </span>
                    </div>
                    <p
                      className="mt-0.5 truncate text-[12px] leading-snug"
                      style={{ color: "var(--dash-text-secondary)" }}
                    >
                      {msg.preview}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[10px]" style={{ color: "var(--dash-muted)" }}>
                      {msg.relTime}
                    </span>
                    {msg.resolved ? (
                      <CheckCircle2
                        className="h-3 w-3"
                        style={{ color: "var(--rez-online)" }}
                      />
                    ) : (
                      <Circle
                        className="h-3 w-3"
                        style={{ color: "var(--rez-glow)", opacity: 0.7 }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: "1px solid var(--dash-divider)" }}
        >
          <div className="flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5" style={{ color: "var(--rez-glow)" }} />
            <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
              <span className="font-semibold" style={{ color: "var(--dash-text-secondary)" }}>
                Rez
              </span>{" "}
              is handling all inbound messages
            </p>
          </div>
          <Link
            href="/dashboard/clients"
            className="flex items-center gap-1 text-[11px] font-semibold"
            style={{ color: "var(--dash-text-secondary)" }}
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* ──────────── Revenue Saved ──────────── */}
      <div className="rez-revenue-area rez-bento-card flex flex-col p-5">
        <div className="flex items-start justify-between">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--dash-muted)" }}
            >
              Revenue Saved
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: "var(--dash-muted)" }}>
              bookings secured today
            </p>
          </div>
          <div className="dash-icon-circle h-8 w-8">
            <DollarSign className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="mt-5 flex-1">
          {loading ? (
            <div className="space-y-2">
              <div className="h-10 dash-pulse rounded-lg" />
              <div className="h-4 w-2/3 dash-pulse rounded" />
            </div>
          ) : (
            <>
              <p
                className="text-[2.6rem] font-bold tabular-nums leading-none tracking-tight"
                style={{ color: "var(--dash-text)" }}
              >
                ${(data?.revenue ?? 0).toFixed(0)}
              </p>
              <div className="mt-2.5 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" style={{ color: "var(--rez-online)" }} />
                <p className="text-[11px]" style={{ color: "var(--dash-text-secondary)" }}>
                  <span className="font-bold" style={{ color: "var(--dash-text)" }}>
                    {data?.confirmed_bookings ?? 0}
                  </span>{" "}
                  bookings confirmed
                </p>
              </div>
            </>
          )}
        </div>

        {/* Rez badge */}
        <div
          className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5"
          style={{
            background: "var(--rez-highlight)",
            border: "1px solid var(--rez-glow-dim)",
          }}
        >
          <Bot className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--rez-glow)" }} />
          <p className="text-[11px] font-medium" style={{ color: "var(--dash-text-secondary)" }}>
            Every booking handled by Rez
          </p>
        </div>
      </div>

      {/* ──────────── Calendar Preview ──────────── */}
      <div className="rez-calendar-area rez-bento-card flex flex-col" style={{ minHeight: 260 }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--dash-divider)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="dash-icon-circle h-8 w-8">
              <CalendarDays className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
              Calendar
            </p>
          </div>
          <Link
            href="/dashboard/bookings"
            className="flex items-center gap-1 text-[11px] font-semibold"
            style={{ color: "var(--dash-muted)" }}
          >
            All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-auto px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10">
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--dash-muted)" }} />
            </div>
          ) : calendarDays.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10">
              <Clock className="h-6 w-6 opacity-30" style={{ color: "var(--dash-muted)" }} />
              <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                No upcoming appointments
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {calendarDays.map(({ label, bookings }) => (
                <div key={label}>
                  {/* Day label */}
                  <p
                    className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: "var(--dash-muted)" }}
                  >
                    {label}
                  </p>

                  {/* Slots */}
                  <div className="relative">
                    {/* Vertical rail */}
                    <div
                      className="absolute left-[3.25rem] top-2 bottom-2 w-px"
                      style={{ background: "var(--dash-divider)" }}
                    />

                    <div className="space-y-1">
                      {bookings.map((b) => {
                        const current = isNearNow(b.starts_at);
                        const past    = isPast(b.starts_at);
                        return (
                          <div
                            key={b.id}
                            className="relative flex items-center gap-3 rounded-lg px-2 py-2"
                            style={{
                              background: current ? "var(--rez-highlight)" : "transparent",
                              transition: "background 0.2s",
                            }}
                          >
                            {/* Time */}
                            <span
                              className="w-12 shrink-0 text-right text-[10px] font-mono font-semibold tabular-nums leading-none"
                              style={{
                                color: current
                                  ? "var(--rez-glow)"
                                  : past
                                  ? "var(--dash-muted)"
                                  : "var(--dash-text-secondary)",
                              }}
                            >
                              {fmtTime(b.starts_at)}
                            </span>

                            {/* Timeline dot */}
                            <div
                              className="relative z-10 h-2 w-2 shrink-0 rounded-full"
                              style={{
                                background: current
                                  ? "var(--rez-online)"
                                  : past
                                  ? "var(--dash-muted)"
                                  : "var(--dash-border-strong)",
                                boxShadow: current
                                  ? "0 0 6px var(--rez-online)"
                                  : "none",
                              }}
                            />

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <p
                                className="truncate text-[12px] font-semibold leading-snug"
                                style={{
                                  color: past ? "var(--dash-muted)" : "var(--dash-text)",
                                }}
                              >
                                {b.guest_name}
                              </p>
                              <p
                                className="truncate text-[10px] leading-snug"
                                style={{ color: "var(--dash-muted)" }}
                              >
                                {b.services?.name ?? "Appointment"}
                              </p>
                            </div>

                            {/* Current indicator */}
                            {current && (
                              <span
                                className="shrink-0 rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide"
                                style={{
                                  background: "var(--rez-highlight)",
                                  color: "var(--rez-glow)",
                                  border: "1px solid var(--rez-glow-dim)",
                                }}
                              >
                                now
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
