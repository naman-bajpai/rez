import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { verifyOtpAndCreateSession } from "@/lib/server/guest-auth";

/** POST — verify OTP, return guest session token */
export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const { email, name, code } = body as {
      email?: string;
      name?: string;
      code?: string;
    };

    if (!email || !code) {
      return NextResponse.json(
        { error: "email and code are required" },
        { status: 400 }
      );
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
    const token = await verifyOtpAndCreateSession(
      email.toLowerCase().trim(),
      business.id as string,
      code.trim(),
      (name?.trim() || fallbackName).trim()
    );

    return NextResponse.json({
      token,
      email: email.toLowerCase().trim(),
      name: (name?.trim() || fallbackName).trim(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
