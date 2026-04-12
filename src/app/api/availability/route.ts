import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

type AvailabilityRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidTimeRange(start: string, end: string) {
  return timePattern.test(start) && timePattern.test(end) && start < end;
}

/** GET — dashboard weekly availability */
export async function GET(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("availability")
        .select("day_of_week, start_time, end_time, is_active")
        .eq("business_id", businessId)
        .order("day_of_week", { ascending: true });

      if (error) throw new Error(error.message);
      return NextResponse.json({ availability: data ?? [] });
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
      const body = (await request.json()) as { availability?: AvailabilityRow[] };
      const availability = body.availability;

      if (!Array.isArray(availability)) {
        return NextResponse.json(
          { error: "availability must be an array" },
          { status: 400 }
        );
      }

      const rows = availability.map((day) => ({
        business_id: businessId,
        day_of_week: Number(day.day_of_week),
        start_time: day.start_time,
        end_time: day.end_time,
        is_active: Boolean(day.is_active),
      }));

      const seenDays = new Set<number>();
      for (const row of rows) {
        if (!Number.isInteger(row.day_of_week) || row.day_of_week < 0 || row.day_of_week > 6) {
          return NextResponse.json(
            { error: "day_of_week must be between 0 and 6" },
            { status: 400 }
          );
        }

        if (seenDays.has(row.day_of_week)) {
          return NextResponse.json(
            { error: "Each weekday can only be saved once" },
            { status: 400 }
          );
        }
        seenDays.add(row.day_of_week);

        if (!isValidTimeRange(row.start_time, row.end_time)) {
          return NextResponse.json(
            { error: "Start time must be before end time for every day" },
            { status: 400 }
          );
        }
      }

      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("availability")
        .upsert(rows, { onConflict: "business_id,day_of_week" })
        .select("day_of_week, start_time, end_time, is_active")
        .order("day_of_week", { ascending: true });

      if (error) throw new Error(error.message);
      return NextResponse.json({ availability: data ?? [] });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
