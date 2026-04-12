"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  CalendarX,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Mail,
  User,
  Sparkles,
  ListChecks,
  RefreshCw,
} from "lucide-react";

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

type TimeSlot = {
  startsAt: string;
  endsAt: string;
  label: string;
};

type Step =
  | "select-service"
  | "guest-info"
  | "verify-otp"
  | "select-slot"
  | "confirm"
  | "my-bookings"
  | "reschedule-slot";

type GuestSession = {
  token: string;
  email: string;
  name: string;
};

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
  services: {
    id: string;
    name: string;
    duration_mins: number;
    price: number;
  } | null;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function groupSlotsByDate(slots: TimeSlot[]) {
  const groups: Record<string, TimeSlot[]> = {};
  for (const slot of slots) {
    const date = new Date(slot.startsAt).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(slot);
  }
  return groups;
}

function getTodayAndWeekOut() {
  const today = new Date();
  const weekOut = new Date(today);
  weekOut.setDate(weekOut.getDate() + 14);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { dateFrom: fmt(today), dateTo: fmt(weekOut) };
}

function canModifyBooking(booking: GuestBooking) {
  return (
    ["pending", "confirmed"].includes(booking.status) &&
    new Date(booking.starts_at) > new Date()
  );
}

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
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authIntent, setAuthIntent] = useState<"book" | "manage">("book");
  const [myBookings, setMyBookings] = useState<GuestBooking[]>([]);
  const [reschedulingBooking, setReschedulingBooking] = useState<GuestBooking | null>(null);

  const storageKey = `bk_guest_${slug}`;

  // Restore session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as GuestSession;
        setGuestSession(parsed);
        setGuestInfo({ name: parsed.name, email: parsed.email });
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const loadSlots = useCallback(
    async (token: string, excludeBookingId?: string, serviceOverride?: Service) => {
      const service = serviceOverride ?? selectedService;
      if (!service) return;
      setLoading(true);
      setError(null);
      try {
        const { dateFrom, dateTo } = getTodayAndWeekOut();
        const params = new URLSearchParams({
          service_id: service.id,
          date_from: dateFrom,
          date_to: dateTo,
        });
        if (excludeBookingId) params.set("exclude_booking_id", excludeBookingId);
        const res = await fetch(
          `/api/book/${slug}/slots?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load slots");
        setSlots(data.slots ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load slots");
      } finally {
        setLoading(false);
      }
    },
    [slug, selectedService]
  );

  const loadMyBookings = useCallback(
    async (token: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/book/${slug}/my-bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load bookings");
        setMyBookings(data.bookings ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    },
    [slug]
  );

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setError(null);
    setAuthIntent("book");
    if (guestSession) {
      setStep("select-slot");
    } else {
      setStep("guest-info");
    }
  };

  const handleManageBookings = () => {
    setSelectedService(null);
    setSelectedSlot(null);
    setReschedulingBooking(null);
    setAuthIntent("manage");
    setError(null);
    if (guestSession) {
      setStep("my-bookings");
      loadMyBookings(guestSession.token);
    } else {
      setStep("guest-info");
    }
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
        body: JSON.stringify({
          email: guestInfo.email,
          name: guestInfo.name,
          code: otpCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      const session: GuestSession = {
        token: data.token,
        email: data.email,
        name: data.name,
      };
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
        body: JSON.stringify({
          service_id: selectedService.id,
          starts_at: selectedSlot.startsAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
      if (data.success_url) {
        window.location.href = data.success_url;
        return;
      }

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${guestSession.token}`,
        },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to cancel booking");
      setMyBookings((prev) => prev.map((b) => (b.id === booking.id ? data.booking : b)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setLoading(false);
    }
  };

  const handleStartReschedule = async (booking: GuestBooking) => {
    if (!guestSession || !booking.services) return;
    const service = services.find((item) => item.id === booking.services?.id);
    if (!service) {
      setError("That service is no longer available for online rescheduling.");
      return;
    }
    setSelectedService(service);
    setSelectedSlot(null);
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${guestSession.token}`,
        },
        body: JSON.stringify({
          action: "reschedule",
          service_id: selectedService.id,
          starts_at: slot.startsAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reschedule booking");
      setMyBookings((prev) =>
        prev.map((b) => (b.id === reschedulingBooking.id ? data.booking : b))
      );
      setReschedulingBooking(null);
      setSelectedService(null);
      setSlots([]);
      setStep("my-bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reschedule booking");
    } finally {
      setLoading(false);
    }
  };

  // Load slots when entering select-slot step
  useEffect(() => {
    if (step === "select-slot" && guestSession) {
      loadSlots(guestSession.token);
    }
  }, [step, guestSession, loadSlots]);

  const slotGroups = groupSlotsByDate(slots);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/60 bg-teal-900 text-teal-50 shadow-[0_20px_48px_-30px_rgba(15,118,110,0.95),inset_0_1px_0_rgba(255,255,255,0.22)]">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
        {business.owner_name && (
          <p className="text-gray-500 mt-1">with {business.owner_name}</p>
        )}
        <button
          type="button"
          onClick={handleManageBookings}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/60 bg-white/54 px-4 py-2 text-sm font-medium text-teal-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-2xl transition hover:border-teal-200/70 hover:bg-white/76 active:scale-[0.98]"
        >
          <ListChecks className="h-4 w-4" />
          Manage an existing booking
        </button>
      </div>

      {/* Progress steps */}
      {step !== "my-bookings" && step !== "reschedule-slot" && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {(
            [
              { key: "select-service", label: "Service" },
              { key: "guest-info", label: "Your info" },
              { key: "select-slot", label: "Time" },
              { key: "confirm", label: "Confirm" },
            ] as { key: Step; label: string }[]
          ).map((s, i, arr) => {
            const stepOrder: Step[] = [
              "select-service",
              "guest-info",
              "verify-otp",
              "select-slot",
              "confirm",
            ];
            const currentIndex = stepOrder.indexOf(step);
            const sIndex = stepOrder.indexOf(s.key);
            const isActive = s.key === step || (s.key === "guest-info" && step === "verify-otp");
            const isDone = sIndex < currentIndex;

            return (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
                    isDone
                      ? "bg-teal-800 text-white"
                      : isActive
                      ? "bg-teal-900/8 text-teal-800 border-2 border-teal-800"
                      : "bg-white/54 text-zinc-400"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`${
                    isActive
                      ? "text-teal-800 font-medium"
                      : isDone
                      ? "text-teal-700"
                      : "text-gray-400"
                  }`}
                >
                  {s.label}
                </span>
                {i < arr.length - 1 && <div className="mx-1 h-[1px] w-6 bg-white/70" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-200/70 bg-red-50/76 px-4 py-3 text-sm text-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] backdrop-blur-xl">
          {error}
        </div>
      )}

      {/* STEP: Select Service */}
      {step === "select-service" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Choose a service</CardTitle>
            <CardDescription>Select what you would like to book</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {services.length === 0 ? (
              <p className="text-gray-500 text-sm">No services available yet.</p>
            ) : (
              services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="flex items-center justify-between rounded-lg border border-white/60 bg-white/42 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl transition-all hover:border-teal-300/80 hover:bg-white/72 focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{service.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {service.duration_mins} min
                      </span>
                      {service.add_ons?.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {service.add_ons.length} add-on{service.add_ons.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="text-lg font-bold text-teal-800">
                    ${Number(service.price).toFixed(2)}
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP: Guest Info */}
      {step === "guest-info" && (
        <Card>
          <CardHeader>
            <button
              onClick={() => {
                setAuthIntent("book");
                setStep("select-service");
              }}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-700 mb-2 -mt-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <CardTitle className="text-xl">
              {authIntent === "manage" ? "Find your bookings" : "Your details"}
            </CardTitle>
            <CardDescription>
              {authIntent === "manage"
                ? "Enter your email and we will send a verification code"
                : "We'll send a verification code to confirm your booking"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {authIntent === "book" && (
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="name"
                    placeholder="Jane Smith"
                    className="pl-9"
                    value={guestInfo.name}
                    onChange={(e) =>
                      setGuestInfo((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  className="pl-9"
                  value={guestInfo.email}
                  onChange={(e) =>
                    setGuestInfo((p) => ({ ...p, email: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      guestInfo.email &&
                      (authIntent === "manage" || guestInfo.name)
                    ) {
                      handleSendOtp();
                    }
                  }}
                />
              </div>
            </div>
            <Button
              onClick={handleSendOtp}
              disabled={
                !guestInfo.email ||
                (authIntent === "book" && !guestInfo.name) ||
                loading
              }
              className="w-full bg-teal-800 hover:bg-teal-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Send verification code"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP: Verify OTP */}
      {step === "verify-otp" && (
        <Card>
          <CardHeader>
            <button
              onClick={() => setStep("guest-info")}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-700 mb-2 -mt-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>
              We sent a 6-digit code to <strong>{guestInfo.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && otpCode.length === 6)
                    handleVerifyOtp();
                }}
              />
            </div>
            <Button
              onClick={handleVerifyOtp}
              disabled={otpCode.length !== 6 || loading}
              className="w-full bg-teal-800 hover:bg-teal-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Verify & continue"
              )}
            </Button>
            <button
              className="text-sm text-center text-gray-500 hover:text-teal-700"
              onClick={handleSendOtp}
            >
              Did not receive it? Resend
            </button>
          </CardContent>
        </Card>
      )}

      {/* STEP: My Bookings */}
      {step === "my-bookings" && (
        <Card>
          <CardHeader>
            <button
              onClick={() => {
                setAuthIntent("book");
                setStep("select-service");
              }}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-700 mb-2 -mt-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to services
            </button>
            <CardTitle className="text-xl">Your bookings</CardTitle>
            <CardDescription>
              Signed in as <strong>{guestSession?.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => guestSession && loadMyBookings(guestSession.token)}
                disabled={loading || !guestSession}
                className="rounded-lg"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setAuthIntent("book");
                  setSelectedService(null);
                  setStep("select-service");
                }}
                className="rounded-lg bg-teal-800 hover:bg-teal-700"
              >
                Book another service
              </Button>
            </div>

            {loading && myBookings.length === 0 ? (
              <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading bookings...
              </div>
            ) : myBookings.length === 0 ? (
              <div className="text-center py-10">
                <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No bookings found for this email.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Book a service to see it here.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {myBookings.map((booking) => {
                  const modifiable = canModifyBooking(booking);
                  const serviceName = booking.services?.name ?? "Appointment";
                  return (
                    <div
                      key={booking.id}
                      className="rounded-lg border border-white/60 bg-white/44 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{serviceName}</p>
                          <p className="mt-1 text-sm text-gray-600">
                            {formatDate(booking.starts_at)} at {formatTime(booking.starts_at)}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            ${Number(booking.total_price).toFixed(2)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            booking.status === "confirmed"
                              ? "success"
                              : booking.status === "pending"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>

                      {modifiable && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleStartReschedule(booking)}
                            disabled={loading}
                            className="rounded-lg"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Reschedule
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => handleCancelBooking(booking)}
                            disabled={loading}
                            className="rounded-lg"
                          >
                            <CalendarX className="h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP: Reschedule Slot */}
      {step === "reschedule-slot" && reschedulingBooking && selectedService && (
        <Card>
          <CardHeader>
            <button
              onClick={() => {
                setReschedulingBooking(null);
                setSelectedService(null);
                setSlots([]);
                setStep("my-bookings");
              }}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-700 mb-2 -mt-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to bookings
            </button>
            <CardTitle className="text-xl">Choose a new time</CardTitle>
            <CardDescription>
              {selectedService.name} · currently {formatDate(reschedulingBooking.starts_at)} at{" "}
              {formatTime(reschedulingBooking.starts_at)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                Finding available times...
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-10">
                <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No available reschedule times in the next 2 weeks.</p>
                <p className="text-sm text-gray-400 mt-1">Please check back soon.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(slotGroups).map(([date, daySlots]) => (
                  <div key={date}>
                    <p className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-teal-700" />
                      {date}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {daySlots.map((slot) => (
                        <button
                          key={slot.startsAt}
                          onClick={() => handleRescheduleBooking(slot)}
                          className="rounded-lg border border-white/60 bg-white/40 py-2.5 text-sm font-medium text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl transition-all hover:border-teal-300/80 hover:bg-white/72 hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP: Select Slot */}
      {step === "select-slot" && (
        <Card>
          <CardHeader>
            <button
              onClick={() => setStep("select-service")}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-700 mb-2 -mt-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <CardTitle className="text-xl">Pick a time</CardTitle>
            {selectedService && (
              <CardDescription>
                {selectedService.name} · {selectedService.duration_mins} min
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                Finding available times…
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-10">
                <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No available slots in the next 2 weeks.</p>
                <p className="text-sm text-gray-400 mt-1">Please check back soon.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(slotGroups).map(([date, daySlots]) => (
                  <div key={date}>
                    <p className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-teal-700" />
                      {date}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {daySlots.map((slot) => (
                        <button
                          key={slot.startsAt}
                          onClick={() => handleSlotSelect(slot)}
                          className="rounded-lg border border-white/60 bg-white/40 py-2.5 text-sm font-medium text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl transition-all hover:border-teal-300/80 hover:bg-white/72 hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP: Confirm */}
      {step === "confirm" && selectedSlot && selectedService && guestSession && (
        <Card>
          <CardHeader>
            <button
              onClick={() => setStep("select-slot")}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-700 mb-2 -mt-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <CardTitle className="text-xl">Confirm your booking</CardTitle>
            <CardDescription>Review the details below</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-3 rounded-lg border border-white/60 bg-white/44 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {selectedService.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedService.duration_mins} min
                  </p>
                </div>
                <span className="text-xl font-bold text-teal-800">
                  ${Number(selectedService.price).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-white/60 pt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarDays className="w-4 h-4 text-teal-700 shrink-0" />
                  {formatDate(selectedSlot.startsAt)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-teal-700 shrink-0" />
                  {formatTime(selectedSlot.startsAt)} – {formatTime(selectedSlot.endsAt)}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 rounded-lg border border-white/60 bg-white/44 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                {guestSession.name}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                {guestSession.email}
              </div>
            </div>

            <Button
              onClick={handleConfirmBooking}
              disabled={loading}
              className="w-full bg-teal-800 hover:bg-teal-700 h-12 text-base"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Book appointment
                </>
              )}
            </Button>
            <p className="text-xs text-center text-gray-400">
              A confirmation will be sent to {guestSession.email}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
