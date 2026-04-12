"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="h-28 animate-pulse rounded-lg bg-white/70" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-lg bg-white/70" />
          ))}
        </div>
        <div className="flex h-60 items-center justify-center gap-3 rounded-lg bg-white/70 text-zinc-400">
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
      <div className="grid gap-6 rounded-lg border border-zinc-200 bg-[oklch(0.997_0.005_95)] p-6 shadow-[0_30px_90px_-60px_rgba(39,39,42,0.7)] lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            Last 30 days
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            Keep the calendar moving.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600">
            Track booked revenue, review the next appointments, and jump into the work that needs
            attention.
          </p>
        </div>
        <Button
          asChild
          className="h-11 rounded-lg bg-zinc-950 px-5 text-[#fbfaf7] hover:bg-zinc-800"
        >
          <Link href="/dashboard/services">
            Add services <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {bookingPath && (
        <div className="grid gap-4 rounded-lg border border-zinc-200 bg-white/85 p-5 shadow-[0_24px_80px_-60px_rgba(39,39,42,0.7)] lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-950">
              <LinkIcon className="h-4 w-4 text-violet-700" />
              Booking link
            </div>
            <p className="text-sm text-zinc-600">
              Share this with clients or place it in your Instagram bio.
            </p>
            <p className="mt-3 truncate rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {bookingPath}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Button
              type="button"
              onClick={copyBookingLink}
              className="h-10 rounded-lg bg-violet-700 px-4 text-white hover:bg-violet-800"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button asChild type="button" variant="outline" className="h-10 rounded-lg">
              <Link href={bookingPath} target="_blank">
                Open link <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card
            key={s.label}
            className="border-zinc-200 bg-white/80 shadow-[0_24px_80px_-60px_rgba(39,39,42,0.7)]"
          >
            <CardContent className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-500">{s.label}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                  <s.icon className="h-4 w-4" />
                </span>
              </div>
              <p className="text-3xl font-semibold tracking-tight text-zinc-950 tabular-nums">
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden border-zinc-200 bg-[oklch(0.997_0.005_95)] shadow-[0_30px_90px_-60px_rgba(39,39,42,0.7)]">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight text-zinc-950">
            Upcoming appointments
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-xs text-zinc-600">
            <Link href="/dashboard/bookings">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {analytics.upcoming.length === 0 ? (
            <div className="rounded-lg bg-zinc-50 px-4 py-10 text-center">
              <CalendarDays className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
              <p className="text-sm font-medium text-zinc-600">
                No upcoming appointments in the next 7 days.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
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
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-sm font-semibold text-violet-800">
                        {(b.guest_name ?? "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-950">
                          {b.guest_name ?? "Guest"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {b.services?.name ?? "Appointment"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-zinc-800">{timeStr}</p>
                      <p className="text-xs text-zinc-400">{dateStr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { href: "/dashboard/bookings", label: "Manage bookings", icon: CalendarDays },
          { href: "/dashboard/services", label: "Manage services", icon: Scissors },
          { href: "/dashboard/clients", label: "View clients", icon: Users },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white/80 p-4 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-950 active:scale-[0.99]"
          >
            <l.icon className="h-4 w-4 shrink-0 text-violet-700" />
            {l.label}
            <ArrowRight className="ml-auto h-3.5 w-3.5 text-zinc-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
