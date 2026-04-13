"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, X, CalendarDays, Filter, MessageCircle, Globe } from "lucide-react";

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

const STATUS_META: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  pending:   { label: "Pending",   variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  no_show:   { label: "No show",   variant: "secondary" },
  expired:   { label: "Expired",   variant: "secondary" },
};

function SourceIcon({ channel }: { channel: string }) {
  if (channel === "instagram") {
    return <MessageCircle className="h-3 w-3" style={{ color: "var(--rez-glow)" }} />;
  }
  return <Globe className="h-3 w-3" style={{ color: "var(--dash-muted)" }} />;
}

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

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

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
    <div className="space-y-4">
      {/* Header */}
      <div className="dash-page-header dash-page-header--row">
        <div>
          <p className="dash-eyebrow">Schedule</p>
          <h1 className="dash-h1">Bookings</h1>
          <p className="dash-subtitle">Review requests and update appointment status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 shrink-0" style={{ color: "var(--dash-muted)" }} />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="dash-input h-10 w-44 rounded-lg text-sm">
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
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Table card */}
      <div className="dash-card overflow-hidden">
        {/* Card header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--dash-divider)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
            {loading ? "Loading…" : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20" style={{ color: "var(--dash-muted)" }}>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading bookings…</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="dash-empty py-16">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 opacity-25" />
            <p className="text-sm font-medium" style={{ color: "var(--dash-text-secondary)" }}>
              No bookings found
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--dash-muted)" }}>
              Bookings will appear here once guests start scheduling.
            </p>
          </div>
        ) : (
          <div>
            {bookings.map((b, idx) => {
              const d = new Date(b.starts_at);
              const dateStr = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
              const statusMeta = STATUS_META[b.status] ?? { label: b.status, variant: "secondary" as const };
              const isLoading = actionLoading === b.id;

              return (
                <div
                  key={b.id}
                  className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center"
                  style={{
                    borderTop: idx > 0 ? "1px solid var(--dash-divider)" : undefined,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="dash-icon-circle flex h-11 w-11 shrink-0 items-center justify-center text-sm font-bold">
                      {(b.guest_name ?? "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                          {b.guest_name ?? "Guest"}
                        </span>
                        <Badge variant={statusMeta.variant} className="text-[11px]">
                          {statusMeta.label}
                        </Badge>
                        {b.payment_status === "paid" && (
                          <Badge variant="success" className="text-[11px]">Paid</Badge>
                        )}
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: "var(--dash-muted)" }}>
                        <SourceIcon channel={b.source_channel} />
                        {b.services?.name ?? "Appointment"} · {b.guest_email}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--dash-muted)" }}>
                        {dateStr} at {timeStr} · ${Number(b.total_price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--dash-muted)" }} />
                    ) : (
                      <>
                        {b.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg border-green-200 text-xs text-green-700 hover:bg-green-50"
                            onClick={() => updateStatus(b.id, "confirmed")}
                          >
                            <Check className="mr-1 h-3.5 w-3.5" /> Confirm
                          </Button>
                        )}
                        {(b.status === "pending" || b.status === "confirmed") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg border-red-200 text-xs text-red-600 hover:bg-red-50"
                            onClick={() => updateStatus(b.id, "cancelled")}
                          >
                            <X className="mr-1 h-3.5 w-3.5" /> Cancel
                          </Button>
                        )}
                        {b.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="dashGhost"
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
      </div>
    </div>
  );
}
