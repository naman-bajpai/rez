import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

/** GET — revenue + stats */
export async function GET(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();
      const { searchParams } = new URL(request.url);
      const period = searchParams.get("period") ?? "30d";

      const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
      let since: Date;
      if (period === "1d") {
        since = new Date();
        since.setHours(0, 0, 0, 0);
      } else {
        since = new Date();
        since.setDate(since.getDate() - days);
      }
      const sinceStr = since.toISOString();

      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, status, total_price, starts_at, payment_status")
        .eq("business_id", businessId)
        .gte("starts_at", sinceStr);

      const { data: business } = await supabase
        .from("businesses")
        .select("name, slug")
        .eq("id", businessId)
        .maybeSingle();

      const all = bookings ?? [];
      const confirmed = all.filter((b: { status: string }) => b.status === "confirmed");
      const revenue = confirmed
        .filter((b: { payment_status: string }) => b.payment_status === "paid")
        .reduce((sum: number, b: { total_price: number }) => sum + Number(b.total_price), 0);

      const pending = all.filter((b: { status: string }) => b.status === "pending").length;
      const cancelled = all.filter((b: { status: string }) => b.status === "cancelled").length;

      // upcoming bookings (next 7 days)
      const now = new Date().toISOString();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const { data: upcoming } = await supabase
        .from("bookings")
        .select("id, starts_at, guest_name, services(name)")
        .eq("business_id", businessId)
        .in("status", ["confirmed", "pending"])
        .gte("starts_at", now)
        .lte("starts_at", nextWeek.toISOString())
        .order("starts_at")
        .limit(5);

      return NextResponse.json({
        period,
        total_bookings: all.length,
        confirmed_bookings: confirmed.length,
        pending_bookings: pending,
        cancelled_bookings: cancelled,
        revenue,
        business: business ?? null,
        upcoming: upcoming ?? [],
      });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
