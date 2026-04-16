import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/server/supabase";

/** GET — public business info + active services */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const supabase = createServiceRoleClient();

    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("id, name, slug, owner_name, timezone, booking_mode")
      .eq("slug", slug)
      .maybeSingle();

    if (bizErr || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const { data: services, error: svcErr } = await supabase
      .from("services")
      .select("id, name, duration_mins, price, add_ons")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("name");

    if (svcErr) {
      return NextResponse.json({ error: "Failed to load services" }, { status: 500 });
    }

    return NextResponse.json({ business, services: services ?? [] });
  } catch (err) {
    console.error("[/api/book/[slug] GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
