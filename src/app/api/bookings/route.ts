import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

/** GET — list bookings (dashboard) */
export async function GET(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status");
      const date = searchParams.get("date");

      let query = supabase
        .from("bookings")
        .select(
          "id, starts_at, ends_at, status, payment_status, total_price, guest_name, guest_email, source_channel, created_at, services(name, duration_mins)"
        )
        .eq("business_id", businessId)
        .order("starts_at", { ascending: false })
        .limit(100);

      if (status) query = query.eq("status", status);
      if (date) {
        query = query
          .gte("starts_at", `${date}T00:00:00.000Z`)
          .lte("starts_at", `${date}T23:59:59.000Z`);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return NextResponse.json({ bookings: data ?? [] });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
