"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Check,
  Copy,
  DollarSign,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  Scissors,
} from "lucide-react";

type Analytics = {
  period: string;
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  revenue: number;
  business: {
    name: string;
    slug: string;
  } | null;
  upcoming: {
    id: string;
    starts_at: string;
    guest_name: string;
    services: { name: string } | null;
  }[];
};

export function DashboardOverview() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/analytics?period=30d", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setAnalytics(d);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError("Failed to load analytics");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="h-28 dash-pulse" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-32 dash-pulse" />
          ))}
        </div>
        <div
          className="flex h-60 items-center justify-center gap-3 rounded-lg dash-card"
          style={{ color: "var(--dash-muted)" }}
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">Dashboard unavailable</p>
        <p className="text-sm mt-1">{error}</p>
        <p className="text-sm mt-3 text-red-500">
          Make sure your Supabase env vars and Better Auth are configured, then sign in.
        </p>
      </div>
    );
  }

  if (!analytics) return null;

  const bookingPath = analytics.business?.slug ? `/book/${analytics.business.slug}` : null;

  const copyBookingLink = async () => {
    if (!bookingPath) return;
    const bookingUrl = `${window.location.origin}${bookingPath}`;
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const stats = [
    { label: "Revenue", value: `$${analytics.revenue.toFixed(2)}`, icon: DollarSign },
    { label: "Total bookings", value: analytics.total_bookings, icon: CalendarDays },
    { label: "Confirmed", value: analytics.confirmed_bookings, icon: TrendingUp },
    { label: "Pending", value: analytics.pending_bookings, icon: Clock },
  ];

  return (
    <div className="space-y-8">
      <div className="dash-page-header dash-page-header--row grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="dash-eyebrow">Last 30 days</p>
          <h1 className="dash-h1 max-w-3xl">Keep the calendar moving.</h1>
          <p className="dash-subtitle max-w-2xl">
            Track booked revenue, review the next appointments, and jump into the work that needs
            attention.
          </p>
        </div>
        <Button asChild variant="dash" className="h-11 shrink-0 rounded-lg px-5">
          <Link href="/dashboard/services">
            Add services <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {bookingPath && (
        <div className="dash-page-header grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div
              className="mb-2 flex items-center gap-2 text-sm font-semibold"
              style={{ color: "var(--dash-text)" }}
            >
              <LinkIcon className="h-4 w-4" style={{ color: "var(--dash-icon-fg)" }} />
              Booking link
            </div>
            <p className="dash-subtitle">Share this with clients or place it in your Instagram bio.</p>
            <p
              className="dash-inset mt-3 truncate rounded-lg px-3 py-2 text-sm dash-input"
              style={{ color: "var(--dash-text-secondary)" }}
            >
              {bookingPath}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Button type="button" variant="dash" onClick={copyBookingLink} className="h-10 rounded-lg px-4">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button asChild type="button" variant="dashOutline" className="h-10 rounded-lg">
              <Link href={bookingPath} target="_blank">
                Open link <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="dash-card overflow-hidden">
            <div className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "var(--dash-muted)" }}>
                  {s.label}
                </span>
                <span className="dash-icon-circle h-9 w-9">
                  <s.icon className="h-4 w-4" />
                </span>
              </div>
              <p
                className="text-3xl font-semibold tracking-tight tabular-nums"
                style={{ color: "var(--dash-text)" }}
              >
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-card overflow-hidden">
        <CardHeader className="flex-row items-center justify-between border-b pb-4" style={{ borderColor: "var(--dash-divider)" }}>
          <CardTitle className="text-lg font-semibold tracking-tight" style={{ color: "var(--dash-text)" }}>
            Upcoming appointments
          </CardTitle>
          <Button asChild variant="dashGhost" size="sm" className="text-xs">
            <Link href="/dashboard/bookings">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {analytics.upcoming.length === 0 ? (
            <div className="dash-empty px-4 py-10">
              <CalendarDays className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p className="text-sm font-medium" style={{ color: "var(--dash-text-secondary)" }}>
                No upcoming appointments in the next 7 days.
              </p>
            </div>
          ) : (
            <div className="dash-divide">
              {analytics.upcoming.map((b) => {
                const d = new Date(b.starts_at);
                const dateStr = d.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                const timeStr = d.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });
                return (
                  <div key={b.id} className="flex items-center justify-between gap-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="dash-icon-circle h-10 w-10 shrink-0 text-sm font-semibold">
                        {(b.guest_name ?? "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                          {b.guest_name ?? "Guest"}
                        </p>
                        <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                          {b.services?.name ?? "Appointment"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium" style={{ color: "var(--dash-text-secondary)" }}>
                        {timeStr}
                      </p>
                      <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                        {dateStr}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { href: "/dashboard/bookings", label: "Manage bookings", icon: CalendarDays },
          { href: "/dashboard/services", label: "Manage services", icon: Scissors },
          { href: "/dashboard/clients", label: "View clients", icon: Users },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="dash-link-row dash-inset-highlight">
            <l.icon className="h-4 w-4 shrink-0" style={{ color: "var(--dash-icon-fg)" }} />
            {l.label}
            <ArrowRight className="ml-auto h-3.5 w-3.5" style={{ color: "var(--dash-muted)" }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
