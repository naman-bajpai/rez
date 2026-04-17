"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Check,
  X,
  CalendarDays,
  MessageCircle,
  Globe,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Calendar,
} from "lucide-react";

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

const STATUS_META: Record<
  string,
  {
    label: string;
    variant:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | "success"
      | "warning";
    dot: string;
  }
> = {
  pending:   { label: "Pending",   variant: "warning",     dot: "#F59E0B" },
  confirmed: { label: "Confirmed", variant: "success",     dot: "#10B981" },
  cancelled: { label: "Cancelled", variant: "destructive", dot: "#EF4444" },
  no_show:   { label: "No show",   variant: "secondary",   dot: "#71717A" },
  expired:   { label: "Expired",   variant: "secondary",   dot: "#71717A" },
};

const STATUS_COLUMN_ORDER = [
  "pending",
  "confirmed",
  "cancelled",
  "no_show",
  "expired",
] as const;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type ViewMode = "calendar" | "kanban" | "list";

function SourceIcon({ channel }: { channel: string }) {
  if (channel === "instagram") {
    return <MessageCircle className="h-3 w-3" style={{ color: "var(--rez-glow)" }} />;
  }
  return <Globe className="h-3 w-3" style={{ color: "var(--dash-muted)" }} />;
}

function fmt(date: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleString("en-US", opts);
}

/* ── Booking card (shared between views) ──────────────────────────────────── */
function BookingCard({
  b,
  actionLoading,
  onAction,
  compact = false,
}: {
  b: Booking;
  actionLoading: string | null;
  onAction: (id: string, status: string) => void;
  compact?: boolean;
}) {
  const isLoading = actionLoading === b.id;
  const statusMeta = STATUS_META[b.status] ?? { label: b.status, variant: "secondary" as const, dot: "#71717A" };

  const dateStr = fmt(b.starts_at, { weekday: "short", month: "short", day: "numeric" });
  const timeStr = fmt(b.starts_at, { hour: "numeric", minute: "2-digit", hour12: true });

  return (
    <article
      className="rounded-xl border p-3 transition-shadow duration-150 hover:shadow-sm"
      style={{
        borderColor: "var(--dash-border)",
        background: "var(--dash-surface)",
        borderLeft: `3px solid ${statusMeta.dot}`,
      }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="dash-icon-circle flex h-8 w-8 shrink-0 items-center justify-center text-xs"
          style={{ fontWeight: 500 }}
        >
          {(b.guest_name ?? "?")[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="truncate text-sm" style={{ color: "var(--dash-text)", fontWeight: 400 }}>
              {b.guest_name ?? "Guest"}
            </p>
            <Badge variant={statusMeta.variant} className="text-[10px] shrink-0">
              {statusMeta.label}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-xs" style={{ color: "var(--dash-muted)" }}>
            {b.services?.name ?? "Appointment"}
          </p>
          {!compact && (
            <p className="mt-0.5 text-xs" style={{ color: "var(--dash-muted)" }}>
              {dateStr} · {timeStr}
            </p>
          )}
          {compact && (
            <p className="mt-0.5 text-xs" style={{ color: "var(--dash-muted)" }}>
              {timeStr}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-1.5">
            <SourceIcon channel={b.source_channel} />
            {b.payment_status === "paid" && (
              <Badge variant="success" className="text-[10px]">Paid</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--dash-muted)" }} />
        ) : (
          <>
            {b.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 rounded-md border-green-200 px-2 text-[11px] text-green-700 hover:bg-green-50 active:scale-95 transition-transform"
                onClick={() => onAction(b.id, "confirmed")}
              >
                <Check className="mr-1 h-3 w-3" /> Confirm
              </Button>
            )}
            {(b.status === "pending" || b.status === "confirmed") && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 rounded-md border-red-200 px-2 text-[11px] text-red-600 hover:bg-red-50 active:scale-95 transition-transform"
                onClick={() => onAction(b.id, "cancelled")}
              >
                <X className="mr-1 h-3 w-3" /> Cancel
              </Button>
            )}
            {b.status === "confirmed" && (
              <Button
                size="sm"
                variant="dashGhost"
                className="h-6 rounded-md px-2 text-[11px] active:scale-95 transition-transform"
                onClick={() => onAction(b.id, "no_show")}
              >
                No show
              </Button>
            )}
          </>
        )}
      </div>
    </article>
  );
}

/* ── Calendar view ─────────────────────────────────────────────────────────── */
function CalendarView({
  bookings,
  actionLoading,
  onAction,
}: {
  bookings: Booking[];
  actionLoading: string | null;
  onAction: (id: string, status: string) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    return today.toISOString().slice(0, 10);
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build calendar grid
  const { days, bookingsByDate } = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startPad = firstDay.getDay();
    const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;

    const bbd: Record<string, Booking[]> = {};
    for (const b of bookings) {
      const key = b.starts_at.slice(0, 10);
      if (!bbd[key]) bbd[key] = [];
      bbd[key].push(b);
    }

    const dayList: Array<{ date: Date; isCurrentMonth: boolean; key: string }> = [];
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(viewYear, viewMonth, 1 - startPad + i);
      dayList.push({
        date: d,
        isCurrentMonth: d.getMonth() === viewMonth,
        key: d.toISOString().slice(0, 10),
      });
    }

    return { days: dayList, bookingsByDate: bbd };
  }, [viewYear, viewMonth, bookings]);

  const selectedBookings = useMemo(() => {
    if (!selectedDate) return [];
    return (bookingsByDate[selectedDate] ?? []).sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    );
  }, [selectedDate, bookingsByDate]);

  const todayKey = today.toISOString().slice(0, 10);

  return (
    <div className="flex gap-4 min-h-[540px]" style={{ flexDirection: "row" }}>
      {/* Month grid */}
      <div className="dash-card flex-1 overflow-hidden" style={{ minWidth: 0 }}>
        {/* Month nav */}
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--dash-divider)" }}
        >
          <button
            onClick={prevMonth}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[var(--dash-surface-muted)] active:scale-95"
            style={{ color: "var(--dash-muted)" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm" style={{ color: "var(--dash-text)", fontWeight: 500, letterSpacing: "-0.01em" }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </p>
          <button
            onClick={nextMonth}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[var(--dash-surface-muted)] active:scale-95"
            style={{ color: "var(--dash-muted)" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day name headers */}
        <div className="grid grid-cols-7 px-3 pt-2 pb-1">
          {DAY_NAMES.map(d => (
            <div
              key={d}
              className="text-center text-[10px] py-1"
              style={{ color: "var(--dash-muted)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px px-3 pb-3" style={{ background: "var(--dash-divider)" }}>
          {days.map(({ date, isCurrentMonth, key }) => {
            const dayBookings = bookingsByDate[key] ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;
            const hasPending = dayBookings.some(b => b.status === "pending");
            const hasConfirmed = dayBookings.some(b => b.status === "confirmed");

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key)}
                className="relative flex flex-col items-center rounded-lg p-1.5 transition-all duration-150"
                style={{
                  background: isSelected
                    ? "var(--dash-accent)"
                    : isToday
                    ? "var(--dash-accent-soft)"
                    : "var(--dash-surface)",
                  minHeight: "52px",
                  opacity: isCurrentMonth ? 1 : 0.32,
                }}
              >
                <span
                  className="text-xs leading-none"
                  style={{
                    color: isSelected
                      ? "#FFFFFF"
                      : isToday
                      ? "var(--dash-accent)"
                      : "var(--dash-text)",
                    fontWeight: isToday || isSelected ? 500 : 300,
                  }}
                >
                  {date.getDate()}
                </span>

                {/* Booking dots */}
                {dayBookings.length > 0 && (
                  <div className="mt-1 flex items-center gap-0.5">
                    {hasPending && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: isSelected ? "rgba(255,255,255,0.8)" : STATUS_META.pending.dot }}
                      />
                    )}
                    {hasConfirmed && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: isSelected ? "rgba(255,255,255,0.8)" : STATUS_META.confirmed.dot }}
                      />
                    )}
                    {dayBookings.some(b => b.status === "cancelled") && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: isSelected ? "rgba(255,255,255,0.7)" : STATUS_META.cancelled.dot }}
                      />
                    )}
                  </div>
                )}

                {/* Count badge for days with many bookings */}
                {dayBookings.length > 2 && (
                  <span
                    className="mt-0.5 text-[9px] leading-none"
                    style={{ color: isSelected ? "rgba(255,255,255,0.75)" : "var(--dash-muted)" }}
                  >
                    +{dayBookings.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail panel */}
      <div
        className="dash-card flex flex-col overflow-hidden"
        style={{ width: "320px", flexShrink: 0 }}
      >
        <div
          className="flex items-center justify-between px-4 py-3.5"
          style={{ borderBottom: "1px solid var(--dash-divider)" }}
        >
          <div>
            <p className="text-xs" style={{ color: "var(--dash-muted)", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {selectedDate
                ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" })
                : "Select a day"}
            </p>
            <p className="text-sm" style={{ color: "var(--dash-text)", fontWeight: 500 }}>
              {selectedDate
                ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "—"}
            </p>
          </div>
          {selectedBookings.length > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-xs"
              style={{
                background: "var(--dash-accent-soft)",
                color: "var(--dash-accent)",
                fontWeight: 500,
              }}
            >
              {selectedBookings.length}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin" }}>
          {selectedBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays
                className="mb-2 h-8 w-8 opacity-20"
                style={{ color: "var(--dash-muted)" }}
              />
              <p className="text-sm" style={{ color: "var(--dash-text-secondary)" }}>
                No bookings
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--dash-muted)" }}>
                Nothing scheduled for this day.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedBookings.map(b => (
                <BookingCard
                  key={b.id}
                  b={b}
                  actionLoading={actionLoading}
                  onAction={onAction}
                  compact
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Kanban view (unchanged logic, cleaner styling) ───────────────────────── */
function KanbanView({
  bookings,
  actionLoading,
  onAction,
}: {
  bookings: Booking[];
  actionLoading: string | null;
  onAction: (id: string, status: string) => void;
}) {
  const columns = useMemo(() => {
    const base = STATUS_COLUMN_ORDER.map(status => ({
      status,
      label: STATUS_META[status].label,
      dot: STATUS_META[status].dot,
      bookings: bookings.filter(b => b.status === status),
    }));
    const extras = Object.keys(
      bookings.reduce<Record<string, true>>((acc, b) => {
        if (!STATUS_META[b.status]) acc[b.status] = true;
        return acc;
      }, {})
    ).map(status => ({
      status,
      label: status.replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase()),
      dot: "#71717A",
      bookings: bookings.filter(b => b.status === status),
    }));
    return [...base, ...extras];
  }, [bookings]);

  return (
    <div className="dash-card overflow-hidden">
      <div
        className="flex items-center px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--dash-divider)" }}
      >
        <p className="text-sm" style={{ color: "var(--dash-muted)", fontWeight: 400 }}>
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""} · by status
        </p>
      </div>
      <div className="overflow-x-auto p-4">
        <div className="grid min-w-[1100px] grid-cols-5 gap-3">
          {columns.map(column => (
            <section
              key={column.status}
              className="rounded-xl border p-3"
              style={{ borderColor: "var(--dash-border)", background: "var(--dash-surface-muted)" }}
            >
              <div
                className="mb-3 flex items-center justify-between border-b pb-2"
                style={{ borderColor: "var(--dash-divider)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: column.dot, flexShrink: 0 }}
                  />
                  <span className="text-xs" style={{ color: "var(--dash-text)", fontWeight: 500 }}>
                    {column.label}
                  </span>
                  <span
                    className="rounded-full px-1.5 py-0 text-[10px] leading-4"
                    style={{
                      background: "var(--dash-surface)",
                      color: "var(--dash-muted)",
                      border: "1px solid var(--dash-border)",
                      fontWeight: 400,
                    }}
                  >
                    {column.bookings.length}
                  </span>
                </div>
              </div>

              {column.bookings.length === 0 ? (
                <p className="py-8 text-center text-xs" style={{ color: "var(--dash-muted)" }}>
                  No bookings
                </p>
              ) : (
                <div className="space-y-2.5">
                  {column.bookings.map(b => (
                    <BookingCard
                      key={b.id}
                      b={b}
                      actionLoading={actionLoading}
                      onAction={onAction}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── List view ─────────────────────────────────────────────────────────────── */
function ListView({
  bookings,
  actionLoading,
  onAction,
}: {
  bookings: Booking[];
  actionLoading: string | null;
  onAction: (id: string, status: string) => void;
}) {
  const sorted = useMemo(
    () => [...bookings].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [bookings]
  );

  // Group by date
  const groups = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of sorted) {
      const key = b.starts_at.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(b);
    }
    return Object.entries(map);
  }, [sorted]);

  return (
    <div className="dash-card overflow-hidden">
      <div
        className="flex items-center px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--dash-divider)" }}
      >
        <p className="text-sm" style={{ color: "var(--dash-muted)", fontWeight: 400 }}>
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""} · chronological
        </p>
      </div>
      <div className="p-4">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <CalendarDays className="mb-2 h-8 w-8 opacity-20" style={{ color: "var(--dash-muted)" }} />
            <p className="text-sm" style={{ color: "var(--dash-text-secondary)" }}>No bookings found</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map(([dateKey, dayBookings]) => {
              const label = new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              });
              return (
                <div key={dateKey}>
                  <p
                    className="mb-2 text-xs"
                    style={{
                      color: "var(--dash-muted)",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {label}
                  </p>
                  <div className="space-y-2">
                    {dayBookings.map(b => (
                      <BookingCard
                        key={b.id}
                        b={b}
                        actionLoading={actionLoading}
                        onAction={onAction}
                        compact
                      />
                    ))}
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

/* ── Main page ─────────────────────────────────────────────────────────────── */
export function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("calendar");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setBookings(data.bookings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const VIEW_TABS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: "calendar", label: "Calendar", icon: <Calendar className="h-3.5 w-3.5" /> },
    { id: "list",     label: "List",     icon: <List className="h-3.5 w-3.5" /> },
    { id: "kanban",   label: "Status",   icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="dash-page-header dash-page-header--row">
        <div>
          <p className="dash-eyebrow">Schedule</p>
          <h1 className="dash-h1">Bookings</h1>
          <p className="dash-subtitle">
            {loading
              ? "Loading…"
              : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""} total`}
          </p>
        </div>

        {/* View switcher */}
        <div
          className="flex items-center gap-0.5 rounded-xl p-1"
          style={{ background: "var(--dash-surface-muted)", border: "1px solid var(--dash-border)" }}
        >
          {VIEW_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all duration-150 active:scale-95"
              style={{
                background: view === tab.id ? "var(--dash-surface)" : "transparent",
                color: view === tab.id ? "var(--dash-text)" : "var(--dash-muted)",
                fontWeight: view === tab.id ? 500 : 300,
                boxShadow: view === tab.id ? "var(--dash-shadow-card)" : "none",
                border: view === tab.id ? "1px solid var(--dash-border)" : "1px solid transparent",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Errors */}
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

      {/* Content */}
      {loading ? (
        <div
          className="dash-card flex items-center justify-center gap-3 py-24"
          style={{ color: "var(--dash-muted)" }}
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading bookings…</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="dash-card">
          <div className="dash-empty py-16">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 opacity-20" />
            <p className="text-sm" style={{ color: "var(--dash-text-secondary)" }}>
              No bookings yet
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--dash-muted)" }}>
              Bookings will appear here once guests start scheduling.
            </p>
          </div>
        </div>
      ) : view === "calendar" ? (
        <CalendarView bookings={bookings} actionLoading={actionLoading} onAction={updateStatus} />
      ) : view === "kanban" ? (
        <KanbanView bookings={bookings} actionLoading={actionLoading} onAction={updateStatus} />
      ) : (
        <ListView bookings={bookings} actionLoading={actionLoading} onAction={updateStatus} />
      )}
    </div>
  );
}
