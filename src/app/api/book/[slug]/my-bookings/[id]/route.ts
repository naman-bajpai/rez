import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { getAvailableSlots } from "@/lib/server/booking-engine";
import { verifyGuestSession } from "@/lib/server/guest-auth";

async function getBusinessAndGuest(slug: string, request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) throw Object.assign(new Error("Unauthorized"), { status: 401 });

  const supabase = createServiceRoleClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!business) throw Object.assign(new Error("Business not found"), { status: 404 });

  const guest = await verifyGuestSession(token, business.id as string);
  return { supabase, businessId: business.id as string, guest };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await context.params;
    const { supabase, businessId, guest } = await getBusinessAndGuest(slug, request);

    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, service_id, starts_at, ends_at, status, payment_status, total_price, guest_name, guest_email, services(id, name, duration_mins, price)"
      )
      .eq("id", id)
      .eq("business_id", businessId)
      .eq("guest_email", guest.email)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    return NextResponse.json({ booking: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status =
      msg === "Unauthorized" || msg === "Session expired"
        ? 401
        : (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await context.params;
    const { supabase, businessId, guest } = await getBusinessAndGuest(slug, request);
    const body = await request.json();
    const { action, service_id, starts_at } = body as {
      action?: "cancel" | "reschedule";
      service_id?: string;
      starts_at?: string;
    };

    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("id, service_id, status, starts_at")
      .eq("id", id)
      .eq("business_id", businessId)
      .eq("guest_email", guest.email)
      .maybeSingle();

    if (bookingErr) throw new Error(bookingErr.message);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    if (!["pending", "confirmed"].includes(booking.status as string)) {
      return NextResponse.json(
        { error: `Cannot modify a ${booking.status} booking.` },
        { status: 400 }
      );
    }

    if (action === "cancel") {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", id)
        .select(
          "id, service_id, starts_at, ends_at, status, payment_status, total_price, guest_name, guest_email, services(id, name, duration_mins, price)"
        )
        .single();

      if (error) throw new Error(error.message);
      return NextResponse.json({ booking: data });
    }

    if (action !== "reschedule" || !starts_at) {
      return NextResponse.json(
        { error: "action=reschedule with starts_at or action=cancel is required" },
        { status: 400 }
      );
    }

    const nextStartsAt = new Date(starts_at);
    if (Number.isNaN(nextStartsAt.getTime()) || nextStartsAt <= new Date()) {
      return NextResponse.json({ error: "Choose a future appointment time." }, { status: 400 });
    }

    const serviceId = service_id ?? (booking.service_id as string | null);
    if (!serviceId) {
      return NextResponse.json({ error: "service_id is required" }, { status: 400 });
    }

    const { data: service, error: serviceErr } = await supabase
      .from("services")
      .select("id, duration_mins, price")
      .eq("id", serviceId)
      .eq("business_id", businessId)
      .eq("is_active", true)
      .maybeSingle();

    if (serviceErr) throw new Error(serviceErr.message);
    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const date = nextStartsAt.toISOString().split("T")[0];
    const availableSlots = await getAvailableSlots({
      businessId,
      serviceId,
      dateFrom: date,
      dateTo: date,
      excludeBookingId: id,
    });

    if (!availableSlots.some((slot) => slot.startsAt === nextStartsAt.toISOString())) {
      return NextResponse.json({ error: "That time is no longer available." }, { status: 409 });
    }

    const nextEndsAt = new Date(
      nextStartsAt.getTime() + (service.duration_mins as number) * 60000
    ).toISOString();

    const { data, error } = await supabase
      .from("bookings")
      .update({
        service_id: serviceId,
        starts_at: nextStartsAt.toISOString(),
        ends_at: nextEndsAt,
        total_price: service.price,
      })
      .eq("id", id)
      .select(
        "id, service_id, starts_at, ends_at, status, payment_status, total_price, guest_name, guest_email, services(id, name, duration_mins, price)"
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "That time slot was just taken. Please choose another time." },
          { status: 409 }
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ booking: data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status =
      msg === "Unauthorized" || msg === "Session expired"
        ? 401
        : (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
