import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { verifyGuestSession } from "@/lib/server/guest-auth";
import { getAvailableSlots } from "@/lib/server/booking-engine";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("service_id");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const excludeBookingId = searchParams.get("exclude_booking_id") ?? undefined;

    if (!serviceId || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "service_id, date_from, date_to are required" },
        { status: 400 }
      );
    }

    // Verify guest session
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    await verifyGuestSession(token, business.id as string);

    const slots = await getAvailableSlots({
      businessId: business.id as string,
      serviceId,
      dateFrom,
      dateTo,
      excludeBookingId,
    });

    return NextResponse.json({ slots });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    if (msg === "Unauthorized" || msg === "Session expired") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error("[/api/book/[slug]/slots GET]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
