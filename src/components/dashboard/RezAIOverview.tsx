"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  CalendarDays,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Inbox,
  Scissors,
  MessageCircle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type UpcomingBooking = {
  id: string;
  starts_at: string;
  guest_name: string;
  services: { name: string } | null;
};

type Analytics = {
  revenue: number;
  confirmed_bookings: number;
  pending_bookings: number;
  total_bookings: number;
  business: { name: string; slug: string } | null;
  upcoming: UpcomingBooking[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greet() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Working late";
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

function isPast(iso: string) {
  return new Date(iso).getTime() < Date.now();
}

function isNow(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 60000;
  return diff >= -75 && diff <= 75;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  sub,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  sub: string;
  value: string;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <div className="rez-bento-card flex flex-col gap-4 p-6 transition-transform hover:scale-[1.01]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60" style={{ color: "var(--dash-muted)" }}>
            {label}
          </p>
          <p className="mt-0.5 text-[11px] font-medium opacity-80" style={{ color: "var(--dash-muted)" }}>
            {sub}
          </p>
        </div>
        <div className="dash-icon-circle h-9 w-9 shrink-0">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {loading ? (
        <div className="h-10 w-32 dash-pulse rounded-xl" />
      ) : (
        <p
          className="text-[2.5rem] font-bold tabular-nums leading-none tracking-tighter"
          style={{ color: "var(--dash-text)" }}
        >
          {value}
        </p>
      )}
    </div>
  );
}

// ─── Quick link ───────────────────────────────────────────────────────────────

function QuickLink({ href, icon: Icon, label, sub }: { href: string; icon: React.ElementType; label: string; sub: string }) {
  return (
    <Link href={href} className="dash-link-row dash-inset-highlight group">
      <div className="dash-icon-circle h-9 w-9 shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>{label}</p>
        <p className="text-xs" style={{ color: "var(--dash-muted)" }}>{sub}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--dash-muted)" }} />
    </Link>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RezAIOverview() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/analytics?period=30d", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: Analytics & { error?: string }) => {
        if (!d.error) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, []);

  const businessName = data?.business?.name ?? "your business";
  const slug = data?.business?.slug ?? "";
  const upcoming = data?.upcoming ?? [];

  // Group upcoming by day
  const byDay = upcoming.reduce<{ label: string; items: UpcomingBooking[] }[]>((acc, b) => {
    const label = fmtDay(b.starts_at);
    const g = acc.find((x) => x.label === label);
    if (g) g.items.push(b);
    else acc.push({ label, items: [b] });
    return acc;
  }, []);

  return (
    <div className="space-y-3">

      {/* ── Greeting ────────────────────────────────────────────────── */}
      <div className="rez-bento-card relative px-6 py-6 sm:py-8 overflow-hidden">
        <div className="dash-mesh opacity-30" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80"
              style={{ color: "var(--dash-muted)" }}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h1
              className="mt-2 text-3xl font-bold tracking-tighter sm:text-4xl"
              style={{ color: "var(--dash-text)" }}
            >
              {greet()},{" "}
              <span className="opacity-90" style={{ color: "var(--rez-glow)" }}>
                {loading ? "…" : businessName.split(" ")[0]}.
              </span>
            </h1>
          </div>

          <div
            className="flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wider"
            style={{
              background: "var(--rez-highlight)",
              border: "1px solid var(--rez-glow-dim)",
              color: "var(--dash-text)",
            }}
          >
            <span className="rez-pulse" />
            <span>Rez Online</span>
          </div>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          sub="30d gross"
          value={loading ? "—" : `$${(data?.revenue ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          label="Confirmed"
          sub="30d volume"
          value={loading ? "—" : String(data?.confirmed_bookings ?? 0)}
          icon={CheckCircle2}
          loading={loading}
        />
        <StatCard
          label="Pending"
          sub="active leads"
          value={loading ? "—" : String(data?.pending_bookings ?? 0)}
          icon={Clock}
          loading={loading}
        />
        <StatCard
          label="Upcoming"
          sub="7d schedule"
          value={loading ? "—" : String(upcoming.length)}
          icon={CalendarDays}
          loading={loading}
        />
      </div>

      {/* ── Bottom grid ─────────────────────────────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">

        {/* Upcoming appointments */}
        <div className="rez-bento-card flex flex-col" style={{ minHeight: 400 }}>
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: "1px solid var(--dash-divider)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="dash-icon-circle h-8 w-8">
                <CalendarDays className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm font-bold tracking-tight" style={{ color: "var(--dash-text)" }}>
                Upcoming Schedule
              </p>
            </div>
            <Link
              href="/dashboard/bookings"
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-opacity hover:opacity-70"
              style={{ color: "var(--dash-muted)" }}
            >
              Full Calendar <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex-1 overflow-auto px-6 py-5">
            {loading ? (
              <div className="space-y-4 pt-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 dash-pulse rounded-xl" />
                ))}
              </div>
            ) : byDay.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-20">
                <CalendarDays className="h-10 w-10 opacity-10" style={{ color: "var(--dash-muted)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--dash-muted)" }}>
                  Your schedule is clear
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {byDay.map(({ label, items }) => (
                  <div key={label}>
                    <p
                      className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60"
                      style={{ color: "var(--dash-muted)" }}
                    >
                      {label}
                    </p>
                    <div className="relative">
                      <div
                        className="absolute bottom-2 left-[3.25rem] top-2 w-px opacity-30"
                        style={{ background: "var(--dash-divider)" }}
                      />
                      <div className="space-y-2">
                        {items.map((b) => {
                          const now = isNow(b.starts_at);
                          const past = isPast(b.starts_at);
                          return (
                            <div
                              key={b.id}
                              className="relative flex items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-[var(--rez-highlight)]"
                              style={{
                                background: now ? "var(--rez-highlight)" : "transparent",
                              }}
                            >
                              <span
                                className="w-12 shrink-0 text-right font-mono text-[11px] font-bold tabular-nums tracking-tighter"
                                style={{
                                  color: now
                                    ? "var(--rez-glow)"
                                    : past
                                    ? "var(--dash-muted)"
                                    : "var(--dash-text-secondary)",
                                }}
                              >
                                {fmtTime(b.starts_at).replace(":00", "").toLowerCase()}
                              </span>
                              <div
                                className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[var(--dash-surface-elevated)]"
                                style={{
                                  background: now
                                    ? "var(--rez-online)"
                                    : past
                                    ? "var(--dash-border)"
                                    : "var(--dash-border-strong)",
                                  boxShadow: now ? "0 0 10px var(--rez-online)" : "none",
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <p
                                  className="truncate text-sm font-bold tracking-tight"
                                  style={{ color: past ? "var(--dash-muted)" : "var(--dash-text)" }}
                                >
                                  {b.guest_name}
                                </p>
                                <p className="truncate text-[11px] font-medium opacity-70" style={{ color: "var(--dash-muted)" }}>
                                  {b.services?.name ?? "Appointment"}
                                </p>
                              </div>
                              {now && (
                                <span
                                  className="shrink-0 rounded-full px-2 py-px text-[9px] font-bold uppercase tracking-widest"
                                  style={{
                                    background: "var(--dash-accent)",
                                    color: "var(--dash-accent-fg)",
                                  }}
                                >
                                  LIVE
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

        {/* Quick links & Context */}
        <div className="flex flex-col gap-3">
          <div className="rez-bento-card p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="dash-icon-circle h-8 w-8">
                <Bot className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold tracking-tight" style={{ color: "var(--dash-text)" }}>
                Operations
              </p>
            </div>
            <div className="space-y-3">
              <QuickLink
                href="/dashboard/bookings"
                icon={Inbox}
                label="DM Inbox"
                sub="AI Conversations"
              />
              <QuickLink
                href="/dashboard/bookings"
                icon={CalendarDays}
                label="Bookings"
                sub="Management"
              />
              <QuickLink
                href="/dashboard/services"
                icon={Scissors}
                label="Services"
                sub="Menu Editor"
              />
            </div>
          </div>

          <div className="rez-bento-card relative p-6 overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5">
              <MessageCircle className="h-24 w-24" />
            </div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <MessageCircle className="h-4 w-4" style={{ color: "var(--rez-glow)" }} />
              <p className="text-sm font-bold tracking-tight" style={{ color: "var(--dash-text)" }}>
                Agent Intelligence
              </p>
            </div>
            <p className="text-[12px] leading-relaxed font-medium relative z-10" style={{ color: "var(--dash-muted)" }}>
              Rez is currently intercepts inbound Instagram DMs, handling booking intent, and closing gaps in your schedule automatically.
            </p>
            <Link
              href="/dashboard/bookings"
              className="mt-4 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider relative z-10 transition-transform hover:translate-x-1"
              style={{ color: "var(--rez-glow)" }}
            >
              Go to Inbox <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
