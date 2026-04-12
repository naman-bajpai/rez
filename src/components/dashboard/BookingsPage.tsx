"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, X, CalendarDays, Filter } from "lucide-react";

type Booking = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  payment_status: string;
  total_price: number;
  guest_name: string;
  guest_email: string;
  source_channel: string;
  created_at: string;
  services: { name: string; duration_mins: number } | null;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "warning" },
  confirmed: { label: "Confirmed", color: "success" },
  cancelled: { label: "Cancelled", color: "destructive" },
  no_show: { label: "No show", color: "secondary" },
  expired: { label: "Expired", color: "secondary" },
};

export function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/bookings${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setBookings(data.bookings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      await fetchBookings();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-zinc-200 bg-[oklch(0.997_0.005_95)] p-6 shadow-[0_30px_90px_-60px_rgba(39,39,42,0.7)] sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            Schedule
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">
            Bookings
          </h1>
          <p className="mt-2 text-sm text-zinc-600">Review requests and update appointment status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-44 rounded-lg border-zinc-200 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No show</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <Card className="overflow-hidden border-zinc-200 bg-[oklch(0.997_0.005_95)] shadow-[0_30px_90px_-60px_rgba(39,39,42,0.7)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold tracking-tight text-zinc-950">
            {loading ? "Loading…" : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading bookings...
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-lg bg-zinc-50 py-12 text-center">
              <CalendarDays className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
              <p className="text-sm font-medium text-zinc-500">No bookings found.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {bookings.map((b) => {
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
                const statusInfo = STATUS_LABELS[b.status] ?? {
                  label: b.status,
                  color: "secondary",
                };
                const isLoading = actionLoading === b.id;

                return (
                  <div
                    key={b.id}
                    className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-sm font-bold text-violet-800">
                        {(b.guest_name ?? "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-zinc-950">
                            {b.guest_name ?? "Guest"}
                          </span>
                          <Badge
                            variant={statusInfo.color as "default" | "secondary" | "destructive" | "outline" | "success" | "warning"}
                            className="text-xs"
                          >
                            {statusInfo.label}
                          </Badge>
                          {b.payment_status === "paid" && (
                            <Badge variant="success" className="text-xs">Paid</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {b.services?.name ?? "Appointment"} · {b.guest_email}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          {dateStr} at {timeStr} · ${Number(b.total_price).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2 sm:ml-4">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                      ) : (
                        <>
                          {b.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg border-green-200 text-xs text-green-700 hover:bg-green-50"
                              onClick={() => updateStatus(b.id, "confirmed")}
                            >
                              <Check className="mr-1 h-3.5 w-3.5" />
                              Confirm
                            </Button>
                          )}
                          {(b.status === "pending" || b.status === "confirmed") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg border-red-200 text-xs text-red-600 hover:bg-red-50"
                              onClick={() => updateStatus(b.id, "cancelled")}
                            >
                              <X className="mr-1 h-3.5 w-3.5" />
                              Cancel
                            </Button>
                          )}
                          {b.status === "confirmed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg text-xs"
                              onClick={() => updateStatus(b.id, "no_show")}
                            >
                              No show
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
