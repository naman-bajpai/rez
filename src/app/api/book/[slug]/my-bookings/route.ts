import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { verifyGuestSession } from "@/lib/server/guest-auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
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

    const guest = await verifyGuestSession(token, business.id as string);

    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, service_id, starts_at, ends_at, status, payment_status, total_price, guest_name, guest_email, services(id, name, duration_mins, price)"
      )
      .eq("business_id", business.id)
      .eq("guest_email", guest.email)
      .order("starts_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    return NextResponse.json({ bookings: data ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    if (msg === "Unauthorized" || msg === "Session expired") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error("[/api/book/[slug]/my-bookings GET]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
