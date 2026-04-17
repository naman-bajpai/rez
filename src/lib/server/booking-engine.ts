import { createServiceRoleClient } from "./supabase";

type UnavailableBlock = {
  start_time: string;
  end_time: string;
};

type ScheduleRule = {
  start: string;
  end: string;
  isActive: boolean;
  unavailableBlocks: UnavailableBlock[];
};

function normalizeUnavailableBlocks(value: unknown): UnavailableBlock[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((block) => {
      if (!block || typeof block !== "object") return null;

      const candidate = block as Partial<UnavailableBlock>;
      if (
        typeof candidate.start_time !== "string" ||
        typeof candidate.end_time !== "string"
      ) {
        return null;
      }

      return {
        start_time: candidate.start_time,
        end_time: candidate.end_time,
      };
    })
    .filter((block): block is UnavailableBlock => block !== null);
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Generate 30-minute time slots for a given day, service, and business.
 */
export async function getAvailableSlots(params: {
  businessId: string;
  serviceId: string;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
  excludeBookingId?: string;
}): Promise<{ startsAt: string; endsAt: string; label: string }[]> {
  const supabase = createServiceRoleClient();
  const { businessId, serviceId, dateFrom, dateTo, excludeBookingId } = params;

  // Get service duration
  const { data: service, error: svcErr } = await supabase
    .from("services")
    .select("duration_mins")
    .eq("id", serviceId)
    .eq("business_id", businessId)
    .eq("is_active", true)
    .maybeSingle();

  if (svcErr || !service) return [];

  const durationMins = service.duration_mins as number;

  // Get business availability schedule
  const { data: schedule } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time, unavailable_blocks")
    .eq("business_id", businessId)
    .eq("is_active", true);

  const { data: overrides } = await supabase
    .from("availability_overrides")
    .select("date, start_time, end_time, is_active, unavailable_blocks")
    .eq("business_id", businessId)
    .gte("date", dateFrom)
    .lte("date", dateTo);

  if ((!schedule || schedule.length === 0) && (!overrides || overrides.length === 0)) {
    return [];
  }

  // Get existing confirmed/pending bookings in the range
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("id, starts_at, ends_at")
    .eq("business_id", businessId)
    .in("status", ["pending", "confirmed"])
    .gte("starts_at", `${dateFrom}T00:00:00.000Z`)
    .lte("starts_at", `${dateTo}T23:59:59.000Z`);

  const bookedRanges = (existingBookings ?? [])
    .filter((b: { id: string }) => b.id !== excludeBookingId)
    .map((b: { starts_at: string; ends_at: string }) => ({
      start: new Date(b.starts_at).getTime(),
      end: new Date(b.ends_at).getTime(),
    }));

  const slots: { startsAt: string; endsAt: string; label: string }[] = [];
  const scheduleMap = new Map<number, ScheduleRule>();
  for (const s of schedule ?? []) {
    scheduleMap.set(s.day_of_week as number, {
      start: s.start_time as string,
      end: s.end_time as string,
      isActive: true,
      unavailableBlocks: normalizeUnavailableBlocks(s.unavailable_blocks),
    });
  }

  const overrideMap = new Map<string, ScheduleRule>();
  for (const override of overrides ?? []) {
    overrideMap.set(override.date as string, {
      start: override.start_time as string,
      end: override.end_time as string,
      isActive: Boolean(override.is_active),
      unavailableBlocks: normalizeUnavailableBlocks(override.unavailable_blocks),
    });
  }

  // Iterate each day in [dateFrom, dateTo]
  const current = new Date(`${dateFrom}T00:00:00`);
  const end = new Date(`${dateTo}T23:59:59`);
  const now = new Date();

  while (current <= end && slots.length < 50) {
    const dow = current.getDay();
    const avail = overrideMap.get(dateKey(current)) ?? scheduleMap.get(dow);
    if (avail?.isActive) {
      const [sh, sm] = avail.start.split(":").map(Number);
      const [eh, em] = avail.end.split(":").map(Number);

      const dayStart = new Date(current);
      dayStart.setHours(sh, sm, 0, 0);
      const dayEnd = new Date(current);
      dayEnd.setHours(eh, em, 0, 0);

      const unavailableRanges = avail.unavailableBlocks.map((block) => {
        const [blockStartHour, blockStartMinute] = block.start_time.split(":").map(Number);
        const [blockEndHour, blockEndMinute] = block.end_time.split(":").map(Number);
        const blockStart = new Date(current);
        blockStart.setHours(blockStartHour, blockStartMinute, 0, 0);
        const blockEnd = new Date(current);
        blockEnd.setHours(blockEndHour, blockEndMinute, 0, 0);

        return {
          start: blockStart.getTime(),
          end: blockEnd.getTime(),
        };
      });

      let slotStart = new Date(dayStart);
      while (slotStart.getTime() + durationMins * 60000 <= dayEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + durationMins * 60000);

        // Skip past slots
        if (slotEnd.getTime() > now.getTime()) {
          const slotStartMs = slotStart.getTime();
          const slotEndMs = slotEnd.getTime();
          const hasConflict = [...bookedRanges, ...unavailableRanges].some(
            (range) => slotStartMs < range.end && slotEndMs > range.start
          );

          if (!hasConflict) {
            const label = slotStart.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
            slots.push({
              startsAt: slotStart.toISOString(),
              endsAt: slotEnd.toISOString(),
              label,
            });
          }
        }

        slotStart = new Date(slotStart.getTime() + 30 * 60000);
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return slots;
}

export async function checkAvailability(params: {
  businessId: string;
  serviceId: string;
  dateFrom: string;
  dateTo: string;
}): Promise<{ startsAt: string; endsAt: string; label: string }[]> {
  return getAvailableSlots(params);
}

export async function createBooking(params: {
  businessId: string;
  clientId?: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  totalPrice: number;
  guestEmail: string;
  guestName: string;
  sourceChannel?: string;
}): Promise<{ id: string }> {
  const supabase = createServiceRoleClient();
  const {
    businessId,
    clientId,
    serviceId,
    startsAt,
    endsAt,
    totalPrice,
    guestEmail,
    guestName,
    sourceChannel = "web",
  } = params;

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      business_id: businessId,
      client_id: clientId ?? null,
      service_id: serviceId,
      starts_at: startsAt,
      ends_at: endsAt,
      status: "pending",
      payment_status: "unpaid",
      total_price: totalPrice,
      guest_email: guestEmail,
      guest_name: guestName,
      source_channel: sourceChannel,
      add_ons: [],
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "That time slot was just taken. Please choose another time."
      );
    }
    throw new Error(error.message);
  }

  return { id: data.id };
}

export async function transitionBookingStatus(
  bookingId: string,
  nextStatus: string
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status: nextStatus })
    .eq("id", bookingId);

  if (error) throw new Error(error.message);
}
