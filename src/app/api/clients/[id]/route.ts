import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

/** GET /api/clients/[id] — client detail + booking history */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const { id } = await params;
      const supabase = createServiceRoleClient();

      const [clientRes, bookingsRes] = await Promise.all([
        supabase
          .from("clients")
          .select(
            "id, name, email, phone, instagram_id, avg_spend, last_booked_at, " +
            "created_at, updated_at, tags, total_visits, lifetime_spend, " +
            "no_show_count, cancellation_count, birthday, churn_risk_score, typical_frequency_days"
          )
          .eq("id", id)
          .eq("business_id", businessId)
          .single(),

        supabase
          .from("bookings")
          .select("id, starts_at, ends_at, status, payment_status, services(name, price)")
          .eq("client_id", id)
          .eq("business_id", businessId)
          .order("starts_at", { ascending: false })
          .limit(50),
      ]);

      if (clientRes.error) throw Object.assign(new Error(clientRes.error.message), { status: 404 });

      return NextResponse.json({
        client: clientRes.data,
        bookings: bookingsRes.data ?? [],
      });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

/** PATCH /api/clients/[id] — update tags, birthday, counters */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const { id } = await params;
      const body = await request.json() as {
        tags?: string[];
        birthday?: string | null;
        no_show_count?: number;
        cancellation_count?: number;
      };

      const allowed: Record<string, unknown> = {};
      if (body.tags !== undefined) allowed.tags = body.tags;
      if (body.birthday !== undefined) allowed.birthday = body.birthday;
      if (body.no_show_count !== undefined) allowed.no_show_count = body.no_show_count;
      if (body.cancellation_count !== undefined) allowed.cancellation_count = body.cancellation_count;

      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("clients")
        .update({ ...allowed, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("business_id", businessId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return NextResponse.json({ client: data });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
