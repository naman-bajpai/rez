"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Mail,
  User,
  ListChecks,
  RefreshCw,
  CalendarDays,
  CalendarX,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { PostBookingChat } from "@/components/booking/PostBookingChat";

// ─── Types ────────────────────────────────────────────────────────────────────

type Service = {
  id: string;
  name: string;
  duration_mins: number;
  price: number;
  add_ons: { name: string; price: number; duration_mins: number }[];
};

type Business = {
  id: string;
  name: string;
  slug: string;
  owner_name?: string;
  timezone?: string;
};

type TimeSlot = { startsAt: string; endsAt: string; label: string };

type Step =
  | "select-service"
  | "verify"
  | "select-slot"
  | "confirm"
  | "my-bookings"
  | "past-bookings"
  | "reschedule-slot";

type GuestSession = { token: string; email: string; name: string };

type GuestBooking = {
  id: string;
  service_id: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  payment_status: string;
  total_price: number;
  guest_name: string | null;
  guest_email: string | null;
  services: { id: string; name: string; duration_mins: number; price: number } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function toIsoDate(d: Date) { return d.toISOString().slice(0, 10); }

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function canModifyBooking(b: GuestBooking) {
  return ["pending", "confirmed"].includes(b.status) && new Date(b.starts_at) > new Date();
}

function isUpcomingBooking(b: GuestBooking) {
  return ["pending", "confirmed"].includes(b.status) && new Date(b.starts_at) > new Date();
}

function getStatusColor(status: string) {
  if (status === "confirmed") return { bg: "#EDFAF3", color: "#1A7A4A" };
  if (status === "pending") return { bg: "var(--c-accent-soft)", color: "var(--c-accent)" };
  if (status === "cancelled") return { bg: "#FFF2F1", color: "#BE3A2C" };
  return { bg: "var(--c-divider)", color: "var(--c-sub)" };
}

function getTwoWeeksRange() {
  const today = new Date();
  const out = new Date(today);
  out.setDate(out.getDate() + 14);
  return { dateFrom: toIsoDate(today), dateTo: toIsoDate(out) };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BK_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .bk {
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    --c-bg: #F8F8FC;
    --c-surface: #FFFFFF;
    --c-text: #18181B;
    --c-sub: #3F3F46;
    --c-muted: #71717A;
    --c-border: #E4E4E7;
    --c-divider: #F4F4F5;
    --c-accent: #7C3AED;
    --c-accent-soft: #F5F3FF;
    --c-accent-ring: rgba(124,58,237,0.14);
    --c-green: #1A7A4A;
    --c-green-soft: #EDFAF3;
    color: var(--c-text);
  }

  .bk-serif { font-family: 'Fraunces', Georgia, serif; }

  /* Card */
  .bk-card {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: 22px;
    box-shadow: 0 2px 32px -8px rgba(26,22,20,0.10), 0 0 0 0 transparent;
    padding: 32px;
  }

  /* Step animation */
  @keyframes bkIn {
    from { opacity: 0; transform: translateY(10px) scale(0.995); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .bk-in { animation: bkIn 0.35s cubic-bezier(0.16,1,0.3,1) both; }

  /* Service button */
  .bk-svc {
    display: flex; width: 100%; align-items: center; justify-content: space-between;
    gap: 14px; padding: 18px 20px; border-radius: 14px;
    border: 1.5px solid var(--c-border); background: #FFFFFF;
    cursor: pointer; text-align: left; transition: all 0.2s ease;
  }
  .bk-svc:hover {
    border-color: var(--c-accent); background: var(--c-accent-soft);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px -6px var(--c-accent-ring);
  }
  .bk-svc:active { transform: scale(0.99); }

  /* Primary button */
  .bk-btn {
    width: 100%; height: 52px; border-radius: 14px;
    background: var(--c-accent); color: white;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
    letter-spacing: 0.01em; border: none; cursor: pointer;
    transition: all 0.2s ease;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .bk-btn:hover:not(:disabled) {
    background: #6D28D9;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px -6px rgba(26,22,20,0.24);
  }
  .bk-btn:active:not(:disabled) { transform: scale(0.99); }
  .bk-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }

  /* Secondary button */
  .bk-btn-sec {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    height: 38px; padding: 0 14px; border-radius: 10px;
    border: 1.5px solid var(--c-border); background: white;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    color: var(--c-sub); cursor: pointer; transition: all 0.15s ease;
  }
  .bk-btn-sec:hover { border-color: var(--c-text); color: var(--c-text); background: white; }
  .bk-btn-sec:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Danger button */
  .bk-btn-del {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    height: 38px; padding: 0 14px; border-radius: 10px;
    border: 1.5px solid transparent; background: #FFF2F1;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    color: #BE3A2C; cursor: pointer; transition: all 0.15s ease;
  }
  .bk-btn-del:hover { background: #FFE5E3; }
  .bk-btn-del:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Input */
  .bk-input {
    width: 100%; height: 50px; padding: 0 16px;
    border-radius: 12px; border: 1.5px solid var(--c-border);
    background: #FFFFFF;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--c-text);
    outline: none; transition: all 0.15s ease; -webkit-appearance: none;
  }
  .bk-input:focus {
    border-color: var(--c-accent);
    box-shadow: 0 0 0 3px var(--c-accent-ring);
    background: white;
  }
  .bk-input::placeholder { color: var(--c-muted); }

  /* OTP */
  .bk-otp {
    width: 100%; height: 68px; border-radius: 14px;
    border: 1.5px solid var(--c-border); background: #FFFFFF;
    font-family: 'DM Sans', monospace; font-size: 26px; font-weight: 600;
    letter-spacing: 0.35em; text-align: center; color: var(--c-text);
    outline: none; transition: all 0.15s ease; -webkit-appearance: none;
  }
  .bk-otp:focus {
    border-color: var(--c-accent);
    box-shadow: 0 0 0 3px var(--c-accent-ring);
    background: white;
  }

  /* Calendar cells */
  .bk-cell {
    display: flex; align-items: center; justify-content: center;
    width: 38px; height: 38px; border-radius: 50%;
    font-size: 13px; position: relative;
    transition: all 0.15s ease;
    color: var(--c-muted); font-weight: 400;
  }
  .bk-cell.avail { color: var(--c-text); cursor: pointer; }
  .bk-cell.avail:hover { background: var(--c-accent-soft); color: var(--c-accent); }
  .bk-cell.today:not(.sel) { font-weight: 700; }
  .bk-cell.sel { background: var(--c-accent) !important; color: white !important; font-weight: 600; }
  .bk-cell-dot {
    position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%);
    width: 3px; height: 3px; border-radius: 50%; background: var(--c-accent);
  }

  /* Slot pills */
  .bk-slot {
    padding: 9px 14px; border-radius: 10px;
    border: 1.5px solid var(--c-border); background: white;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    color: var(--c-text); cursor: pointer; white-space: nowrap;
    transition: all 0.15s ease;
  }
  .bk-slot:hover { border-color: var(--c-accent); background: var(--c-accent-soft); color: var(--c-accent); }

  /* Back button */
  .bk-back {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 12.5px; font-weight: 500; color: var(--c-muted);
    background: none; border: none; cursor: pointer; padding: 0;
    transition: color 0.15s ease; margin-bottom: 24px;
  }
  .bk-back:hover { color: var(--c-text); }

  /* Error */
  .bk-err {
    padding: 12px 16px; border-radius: 12px;
    background: #FFF2F1; border: 1px solid #FECACA;
    color: #BE3A2C; font-size: 13px; line-height: 1.5;
  }

  /* Label */
  .bk-label {
    display: block; font-size: 11px; font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--c-muted); margin-bottom: 8px;
  }

  /* Progress segments */
  .bk-progress { display: flex; gap: 3px; width: 120px; }
  .bk-seg { height: 2px; flex: 1; border-radius: 2px; transition: background 0.35s ease; }
  .bk-seg-done { background: var(--c-accent); }
  .bk-seg-now { background: var(--c-accent); }
  .bk-seg-next { background: var(--c-border); }

  /* Detail row */
  .bk-detail { display: flex; align-items: flex-start; gap: 10px; }
  .bk-detail-icon {
    width: 28px; height: 28px; border-radius: 8px;
    background: var(--c-divider); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }

  /* Booking item */
  .bk-booking {
    padding: 18px; border-radius: 14px;
    border: 1.5px solid var(--c-border); background: #FFFFFF;
  }

  .bk-booking-action {
    width: 100%;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    font: inherit;
  }

  .bk-booking-action:focus-visible {
    outline: 3px solid var(--c-accent-ring);
    outline-offset: 4px;
    border-radius: 12px;
  }

  .bk-booking-feature {
    border-color: var(--c-accent);
    background: linear-gradient(180deg, #FFFFFF 0%, var(--c-accent-soft) 100%);
    box-shadow: 0 10px 30px -20px rgba(124,58,237,0.45);
  }

  /* Logo */
  .bk-logo-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid var(--c-border);
    background: #FFFFFF;
    overflow: hidden;
    flex-shrink: 0;
  }

  .bk-logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  /* Manage link */
  .bk-manage {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 12px; border-radius: 8px;
    border: 1px solid var(--c-border); background: white;
    font-size: 12px; font-weight: 500; color: var(--c-sub);
    cursor: pointer; transition: all 0.15s ease; text-decoration: none;
  }
  .bk-manage:hover { border-color: var(--c-text); color: var(--c-text); }

  /* Divider */
  .bk-line { height: 1px; background: var(--c-divider); margin: 0 -32px; }

  /* Calendar layout */
  .bk-cal-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
  }

  .bk-slots-panel {
    border-top: 1px solid var(--c-divider);
  }

  @media (min-width: 680px) {
    .bk-cal-grid {
      grid-template-columns: minmax(0, 1fr) minmax(220px, 0.9fr);
    }

    .bk-slots-panel {
      border-top: none;
      border-left: 1px solid var(--c-divider);
    }
  }
`;

// ─── Step progress bar ────────────────────────────────────────────────────────

const STEP_ORDER: Step[] = ["select-service","verify","select-slot","confirm"];

function ProgressBar({ step }: { step: Step }) {
  const steps: Step[] = ["select-service","verify","select-slot","confirm"];
  const cur = STEP_ORDER.indexOf(step);
  return (
    <div className="bk-progress">
      {steps.map((s) => {
        const idx = STEP_ORDER.indexOf(s);
        const cls = idx < cur ? "bk-seg bk-seg-done" : idx === cur ? "bk-seg bk-seg-now" : "bk-seg bk-seg-next";
        return <div key={s} className={cls} />;
      })}
    </div>
  );
}

// ─── Calendar picker ──────────────────────────────────────────────────────────

function CalendarPicker({
  slots,
  selectedDate,
  onSelectDate,
}: {
  slots: TimeSlot[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}) {
  const today = useMemo(() => toIsoDate(new Date()), []);
  const todayDate = useMemo(() => new Date(), []);

  const availableDates = useMemo(
    () => new Set(slots.map((s) => s.startsAt.slice(0, 10))),
    [slots]
  );

  const initialMonth = useMemo(() => {
    if (slots.length === 0) return { year: todayDate.getFullYear(), month: todayDate.getMonth() };
    const first = [...availableDates].sort()[0];
    if (!first) return { year: todayDate.getFullYear(), month: todayDate.getMonth() };
    const d = new Date(first + "T12:00:00");
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [slots, availableDates, todayDate]);

  const [view, setView] = useState(initialMonth);

  const firstSlotDate = useMemo(() => [...availableDates].sort()[0] ?? today, [availableDates, today]);
  const lastSlotDate = useMemo(() => [...availableDates].sort().at(-1) ?? today, [availableDates, today]);

  const canGoPrev = useMemo(() => {
    const d = new Date(firstSlotDate + "T12:00:00");
    return view.year > d.getFullYear() || (view.year === d.getFullYear() && view.month > d.getMonth());
  }, [view, firstSlotDate]);

  const canGoNext = useMemo(() => {
    const d = new Date(lastSlotDate + "T12:00:00");
    return view.year < d.getFullYear() || (view.year === d.getFullYear() && view.month < d.getMonth());
  }, [view, lastSlotDate]);

  const days = buildCalendarDays(view.year, view.month);

  return (
    <div style={{ userSelect: "none" }}>
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setView(v => { const d = new Date(v.year, v.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
          disabled={!canGoPrev}
          style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "1.5px solid var(--c-border)", background: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: canGoPrev ? "pointer" : "default", opacity: canGoPrev ? 1 : 0.3,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { if (canGoPrev) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--c-text)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--c-border)"; }}
        >
          <ChevronLeft style={{ width: 14, height: 14, color: "var(--c-sub)" }} />
        </button>
        <span className="bk-serif" style={{ fontSize: 15, fontWeight: 400, color: "var(--c-text)" }}>
          {MONTHS[view.month]} {view.year}
        </span>
        <button
          type="button"
          onClick={() => setView(v => { const d = new Date(v.year, v.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
          disabled={!canGoNext}
          style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "1.5px solid var(--c-border)", background: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: canGoNext ? "pointer" : "default", opacity: canGoNext ? 1 : 0.3,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { if (canGoNext) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--c-text)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--c-border)"; }}
        >
          <ChevronRight style={{ width: 14, height: 14, color: "var(--c-sub)" }} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "2px 0", marginBottom: 4 }}>
        {DAYS_SHORT.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", color: "var(--c-muted)", textTransform: "uppercase", padding: "4px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "2px 0" }}>
        {days.map((day, idx) => {
          if (day === null) return <div key={`b-${idx}`} />;

          const iso = `${view.year}-${String(view.month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isToday = iso === today;
          const isPast = iso < today;
          const hasSlots = availableDates.has(iso);
          const isSelected = iso === selectedDate;
          const isClickable = hasSlots && !isPast;

          let cls = "bk-cell";
          if (isSelected) cls += " sel";
          else if (isClickable) cls += " avail";
          if (isToday) cls += " today";

          return (
            <div key={iso} style={{ display: "flex", justifyContent: "center" }}>
              <div
                className={cls}
                onClick={() => isClickable && onSelectDate(iso)}
              >
                {day}
                {hasSlots && !isSelected && !isPast && <span className="bk-cell-dot" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Time slots panel ─────────────────────────────────────────────────────────

function TimeSlotsPanel({
  date,
  slots,
  onSelect,
  loading,
}: {
  date: string | null;
  slots: TimeSlot[];
  onSelect: (slot: TimeSlot) => void;
  loading: boolean;
}) {
  if (!date) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 0", textAlign: "center" }}>
        <CalendarDays style={{ width: 28, height: 28, color: "var(--c-border)" }} />
        <p style={{ fontSize: 13, color: "var(--c-muted)" }}>Pick a date to see open times</p>
      </div>
    );
  }

  const daySlots = slots.filter(s => s.startsAt.slice(0, 10) === date);
  const dayLabel = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--c-muted)", marginBottom: 14 }}>
        {dayLabel}
      </p>
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "32px 0", color: "var(--c-muted)" }}>
          <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 13 }}>Loading…</span>
        </div>
      ) : daySlots.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "32px 0", textAlign: "center" }}>
          <CalendarX style={{ width: 24, height: 24, color: "var(--c-border)" }} />
          <p style={{ fontSize: 13, color: "var(--c-muted)" }}>No openings this day</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, maxHeight: 280, overflowY: "auto", paddingRight: 2 }}>
          {daySlots.map(slot => (
            <button key={slot.startsAt} type="button" className="bk-slot" onClick={() => onSelect(slot)}>
              {slot.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BookingFlow({
  slug,
  business,
  services,
  initialView,
}: {
  slug: string;
  business: Business;
  services: Service[];
  initialView?: "upcoming";
}) {
  const [step, setStep] = useState<Step>("select-service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "" });
  const [otpCode, setOtpCode] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authIntent, setAuthIntent] = useState<"book" | "manage">("book");
  const [myBookings, setMyBookings] = useState<GuestBooking[]>([]);
  const [reschedulingBooking, setReschedulingBooking] = useState<GuestBooking | null>(null);
  const [activeConversationBookingId, setActiveConversationBookingId] = useState<string | null>(null);

  const storageKey = `bk_guest_${slug}`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as GuestSession;
        setGuestSession(parsed);
        setGuestInfo({ name: parsed.name, email: parsed.email });
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  const loadSlots = useCallback(
    async (token: string, excludeBookingId?: string, serviceOverride?: Service) => {
      const service = serviceOverride ?? selectedService;
      if (!service) return;
      setSlotsLoading(true);
      setError(null);
      try {
        const { dateFrom, dateTo } = getTwoWeeksRange();
        const params = new URLSearchParams({ service_id: service.id, date_from: dateFrom, date_to: dateTo });
        if (excludeBookingId) params.set("exclude_booking_id", excludeBookingId);
        const res = await fetch(`/api/book/${slug}/slots?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load slots");
        setSlots(data.slots ?? []);
        const firstDate = (data.slots as TimeSlot[] ?? []).find(Boolean)?.startsAt.slice(0, 10) ?? null;
        setSelectedDate(firstDate);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load slots");
      } finally {
        setSlotsLoading(false);
      }
    },
    [slug, selectedService]
  );

  const loadMyBookings = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/book/${slug}/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMyBookings(data.bookings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const upcomingBookings = useMemo(
    () =>
      myBookings
        .filter(isUpcomingBooking)
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [myBookings]
  );

  const pastBookings = useMemo(
    () =>
      myBookings
        .filter((booking) => !isUpcomingBooking(booking))
        .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()),
    [myBookings]
  );

  const nextBooking = upcomingBookings[0] ?? null;
  const otherUpcomingBookings = upcomingBookings.slice(1);

  useEffect(() => {
    if (step === "select-slot" && guestSession) loadSlots(guestSession.token);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedSlot(null);
    setError(null);
    setAuthIntent("book");
    setOtpCode("");
    setOtpRequested(false);
    if (guestSession) { setStep("select-slot"); }
    else { setStep("verify"); }
  };

  const handleManageBookings = () => {
    setSelectedService(null); setSelectedSlot(null); setReschedulingBooking(null);
    setAuthIntent("manage"); setError(null);
    setOtpCode("");
    setOtpRequested(false);
    setActiveConversationBookingId(null);
    if (guestSession) { setStep("my-bookings"); loadMyBookings(guestSession.token); }
    else { setStep("verify"); }
  };

  useEffect(() => {
    if (initialView !== "upcoming") return;
    setSelectedService(null);
    setSelectedSlot(null);
    setReschedulingBooking(null);
    setAuthIntent("manage");
    setError(null);
    setOtpCode("");
    setOtpRequested(false);
    setActiveConversationBookingId(null);
    if (guestSession) {
      setStep("my-bookings");
      loadMyBookings(guestSession.token);
      return;
    }
    setStep("verify");
  }, [guestSession, initialView, loadMyBookings]);

  const handleGuestLogout = () => {
    localStorage.removeItem(storageKey);
    setGuestSession(null);
    setGuestInfo({ name: "", email: "" });
    setOtpCode("");
    setOtpRequested(false);
    setMyBookings([]);
    setActiveConversationBookingId(null);
    setReschedulingBooking(null);
    setSelectedService(null);
    setSelectedSlot(null);
    setSelectedDate(null);
    setAuthIntent("book");
    setError(null);
    setStep("select-service");
  };

  const handleSendOtp = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/book/${slug}/auth`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: guestInfo.email, name: guestInfo.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send code");
      setOtpRequested(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/book/${slug}/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: guestInfo.email, name: guestInfo.name, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      const session: GuestSession = { token: data.token, email: data.email, name: data.name };
      setGuestSession(session);
      localStorage.setItem(storageKey, JSON.stringify(session));
      setOtpRequested(false);
      setOtpCode("");
      if (authIntent === "manage" || !selectedService) {
        setStep("my-bookings"); loadMyBookings(session.token);
      } else {
        setStep("select-slot");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !guestSession || !selectedService) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/book/${slug}/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${guestSession.token}` },
        body: JSON.stringify({ service_id: selectedService.id, starts_at: selectedSlot.startsAt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      if (data.checkout_url) { window.location.href = data.checkout_url; return; }
      if (data.success_url) { window.location.href = data.success_url; return; }
      window.location.href = `/book/${slug}/success?booking_id=${data.booking_id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (booking: GuestBooking) => {
    if (!guestSession) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/book/${slug}/my-bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${guestSession.token}` },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to cancel");
      setMyBookings(prev => prev.map(b => b.id === booking.id ? data.booking : b));
      setActiveConversationBookingId(current => current === booking.id ? null : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setLoading(false);
    }
  };

  const handleStartReschedule = async (booking: GuestBooking) => {
    if (!guestSession || !booking.services) return;
    const service = services.find(s => s.id === booking.services?.id);
    if (!service) { setError("That service is no longer available."); return; }
    setSelectedService(service); setSelectedSlot(null); setSelectedDate(null);
    setReschedulingBooking(booking); setStep("reschedule-slot");
    await loadSlots(guestSession.token, booking.id, service);
  };

  const handleRescheduleBooking = async (slot: TimeSlot) => {
    if (!guestSession || !reschedulingBooking || !selectedService) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/book/${slug}/my-bookings/${reschedulingBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${guestSession.token}` },
        body: JSON.stringify({ action: "reschedule", service_id: selectedService.id, starts_at: slot.startsAt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reschedule");
      setMyBookings(prev => prev.map(b => b.id === reschedulingBooking.id ? data.booking : b));
      setActiveConversationBookingId(reschedulingBooking.id);
      setReschedulingBooking(null); setSelectedService(null); setSlots([]); setSelectedDate(null);
      setStep("my-bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reschedule");
    } finally {
      setLoading(false);
    }
  };

  const renderBookingCard = (
    booking: GuestBooking,
    options: { featured?: boolean; interactive?: boolean } = {}
  ) => {
    const mod = canModifyBooking(booking);
    const active = activeConversationBookingId === booking.id;
    const statusColor = getStatusColor(booking.status);
    const isInteractive = options.interactive && isUpcomingBooking(booking);
    const summary = (
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: options.featured ? 16 : 14, fontWeight: 600, color: "var(--c-text)" }}>
            {booking.services?.name ?? "Appointment"}
          </p>
          <p style={{ fontSize: 13, color: "var(--c-sub)", marginTop: 3 }}>
            {formatDate(booking.starts_at)} · {formatTime(booking.starts_at)}
          </p>
          <p style={{ fontSize: 13, color: "var(--c-muted)", marginTop: 2 }}>
            ${Number(booking.total_price).toFixed(2)}
          </p>
          {isInteractive && (
            <p style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: "var(--c-accent)", marginTop: 10 }}>
              <MessageSquare style={{ width: 12, height: 12 }} />
              {active ? "Conversation open" : "Open AI booking chat"}
            </p>
          )}
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: statusColor.bg, color: statusColor.color, textTransform: "capitalize", flexShrink: 0, marginTop: 2 }}>
          {booking.status}
        </span>
      </div>
    );

    return (
      <div key={booking.id} className={`bk-booking${options.featured ? " bk-booking-feature" : ""}`}>
        {isInteractive ? (
          <button
            type="button"
            className="bk-booking-action"
            onClick={() => setActiveConversationBookingId(current => current === booking.id ? null : booking.id)}
          >
            {summary}
          </button>
        ) : (
          summary
        )}

        {mod && (
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <button type="button" className="bk-btn-sec" onClick={() => handleStartReschedule(booking)} disabled={loading}>
              <RefreshCw style={{ width: 12, height: 12 }} /> Reschedule
            </button>
            <button type="button" className="bk-btn-del" onClick={() => handleCancelBooking(booking)} disabled={loading}>
              <CalendarX style={{ width: 12, height: 12 }} /> Cancel
            </button>
          </div>
        )}

        {active && (
          <div style={{ marginTop: 16 }}>
            <PostBookingChat slug={slug} bookingId={booking.id} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bk">
      <style>{BK_STYLES}</style>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <span className="bk-logo-wrap" aria-label="Rez">
          <Image
            src="/images/logo_transparent.png"
            alt="ReZ logo"
            width={72}
            height={72}
            className="bk-logo-img"
            priority
          />
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {guestSession && (
            <span style={{ fontSize: 12, color: "var(--c-sub)", display: "flex", alignItems: "center", gap: 4 }}>
              <CheckCircle2 style={{ width: 12, height: 12, color: "var(--c-accent)" }} />
              {guestSession.name}
            </span>
          )}
          {!["my-bookings","past-bookings","reschedule-slot"].includes(step) && step !== "select-service" && (
            <ProgressBar step={step} />
          )}
          {step === "select-service" && (
            <button type="button" className="bk-manage" onClick={handleManageBookings}>
              <ListChecks style={{ width: 12, height: 12 }} />
              My bookings
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bk-err" style={{ marginBottom: 16 }}>{error}</div>
      )}

      {/* ── SELECT SERVICE ─────────────────────────────────────────────────── */}
      {step === "select-service" && (
        <div key="select-service" className="bk-card bk-in">
          <div style={{ marginBottom: 28 }}>
            <h1 className="bk-serif" style={{ fontSize: 28, fontWeight: 400, lineHeight: 1.15, marginBottom: 4 }}>
              {business.name}
            </h1>
            {business.owner_name && (
              <p style={{ fontSize: 14, color: "var(--c-sub)" }}>with {business.owner_name}</p>
            )}
          </div>

          <div className="bk-line" style={{ marginBottom: 24 }} />

          <p className="bk-label">Choose a service</p>

          {services.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--c-muted)", padding: "16px 0" }}>No services listed yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {services.map(s => (
                <button key={s.id} type="button" className="bk-svc" onClick={() => handleServiceSelect(s)}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "var(--c-text)", marginBottom: 4 }}>
                      {s.name}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "var(--c-sub)" }}>
                        <Clock style={{ width: 12, height: 12 }} /> {s.duration_mins} min
                      </span>
                      {s.add_ons?.length > 0 && (
                        <span style={{ fontSize: 11, background: "var(--c-divider)", color: "var(--c-sub)", borderRadius: 6, padding: "2px 7px", fontWeight: 500 }}>
                          +{s.add_ons.length} add-on{s.add_ons.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 600, color: "var(--c-text)", flexShrink: 0 }}>
                    ${Number(s.price).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── VERIFY (details + OTP) ─────────────────────────────────────────── */}
      {step === "verify" && (
        <div key="verify" className="bk-card bk-in">
          <button
            type="button"
            className="bk-back"
            onClick={() => {
              setStep("select-service");
              setOtpRequested(false);
              setOtpCode("");
            }}
          >
            <ArrowLeft style={{ width: 13, height: 13 }} /> Back
          </button>

          <h2 className="bk-serif" style={{ fontSize: 26, fontWeight: 400, marginBottom: 6 }}>
            {authIntent === "manage" ? "Verify to continue" : "Verify your details"}
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--c-sub)", marginBottom: 24, lineHeight: 1.5 }}>
            {otpRequested
              ? <>We sent a 6-digit code to <strong style={{ color: "var(--c-text)" }}>{guestInfo.email}</strong></>
              : authIntent === "manage"
                ? "Enter your email and we'll send a verification code."
                : "Enter your info and we'll send a verification code before showing times."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {authIntent === "book" && (
              <div>
                <label className="bk-label">Full name</label>
                <div style={{ position: "relative" }}>
                  <User style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--c-muted)" }} />
                  <input
                    className="bk-input"
                    style={{ paddingLeft: 40 }}
                    placeholder="Jane Smith"
                    value={guestInfo.name}
                    onChange={e => setGuestInfo(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="bk-label">Email address</label>
              <div style={{ position: "relative" }}>
                <Mail style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--c-muted)" }} />
                <input
                  className="bk-input"
                  style={{ paddingLeft: 40 }}
                  type="email"
                  placeholder="jane@example.com"
                  value={guestInfo.email}
                  onChange={e => setGuestInfo(p => ({ ...p, email: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key !== "Enter") return;
                    if (!otpRequested && guestInfo.email && (authIntent === "manage" || guestInfo.name)) {
                      handleSendOtp();
                    }
                    if (otpRequested && otpCode.length === 6) {
                      handleVerifyOtp();
                    }
                  }}
                />
              </div>
            </div>

            {otpRequested && (
              <div>
                <label className="bk-label">Verification code</label>
                <input
                  className="bk-otp"
                  placeholder="——————"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={e => { if (e.key === "Enter" && otpCode.length === 6) handleVerifyOtp(); }}
                  autoFocus
                />
              </div>
            )}

            {!otpRequested ? (
              <button
                type="button"
                className="bk-btn"
                style={{ marginTop: 6 }}
                onClick={handleSendOtp}
                disabled={!guestInfo.email || (authIntent === "book" && !guestInfo.name) || loading}
              >
                {loading ? <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> : "Send verification code"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="bk-btn"
                  onClick={handleVerifyOtp}
                  disabled={otpCode.length !== 6 || loading}
                >
                  {loading ? <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> : "Verify & continue"}
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--c-muted)", textAlign: "center", padding: "4px 0", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--c-accent)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--c-muted)")}
                >
                  Didn&apos;t get it? Resend code
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── SELECT SLOT ────────────────────────────────────────────────────── */}
      {step === "select-slot" && (
        <div key="select-slot" className="bk-in">
          {/* Service summary strip */}
          {selectedService && (
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: "rgba(255,255,255,0.7)", border: "1px solid var(--c-border)" }}>
              <button type="button" className="bk-back" style={{ margin: 0 }} onClick={() => setStep("select-service")}>
                <ArrowLeft style={{ width: 13, height: 13 }} />
              </button>
              <div style={{ width: 1, height: 16, background: "var(--c-border)" }} />
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--c-text)" }}>{selectedService.name}</span>
              <span style={{ fontSize: 13, color: "var(--c-sub)", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock style={{ width: 12, height: 12 }} /> {selectedService.duration_mins} min
              </span>
              <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 600, color: "var(--c-text)" }}>
                ${Number(selectedService.price).toFixed(2)}
              </span>
            </div>
          )}

          <div className="bk-card" style={{ padding: 0 }}>
            {slotsLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "64px 0", color: "var(--c-muted)" }}>
                <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 14 }}>Finding availability…</span>
              </div>
            ) : slots.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "64px 32px", textAlign: "center" }}>
                <CalendarDays style={{ width: 32, height: 32, color: "var(--c-border)" }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--c-sub)" }}>No availability in the next 2 weeks</p>
                <p style={{ fontSize: 13, color: "var(--c-muted)" }}>Check back soon.</p>
              </div>
            ) : (
              <div className="bk-cal-grid">
                {/* Calendar */}
                <div style={{ padding: "28px 28px 24px" }}>
                  <p className="bk-label" style={{ marginBottom: 18 }}>Select a date</p>
                  <CalendarPicker slots={slots} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                </div>
                {/* Slots */}
                <div style={{ padding: "28px 28px 24px" }} className="bk-slots-panel">
                  <TimeSlotsPanel date={selectedDate} slots={slots} onSelect={slot => { setSelectedSlot(slot); setStep("confirm"); }} loading={slotsLoading} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RESCHEDULE SLOT ────────────────────────────────────────────────── */}
      {step === "reschedule-slot" && reschedulingBooking && selectedService && (
        <div key="reschedule-slot" className="bk-in">
          <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.7)", border: "1px solid var(--c-border)" }}>
            <button type="button" className="bk-back" style={{ margin: 0, marginBottom: 6 }} onClick={() => { setReschedulingBooking(null); setSelectedService(null); setSlots([]); setSelectedDate(null); setStep("my-bookings"); }}>
              <ArrowLeft style={{ width: 13, height: 13 }} /> Back to bookings
            </button>
            <p style={{ fontSize: 13, color: "var(--c-sub)" }}>
              Rescheduling: {formatDate(reschedulingBooking.starts_at)} at {formatTime(reschedulingBooking.starts_at)}
            </p>
          </div>
          <div className="bk-card" style={{ padding: 0 }}>
            {slotsLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "64px 0", color: "var(--c-muted)" }}>
                <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 14 }}>Finding new slots…</span>
              </div>
            ) : (
              <div className="bk-cal-grid">
                <div style={{ padding: "28px 28px 24px" }}>
                  <p className="bk-label" style={{ marginBottom: 18 }}>Pick a new date</p>
                  <CalendarPicker slots={slots} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                </div>
                <div style={{ padding: "28px 28px 24px" }} className="bk-slots-panel">
                  <TimeSlotsPanel date={selectedDate} slots={slots} onSelect={handleRescheduleBooking} loading={slotsLoading} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONFIRM ────────────────────────────────────────────────────────── */}
      {step === "confirm" && selectedSlot && selectedService && guestSession && (
        <div key="confirm" className="bk-card bk-in">
          <button type="button" className="bk-back" onClick={() => setStep("select-slot")}>
            <ArrowLeft style={{ width: 13, height: 13 }} /> Back
          </button>

          <h2 className="bk-serif" style={{ fontSize: 26, fontWeight: 400, marginBottom: 24 }}>
            Confirm your booking
          </h2>

          {/* Summary */}
          <div style={{ borderRadius: 14, border: "1.5px solid var(--c-border)", overflow: "hidden", marginBottom: 24 }}>
            <div style={{ padding: "16px 20px", background: "var(--c-accent-soft)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--c-text)" }}>{selectedService.name}</p>
                <p style={{ fontSize: 13, color: "var(--c-sub)", marginTop: 2 }}>{selectedService.duration_mins} min</p>
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--c-text)" }}>
                ${Number(selectedService.price).toFixed(2)}
              </span>
            </div>

            <div style={{ height: 1, background: "var(--c-divider)" }} />

            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="bk-detail">
                <div className="bk-detail-icon">
                  <CalendarDays style={{ width: 13, height: 13, color: "var(--c-sub)" }} />
                </div>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--c-text)" }}>{formatDate(selectedSlot.startsAt)}</p>
                  <p style={{ fontSize: 13, color: "var(--c-sub)", marginTop: 1 }}>
                    {formatTime(selectedSlot.startsAt)} – {formatTime(selectedSlot.endsAt)}
                  </p>
                </div>
              </div>
              <div className="bk-detail">
                <div className="bk-detail-icon">
                  <User style={{ width: 13, height: 13, color: "var(--c-sub)" }} />
                </div>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--c-text)" }}>{guestSession.name}</p>
                  <p style={{ fontSize: 13, color: "var(--c-sub)", marginTop: 1 }}>{guestSession.email}</p>
                </div>
              </div>
            </div>
          </div>

          <button type="button" className="bk-btn" onClick={handleConfirmBooking} disabled={loading}>
            {loading ? (
              <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
            ) : (
              <><CheckCircle2 style={{ width: 16, height: 16 }} /> Book appointment</>
            )}
          </button>
          <p style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: "var(--c-muted)" }}>
            Confirmation sent to {guestSession.email}
          </p>
        </div>
      )}

      {/* ── MY BOOKINGS ────────────────────────────────────────────────────── */}
      {step === "my-bookings" && (
        <div key="my-bookings" className="bk-card bk-in">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
            <div>
              <button type="button" className="bk-back" style={{ marginBottom: 8 }} onClick={() => { setAuthIntent("book"); setStep("select-service"); }}>
                <ArrowLeft style={{ width: 13, height: 13 }} /> Services
              </button>
              <h2 className="bk-serif" style={{ fontSize: 24, fontWeight: 400 }}>Upcoming booking</h2>
              <p style={{ fontSize: 13, color: "var(--c-sub)", marginTop: 2 }}>{guestSession?.email}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 24 }}>
              <button type="button" className="bk-btn-sec" onClick={() => guestSession && loadMyBookings(guestSession.token)} disabled={loading}>
                {loading ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <RefreshCw style={{ width: 13, height: 13 }} />}
                Refresh
              </button>
              <button type="button" className="bk-btn-sec" onClick={handleGuestLogout}>
                <LogOut style={{ width: 13, height: 13 }} />
                Log out
              </button>
              <button
                type="button"
                onClick={() => { setAuthIntent("book"); setSelectedService(null); setStep("select-service"); }}
                style={{ height: 38, padding: "0 14px", borderRadius: 10, border: "none", background: "var(--c-accent)", color: "white", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}
              >
                + Book new
              </button>
            </div>
          </div>

          {loading && myBookings.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "48px 0", color: "var(--c-muted)" }}>
              <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13 }}>Loading…</span>
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <CalendarDays style={{ width: 32, height: 32, color: "var(--c-border)", margin: "0 auto 10px" }} />
              <p style={{ fontSize: 14, color: "var(--c-sub)" }}>No upcoming bookings.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {nextBooking && renderBookingCard(nextBooking, { featured: true, interactive: true })}
              {otherUpcomingBookings.length > 0 && (
                <>
                  <p className="bk-label" style={{ marginTop: 14, marginBottom: 0 }}>More upcoming</p>
                  {otherUpcomingBookings.map(booking => renderBookingCard(booking, { interactive: true }))}
                </>
              )}
            </div>
          )}

          <div style={{ height: 1, background: "var(--c-divider)", margin: "24px -32px 18px" }} />
          <button
            type="button"
            className="bk-btn-sec"
            onClick={() => setStep("past-bookings")}
            style={{ width: "100%", height: 44 }}
          >
            <CalendarDays style={{ width: 13, height: 13 }} />
            View past bookings
            {pastBookings.length > 0 ? ` (${pastBookings.length})` : ""}
          </button>
        </div>
      )}

      {/* ── PAST BOOKINGS ─────────────────────────────────────────────────── */}
      {step === "past-bookings" && (
        <div key="past-bookings" className="bk-card bk-in">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
            <div>
              <button type="button" className="bk-back" style={{ marginBottom: 8 }} onClick={() => setStep("my-bookings")}>
                <ArrowLeft style={{ width: 13, height: 13 }} /> Upcoming
              </button>
              <h2 className="bk-serif" style={{ fontSize: 24, fontWeight: 400 }}>Past bookings</h2>
              <p style={{ fontSize: 13, color: "var(--c-sub)", marginTop: 2 }}>{guestSession?.email}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 24 }}>
              <button type="button" className="bk-btn-sec" onClick={() => guestSession && loadMyBookings(guestSession.token)} disabled={loading}>
                {loading ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <RefreshCw style={{ width: 13, height: 13 }} />}
                Refresh
              </button>
              <button type="button" className="bk-btn-sec" onClick={handleGuestLogout}>
                <LogOut style={{ width: 13, height: 13 }} />
                Log out
              </button>
            </div>
          </div>

          {loading && myBookings.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "48px 0", color: "var(--c-muted)" }}>
              <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13 }}>Loading…</span>
            </div>
          ) : pastBookings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <CalendarDays style={{ width: 32, height: 32, color: "var(--c-border)", margin: "0 auto 10px" }} />
              <p style={{ fontSize: 14, color: "var(--c-sub)" }}>No past bookings yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pastBookings.map(booking => renderBookingCard(booking))}
            </div>
          )}
        </div>
      )}

      {/* Powered by */}
      <p style={{ textAlign: "center", fontSize: 11, color: "var(--c-border)", marginTop: 16 }}>
        Powered by Rez
      </p>
    </div>
  );
}
