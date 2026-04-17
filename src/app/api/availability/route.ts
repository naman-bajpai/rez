import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

type TimeBlock = {
  id?: string;
  start_time: string;
  end_time: string;
  note?: string;
};

type AvailabilityRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  unavailable_blocks?: TimeBlock[];
};

type AvailabilityOverride = {
  date: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  unavailable_blocks?: TimeBlock[];
};

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidTimeRange(start: string, end: string) {
  return timePattern.test(start) && timePattern.test(end) && start < end;
}

function badRequest(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

function isValidDateString(date: string) {
  if (!datePattern.test(date)) return false;

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function normalizeTimeBlocks(
  value: unknown,
  parentStart: string,
  parentEnd: string,
  label: string
): TimeBlock[] {
  if (value == null) return [];

  if (!Array.isArray(value)) {
    badRequest(`${label}: unavailable_blocks must be an array`);
  }

  const blocks = value.map((block, index) => {
    if (!block || typeof block !== "object") {
      badRequest(`${label}: unavailable block ${index + 1} is invalid`);
    }

    const candidate = block as Partial<TimeBlock>;
    const start = String(candidate.start_time ?? "");
    const end = String(candidate.end_time ?? "");

    if (!isValidTimeRange(start, end)) {
      badRequest(`${label}: unavailable block ${index + 1} must start before it ends`);
    }

    if (start < parentStart || end > parentEnd) {
      badRequest(`${label}: unavailable blocks must stay inside open hours`);
    }

    return {
      id: typeof candidate.id === "string" ? candidate.id.slice(0, 80) : undefined,
      start_time: start,
      end_time: end,
      note: typeof candidate.note === "string" ? candidate.note.slice(0, 120) : undefined,
    };
  });

  const sorted = [...blocks].sort((a, b) => a.start_time.localeCompare(b.start_time));
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start_time < sorted[i - 1].end_time) {
      badRequest(`${label}: unavailable blocks cannot overlap`);
    }
  }

  return sorted;
}

function normalizeAvailabilityRow(businessId: string, day: AvailabilityRow) {
  const dayOfWeek = Number(day.day_of_week);

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    badRequest("day_of_week must be between 0 and 6");
  }

  if (!isValidTimeRange(day.start_time, day.end_time)) {
    badRequest("Start time must be before end time for every day");
  }

  return {
    business_id: businessId,
    day_of_week: dayOfWeek,
    start_time: day.start_time,
    end_time: day.end_time,
    is_active: Boolean(day.is_active),
    unavailable_blocks: normalizeTimeBlocks(
      day.unavailable_blocks,
      day.start_time,
      day.end_time,
      `Day ${dayOfWeek}`
    ),
  };
}

function normalizeOverrideRow(businessId: string, override: AvailabilityOverride) {
  if (!isValidDateString(override.date)) {
    badRequest("Override date must be a valid YYYY-MM-DD date");
  }

  if (!isValidTimeRange(override.start_time, override.end_time)) {
    badRequest(`${override.date}: start time must be before end time`);
  }

  return {
    business_id: businessId,
    date: override.date,
    start_time: override.start_time,
    end_time: override.end_time,
    is_active: Boolean(override.is_active),
    unavailable_blocks: normalizeTimeBlocks(
      override.unavailable_blocks,
      override.start_time,
      override.end_time,
      override.date
    ),
  };
}

/** GET — dashboard weekly availability */
export async function GET(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();
      const today = new Date().toISOString().slice(0, 10);
      const [availabilityResult, overrideResult] = await Promise.all([
        supabase
          .from("availability")
          .select("day_of_week, start_time, end_time, is_active, unavailable_blocks")
          .eq("business_id", businessId)
          .order("day_of_week", { ascending: true }),
        supabase
          .from("availability_overrides")
          .select("date, start_time, end_time, is_active, unavailable_blocks")
          .eq("business_id", businessId)
          .gte("date", today)
          .order("date", { ascending: true }),
      ]);

      if (availabilityResult.error) throw new Error(availabilityResult.error.message);
      if (overrideResult.error) throw new Error(overrideResult.error.message);

      return NextResponse.json({
        availability: availabilityResult.data ?? [],
        overrides: overrideResult.data ?? [],
      });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

/** PUT — save dashboard weekly availability */
export async function PUT(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const body = (await request.json()) as {
        availability?: AvailabilityRow[];
        overrides?: AvailabilityOverride[];
        deleted_override_dates?: string[];
      };
      const availability = body.availability;
      const overrides = body.overrides ?? [];
      const deletedOverrideDates = body.deleted_override_dates ?? [];

      if (!Array.isArray(availability)) {
        return NextResponse.json(
          { error: "availability must be an array" },
          { status: 400 }
        );
      }

      if (!Array.isArray(overrides)) {
        return NextResponse.json(
          { error: "overrides must be an array" },
          { status: 400 }
        );
      }

      if (!Array.isArray(deletedOverrideDates)) {
        return NextResponse.json(
          { error: "deleted_override_dates must be an array" },
          { status: 400 }
        );
      }

      const rows = availability.map((day) => normalizeAvailabilityRow(businessId, day));

      const seenDays = new Set<number>();
      for (const row of rows) {
        if (seenDays.has(row.day_of_week)) {
          return NextResponse.json(
            { error: "Each weekday can only be saved once" },
            { status: 400 }
          );
        }
        seenDays.add(row.day_of_week);
      }

      const overrideRows = overrides.map((override) =>
        normalizeOverrideRow(businessId, override)
      );
      const seenOverrideDates = new Set<string>();
      for (const row of overrideRows) {
        if (seenOverrideDates.has(row.date)) {
          badRequest("Each date override can only be saved once");
        }
        seenOverrideDates.add(row.date);
      }

      const deleteDates = [...new Set(deletedOverrideDates.map(String))];
      for (const date of deleteDates) {
        if (!isValidDateString(date)) {
          badRequest("deleted_override_dates must contain valid YYYY-MM-DD dates");
        }
      }

      const supabase = createServiceRoleClient();

      if (rows.length > 0) {
        const { error } = await supabase
          .from("availability")
          .upsert(rows, { onConflict: "business_id,day_of_week" });
        if (error) throw new Error(error.message);
      }

      if (deleteDates.length > 0) {
        const { error } = await supabase
          .from("availability_overrides")
          .delete()
          .eq("business_id", businessId)
          .in("date", deleteDates);
        if (error) throw new Error(error.message);
      }

      if (overrideRows.length > 0) {
        const { error } = await supabase
          .from("availability_overrides")
          .upsert(overrideRows, { onConflict: "business_id,date" });
        if (error) throw new Error(error.message);
      }

      const today = new Date().toISOString().slice(0, 10);
      const [availabilityResult, overrideResult] = await Promise.all([
        supabase
          .from("availability")
          .select("day_of_week, start_time, end_time, is_active, unavailable_blocks")
          .eq("business_id", businessId)
          .order("day_of_week", { ascending: true }),
        supabase
          .from("availability_overrides")
          .select("date, start_time, end_time, is_active, unavailable_blocks")
          .eq("business_id", businessId)
          .gte("date", today)
          .order("date", { ascending: true }),
      ]);

      if (availabilityResult.error) throw new Error(availabilityResult.error.message);
      if (overrideResult.error) throw new Error(overrideResult.error.message);

      return NextResponse.json({
        availability: availabilityResult.data ?? [],
        overrides: overrideResult.data ?? [],
      });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
