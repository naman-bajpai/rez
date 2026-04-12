import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["cancelled", "no_show"],
  cancelled: [],
  expired: [],
  no_show: [],
};

/** PATCH — status transitions */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    return await withBusiness(request, async ({ businessId }) => {
      const body = await request.json();
      const { status } = body as { status?: string };

      if (!status) {
        return NextResponse.json({ error: "status is required" }, { status: 400 });
      }

      const supabase = createServiceRoleClient();

      // Verify booking belongs to this business
      const { data: booking } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("id", id)
        .eq("business_id", businessId)
        .maybeSingle();

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      const allowed = VALID_TRANSITIONS[booking.status as string] ?? [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${booking.status} to ${status}` },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return NextResponse.json({ booking: data });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
