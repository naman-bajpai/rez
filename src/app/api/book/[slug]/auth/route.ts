import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { createAndSendOtp } from "@/lib/server/guest-auth";

/** POST — send OTP email to guest */
export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const { email, name } = body as { email?: string; name?: string };

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
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

    const fallbackName = email.split("@")[0] || "Guest";
    await createAndSendOtp(
      email.toLowerCase().trim(),
      business.id as string,
      (name?.trim() || fallbackName).trim()
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/book/[slug]/auth POST]", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
