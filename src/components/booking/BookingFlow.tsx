"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Mail,
  User,
  Sparkles,
  ListChecks,
  RefreshCw,
  CalendarDays,
  CalendarX,
  DollarSign,
} from "lucide-react";

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
  | "guest-info"
  | "verify-otp"
  | "select-slot"
  | "confirm"
  | "my-bookings"
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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

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

function getTwoWeeksRange() {
  const today = new Date();
  const out = new Date(today);
  out.setDate(out.getDate() + 14);
  return { dateFrom: toIsoDate(today), dateTo: toIsoDate(out) };
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

  // Start the calendar on the first month that has available slots (or today's month)
  const initialMonth = useMemo(() => {
    if (slots.length === 0) return { year: todayDate.getFullYear(), month: todayDate.getMonth() };
    const first = [...availableDates].sort()[0];
    if (!first) return { year: todayDate.getFullYear(), month: todayDate.getMonth() };
    const d = new Date(first + "T12:00:00");
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [slots, availableDates, todayDate]);

  const [view, setView] = useState(initialMonth);

  // Compute bounds from slot range
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

  function prevMonth() {
    setView((v) => {
      const d = new Date(v.year, v.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function nextMonth() {
    setView((v) => {
      const d = new Date(v.year, v.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <div className="w-full select-none">
      {/* Month header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MONTHS[view.month]} {view.year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          disabled={!canGoNext}
          className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Day of week headers */}
      <div className="mb-1 grid grid-cols-7">
        {DAYS.map((d) => (
          <div key={d} className="py-1 text-center text-[11px] font-semibold text-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`blank-${idx}`} />;
          }

          const iso = `${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = iso === today;
          const isPast = iso < today;
          const hasSlots = availableDates.has(iso);
          const isSelected = iso === selectedDate;
          const isClickable = hasSlots && !isPast;

          return (
            <div key={iso} className="flex justify-center">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onSelectDate(iso)}
                className={[
                  "relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all",
                  isSelected
                    ? "bg-teal-700 text-white shadow-md"
                    : isClickable
                    ? "text-gray-800 hover:bg-teal-50 hover:text-teal-700 cursor-pointer"
                    : "text-gray-300 cursor-default",
                  isToday && !isSelected ? "ring-2 ring-teal-300 ring-offset-1" : "",
                ].join(" ")}
              >
                {day}
                {hasSlots && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-teal-500" />
                )}
              </button>
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
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <CalendarDays className="h-10 w-10 text-gray-200" />
        <p className="text-sm text-gray-400">Select a date to see available times</p>
      </div>
    );
  }

  const dayLabel = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const daySlots = slots.filter((s) => s.startsAt.slice(0, 10) === date);

  return (
    <div className="flex h-full flex-col">
      <p className="mb-4 text-sm font-semibold text-gray-700">{dayLabel}</p>
      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : daySlots.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <CalendarX className="h-8 w-8 text-gray-200" />
          <p className="text-sm text-gray-400">No times available on this day</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {daySlots.map((slot) => (
            <button
              key={slot.startsAt}
              type="button"
              onClick={() => onSelect(slot)}
              className="group w-full rounded-xl border-2 border-teal-600/20 bg-white py-3 text-sm font-semibold text-teal-800 shadow-sm transition-all hover:border-teal-600 hover:bg-teal-600 hover:text-white hover:shadow-md active:scale-[0.98]"
            >
              {slot.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Left info sidebar ────────────────────────────────────────────────────────

function InfoPanel({
  business,
  service,
  selectedSlot,
}: {
  business: Business;
  service: Service | null;
  selectedSlot: TimeSlot | null;
}) {
  return (
    <div className="flex flex-col gap-5 lg:border-r lg:border-gray-100 lg:pr-8">
      {/* Logo + name */}
      <div className="flex items-center gap-3 lg:flex-col lg:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-800 text-teal-50 shadow-lg">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900 lg:text-xl">{business.name}</h1>
          {business.owner_name && (
            <p className="text-sm text-gray-400">with {business.owner_name}</p>
          )}
        </div>
      </div>

      {/* Service details */}
      {service && (
        <div className="space-y-2.5 rounded-xl bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-800">{service.name}</p>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="h-3.5 w-3.5 text-teal-600" />
            {service.duration_mins} minutes
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <DollarSign className="h-3.5 w-3.5 text-teal-600" />
            {Number(service.price).toFixed(2)}
          </div>
          {selectedSlot && (
            <>
              <div className="my-1 border-t border-gray-200" />
              <div className="flex items-start gap-1.5 text-sm text-gray-600">
                <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
                <span>
                  {formatDate(selectedSlot.startsAt)}
                  <br />
                  <span className="font-medium">
                    {formatTime(selectedSlot.startsAt)} – {formatTime(selectedSlot.endsAt)}
                  </span>
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Powered by */}
      <p className="mt-auto hidden text-[11px] text-gray-300 lg:block">Powered by Rez</p>
    </div>
  );
}

// ─── Glass card ───────────────────────────────────────────────────────────────

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_4px_32px_-8px_rgba(0,0,0,0.08)] ${className}`}>
      {children}
    </div>
  );
}

// ─── Back button ──────────────────────────────────────────────────────────────

function Back({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 flex items-center gap-1 text-sm text-gray-400 transition hover:text-teal-700"
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}

// ─── Step progress ────────────────────────────────────────────────────────────

const STEP_ORDER: Step[] = ["select-service", "guest-info", "verify-otp", "select-slot", "confirm"];
const STEP_LABELS = ["Service", "Your info", "Time", "Confirm"];
const STEP_DISPLAY: Step[] = ["select-service", "guest-info", "select-slot", "confirm"];

function StepProgress({ step }: { step: Step }) {
  const currentIdx = STEP_ORDER.indexOf(step);
  return (
    <div className="flex items-center justify-center gap-2">
      {STEP_DISPLAY.map((s, i) => {
        const sIdx = STEP_ORDER.indexOf(s);
        const done = sIdx < currentIdx;
        const active = s === step || (s === "guest-info" && step === "verify-otp");
        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={[
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all",
                done ? "bg-teal-700 text-white" :
                active ? "border-2 border-teal-700 bg-white text-teal-700" :
                "bg-gray-100 text-gray-400",
              ].join(" ")}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={[
              "text-xs font-medium hidden sm:block",
              active ? "text-teal-700" : done ? "text-teal-600" : "text-gray-400",
            ].join(" ")}>
              {STEP_LABELS[i]}
            </span>
            {i < STEP_DISPLAY.length - 1 && (
              <div className={`h-px w-6 ${done ? "bg-teal-300" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BookingFlow({
  slug,
  business,
  services,
}: {
  slug: string;
  business: Business;
  services: Service[];
}) {
  const [step, setStep] = useState<Step>("select-service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "" });
  const [otpCode, setOtpCode] = useState("");
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

  const storageKey = `bk_guest_${slug}`;

  // Restore session
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
        // Auto-select first available date
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

  // Load slots when entering select-slot
  useEffect(() => {
    if (step === "select-slot" && guestSession) loadSlots(guestSession.token);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setError(null);
    setAuthIntent("book");
    if (guestSession) { setStep("select-slot"); }
    else { setStep("guest-info"); }
  };

  const handleManageBookings = () => {
    setSelectedService(null);
    setSelectedSlot(null);
    setReschedulingBooking(null);
    setAuthIntent("manage");
    setError(null);
    if (guestSession) { setStep("my-bookings"); loadMyBookings(guestSession.token); }
    else { setStep("guest-info"); }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/book/${slug}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: guestInfo.email, name: guestInfo.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send code");
      setStep("verify-otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/book/${slug}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: guestInfo.email, name: guestInfo.name, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      const session: GuestSession = { token: data.token, email: data.email, name: data.name };
      setGuestSession(session);
      localStorage.setItem(storageKey, JSON.stringify(session));
      if (authIntent === "manage" || !selectedService) {
        setStep("my-bookings");
        loadMyBookings(session.token);
      } else {
        setStep("select-slot");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep("confirm");
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !guestSession || !selectedService) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/book/${slug}/booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${guestSession.token}`,
        },
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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/book/${slug}/my-bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${guestSession.token}` },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to cancel");
      setMyBookings((prev) => prev.map((b) => (b.id === booking.id ? data.booking : b)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setLoading(false);
    }
  };

  const handleStartReschedule = async (booking: GuestBooking) => {
    if (!guestSession || !booking.services) return;
    const service = services.find((s) => s.id === booking.services?.id);
    if (!service) { setError("That service is no longer available for rescheduling."); return; }
    setSelectedService(service);
    setSelectedSlot(null);
    setSelectedDate(null);
    setReschedulingBooking(booking);
    setStep("reschedule-slot");
    await loadSlots(guestSession.token, booking.id, service);
  };

  const handleRescheduleBooking = async (slot: TimeSlot) => {
    if (!guestSession || !reschedulingBooking || !selectedService) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/book/${slug}/my-bookings/${reschedulingBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${guestSession.token}` },
        body: JSON.stringify({ action: "reschedule", service_id: selectedService.id, starts_at: slot.startsAt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reschedule");
      setMyBookings((prev) => prev.map((b) => (b.id === reschedulingBooking.id ? data.booking : b)));
      setReschedulingBooking(null);
      setSelectedService(null);
      setSlots([]);
      setSelectedDate(null);
      setStep("my-bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reschedule");
    } finally {
      setLoading(false);
    }
  };

  const isCalendarStep = step === "select-slot" || step === "reschedule-slot";
  const showSidebar = step !== "my-bookings";

  return (
    <div className="flex flex-col gap-5">
      {/* Top bar: logo link + manage bookings */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold tracking-tight text-teal-800">rez</span>
        {step === "select-service" && (
          <button
            type="button"
            onClick={handleManageBookings}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:border-teal-200 hover:text-teal-700"
          >
            <ListChecks className="h-3.5 w-3.5" /> Manage booking
          </button>
        )}
      </div>

      {/* Step progress */}
      {!["my-bookings", "reschedule-slot"].includes(step) && (
        <StepProgress step={step} />
      )}

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── STEP: Select service ─────────────────────────────────────────────── */}
      {step === "select-service" && (
        <GlassCard>
          <h2 className="mb-1 text-xl font-bold text-gray-900">{business.name}</h2>
          {business.owner_name && (
            <p className="mb-5 text-sm text-gray-400">with {business.owner_name}</p>
          )}
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Choose a service
          </p>
          {services.length === 0 ? (
            <p className="text-sm text-gray-400">No services available yet.</p>
          ) : (
            <div className="space-y-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleServiceSelect(s)}
                  className="group flex w-full items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 text-left transition-all hover:border-teal-200 hover:bg-teal-50 active:scale-[0.99]"
                >
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-teal-800">
                      {s.name}
                    </p>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3.5 w-3.5" /> {s.duration_mins} min
                      </span>
                      {s.add_ons?.length > 0 && (
                        <Badge variant="secondary" className="text-[11px]">
                          +{s.add_ons.length} add-on{s.add_ons.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="text-lg font-bold text-teal-800">
                    ${Number(s.price).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* ── STEP: Guest info ─────────────────────────────────────────────────── */}
      {step === "guest-info" && (
        <GlassCard>
          <Back onClick={() => setStep("select-service")} />
          <h2 className="mb-1 text-xl font-bold text-gray-900">
            {authIntent === "manage" ? "Find your bookings" : "Your details"}
          </h2>
          <p className="mb-5 text-sm text-gray-400">
            {authIntent === "manage"
              ? "We'll send a verification code to your email"
              : "We'll send a code to confirm your booking"}
          </p>
          <div className="space-y-4">
            {authIntent === "book" && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-gray-500">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                  <Input
                    id="name"
                    placeholder="Jane Smith"
                    className="pl-10 h-11 rounded-xl border-gray-200"
                    value={guestInfo.name}
                    onChange={(e) => setGuestInfo((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-gray-500">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  className="pl-10 h-11 rounded-xl border-gray-200"
                  value={guestInfo.email}
                  onChange={(e) => setGuestInfo((p) => ({ ...p, email: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && guestInfo.email && (authIntent === "manage" || guestInfo.name))
                      handleSendOtp();
                  }}
                />
              </div>
            </div>
            <Button
              onClick={handleSendOtp}
              disabled={!guestInfo.email || (authIntent === "book" && !guestInfo.name) || loading}
              className="h-12 w-full rounded-xl bg-teal-700 text-base hover:bg-teal-600"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send verification code"}
            </Button>
          </div>
        </GlassCard>
      )}

      {/* ── STEP: Verify OTP ─────────────────────────────────────────────────── */}
      {step === "verify-otp" && (
        <GlassCard>
          <Back onClick={() => setStep("guest-info")} />
          <h2 className="mb-1 text-xl font-bold text-gray-900">Check your email</h2>
          <p className="mb-5 text-sm text-gray-400">
            We sent a 6-digit code to <strong className="text-gray-700">{guestInfo.email}</strong>
          </p>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="otp" className="text-xs font-semibold text-gray-500">Verification code</Label>
              <Input
                id="otp"
                placeholder="000000"
                maxLength={6}
                className="h-14 rounded-xl border-gray-200 text-center font-mono text-2xl tracking-[0.4em]"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => { if (e.key === "Enter" && otpCode.length === 6) handleVerifyOtp(); }}
              />
            </div>
            <Button
              onClick={handleVerifyOtp}
              disabled={otpCode.length !== 6 || loading}
              className="h-12 w-full rounded-xl bg-teal-700 text-base hover:bg-teal-600"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & continue"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-sm text-gray-400 transition hover:text-teal-700"
              onClick={handleSendOtp}
            >
              Didn&apos;t receive it? Resend code
            </button>
          </div>
        </GlassCard>
      )}

      {/* ── STEP: Select slot (Calendly layout) ──────────────────────────────── */}
      {step === "select-slot" && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_32px_-8px_rgba(0,0,0,0.08)]">
          <div className="grid lg:grid-cols-[260px_1fr_220px]">
            {/* Info sidebar */}
            <div className="border-b border-gray-100 p-6 lg:border-b-0 lg:border-r">
              <InfoPanel business={business} service={selectedService} selectedSlot={null} />
            </div>

            {/* Calendar */}
            <div className="border-b border-gray-100 p-6 lg:border-b-0 lg:border-r">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Select a date
              </p>
              {slotsLoading ? (
                <div className="flex items-center justify-center gap-2 py-20 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Finding availability…</span>
                </div>
              ) : slots.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <CalendarDays className="h-10 w-10 text-gray-200" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">No availability in the next 2 weeks</p>
                    <p className="mt-1 text-xs text-gray-400">Please check back soon.</p>
                  </div>
                </div>
              ) : (
                <CalendarPicker
                  slots={slots}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              )}
            </div>

            {/* Time slots panel */}
            <div className="p-6" style={{ minHeight: 400 }}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {selectedDate ? "Available times" : "Select a date"}
              </p>
              <TimeSlotsPanel
                date={selectedDate}
                slots={slots}
                onSelect={handleSlotSelect}
                loading={slotsLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP: Reschedule (same calendar layout) ───────────────────────────── */}
      {step === "reschedule-slot" && reschedulingBooking && selectedService && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_32px_-8px_rgba(0,0,0,0.08)]">
          <div className="border-b border-gray-100 px-6 py-4">
            <Back
              onClick={() => { setReschedulingBooking(null); setSelectedService(null); setSlots([]); setSelectedDate(null); setStep("my-bookings"); }}
              label="Back to bookings"
            />
            <p className="text-xs text-gray-400">
              Currently: {formatDate(reschedulingBooking.starts_at)} at {formatTime(reschedulingBooking.starts_at)}
            </p>
          </div>
          <div className="grid lg:grid-cols-[260px_1fr_220px]">
            <div className="border-b border-gray-100 p-6 lg:border-b-0 lg:border-r">
              <InfoPanel business={business} service={selectedService} selectedSlot={null} />
            </div>
            <div className="border-b border-gray-100 p-6 lg:border-b-0 lg:border-r">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Select a new date</p>
              {slotsLoading ? (
                <div className="flex items-center justify-center gap-2 py-20 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Finding availability…</span>
                </div>
              ) : (
                <CalendarPicker slots={slots} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
              )}
            </div>
            <div className="p-6" style={{ minHeight: 400 }}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {selectedDate ? "Available times" : "Select a date"}
              </p>
              <TimeSlotsPanel
                date={selectedDate}
                slots={slots}
                onSelect={handleRescheduleBooking}
                loading={slotsLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP: Confirm ────────────────────────────────────────────────────── */}
      {step === "confirm" && selectedSlot && selectedService && guestSession && (
        <GlassCard>
          <Back onClick={() => setStep("select-slot")} />
          <h2 className="mb-5 text-xl font-bold text-gray-900">Confirm your booking</h2>

          {/* Summary */}
          <div className="mb-4 space-y-0 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-gray-900">{selectedService.name}</p>
                <p className="text-sm text-gray-400">{selectedService.duration_mins} min</p>
              </div>
              <span className="text-xl font-bold text-teal-800">
                ${Number(selectedService.price).toFixed(2)}
              </span>
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CalendarDays className="h-4 w-4 shrink-0 text-teal-600" />
                {formatDate(selectedSlot.startsAt)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 shrink-0 text-teal-600" />
                {formatTime(selectedSlot.startsAt)} – {formatTime(selectedSlot.endsAt)}
              </div>
            </div>
            <div className="space-y-1.5 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User className="h-4 w-4 shrink-0 text-gray-300" />
                {guestSession.name}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4 shrink-0 text-gray-300" />
                {guestSession.email}
              </div>
            </div>
          </div>

          <Button
            onClick={handleConfirmBooking}
            disabled={loading}
            className="h-12 w-full rounded-xl bg-teal-700 text-base hover:bg-teal-600"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" /> Book appointment
              </>
            )}
          </Button>
          <p className="mt-3 text-center text-xs text-gray-400">
            Confirmation will be sent to {guestSession.email}
          </p>
        </GlassCard>
      )}

      {/* ── STEP: My bookings ────────────────────────────────────────────────── */}
      {step === "my-bookings" && (
        <GlassCard>
          <Back onClick={() => { setAuthIntent("book"); setStep("select-service"); }} label="Back to services" />
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your bookings</h2>
              <p className="text-sm text-gray-400">{guestSession?.email}</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => guestSession && loadMyBookings(guestSession.token)}
                disabled={loading || !guestSession}
                className="rounded-lg text-xs"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Refresh
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => { setAuthIntent("book"); setSelectedService(null); setStep("select-service"); }}
                className="rounded-lg bg-teal-700 text-xs hover:bg-teal-600"
              >
                Book another
              </Button>
            </div>
          </div>

          {loading && myBookings.length === 0 ? (
            <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : myBookings.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays className="mx-auto mb-3 h-10 w-10 text-gray-200" />
              <p className="text-sm text-gray-500">No bookings found for this email.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myBookings.map((booking) => {
                const modifiable = canModifyBooking(booking);
                return (
                  <div
                    key={booking.id}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{booking.services?.name ?? "Appointment"}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          {formatDate(booking.starts_at)} at {formatTime(booking.starts_at)}
                        </p>
                        <p className="text-sm text-gray-400">${Number(booking.total_price).toFixed(2)}</p>
                      </div>
                      <Badge
                        variant={booking.status === "confirmed" ? "success" : booking.status === "pending" ? "warning" : "secondary"}
                        className="text-xs"
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    {modifiable && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartReschedule(booking)}
                          disabled={loading}
                          className="rounded-lg text-xs"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Reschedule
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelBooking(booking)}
                          disabled={loading}
                          className="rounded-lg text-xs"
                        >
                          <CalendarX className="h-3.5 w-3.5" /> Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      {/* Powered by */}
      <p className="text-center text-[11px] text-gray-300">Powered by Rez</p>
    </div>
  );
}
