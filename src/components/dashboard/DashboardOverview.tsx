"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  DollarSign,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  Loader2,
} from "lucide-react";

type Analytics = {
  period: string;
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  revenue: number;
  upcoming: {
    id: string;
    starts_at: string;
    guest_name: string;
    services: { name: string } | null;
  }[];
};

const statusColors: Record<string, string> = {
  confirmed: "success",
  pending: "warning",
  cancelled: "destructive",
  no_show: "secondary",
  expired: "secondary",
};

export function DashboardOverview() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics?period=30d")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setAnalytics(d);
      })
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700">
        <p className="font-semibold">Dashboard unavailable</p>
        <p className="text-sm mt-1">{error}</p>
        <p className="text-sm mt-3 text-red-500">
          Make sure your Supabase env vars and Better Auth are configured, then sign in.
        </p>
      </div>
    );
  }

  if (!analytics) return null;

  const stats = [
    {
      label: "Revenue (30d)",
      value: `$${analytics.revenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total bookings",
      value: analytics.total_bookings,
      icon: CalendarDays,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Confirmed",
      value: analytics.confirmed_bookings,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending",
      value: analytics.pending_bookings,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Last 30 days</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming bookings */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">
            Upcoming appointments
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link href="/dashboard/bookings">
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {analytics.upcoming.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No upcoming appointments in the next 7 days.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
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
                  <div key={b.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-semibold text-violet-700 shrink-0">
                        {(b.guest_name ?? "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {b.guest_name ?? "Guest"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {b.services?.name ?? "Appointment"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-700">{timeStr}</p>
                      <p className="text-xs text-gray-400">{dateStr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { href: "/dashboard/bookings", label: "Manage bookings", icon: CalendarDays },
          { href: "/dashboard/services", label: "Manage services", icon: Users },
          { href: "/dashboard/clients", label: "View clients", icon: Users },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm font-medium text-gray-700 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 transition-colors"
          >
            <l.icon className="w-4 h-4 shrink-0 text-violet-500" />
            {l.label}
            <ArrowRight className="w-3.5 h-3.5 ml-auto text-gray-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
