import Link from "next/link";
import { CheckCircle2, CalendarDays, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createServiceRoleClient } from "@/lib/server/supabase";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ booking_id?: string }>;
};

async function getBookingDetails(bookingId: string) {
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("bookings")
      .select(
        "id, starts_at, ends_at, status, guest_name, guest_email, services(name, duration_mins, price)"
      )
      .eq("id", bookingId)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export default async function BookingSuccessPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { booking_id } = await searchParams;

  const booking = booking_id ? await getBookingDetails(booking_id) : null;

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      time: d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const startInfo = booking?.starts_at ? formatDateTime(booking.starts_at) : null;
  const endTime = booking?.ends_at
    ? new Date(booking.ends_at).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-green-100 mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">You're booked!</h1>
          <p className="text-gray-500 mt-2">
            {booking?.guest_name
              ? `See you soon, ${booking.guest_name}!`
              : "Your appointment has been confirmed."}
          </p>
        </div>

        {booking && (
          <Card className="mb-6">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {(Array.isArray(booking.services)
                      ? (booking.services[0] as { name: string } | undefined)?.name
                      : (booking.services as { name: string } | null)?.name) ?? "Appointment"}
                  </p>
                  {(() => {
                    const svc = Array.isArray(booking.services)
                      ? (booking.services[0] as { duration_mins: number } | undefined)
                      : (booking.services as { duration_mins: number } | null);
                    return svc?.duration_mins ? (
                      <p className="text-sm text-gray-500">{svc.duration_mins} min</p>
                    ) : null;
                  })()}
                </div>
                <span className="text-sm font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full capitalize">
                  {booking.status}
                </span>
              </div>

              {startInfo && (
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex items-center gap-3 text-gray-600">
                    <CalendarDays className="w-5 h-5 text-violet-500 shrink-0" />
                    <span className="text-sm font-medium">{startInfo.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 pl-8">
                    <span className="text-sm">
                      {startInfo.time}
                      {endTime && ` – ${endTime}`}
                    </span>
                  </div>
                </div>
              )}

              {booking.guest_email && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400">
                    Confirmation sent to <strong>{booking.guest_email}</strong>
                  </p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 font-mono">
                  Ref: {booking_id?.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          <Button
            asChild
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            <Link href={`/book/${slug}`}>
              <Sparkles className="w-4 h-4" />
              Book another appointment
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
