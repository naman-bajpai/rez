import { NextResponse } from "next/server";
import { withBusiness, authRoute } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

export async function GET(request: Request) {
  return authRoute(async () => {
    return withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();
      const { data } = await supabase
        .from("businesses")
        .select("booking_mode")
        .eq("id", businessId)
        .maybeSingle();

      return NextResponse.json({ booking_mode: (data as { booking_mode?: string } | null)?.booking_mode ?? "calendar" });
    });
  });
}

export async function PATCH(request: Request) {
  return authRoute(async () => {
    return withBusiness(request, async ({ businessId }) => {
      const body = await request.json() as { booking_mode?: string };
      const mode = body.booking_mode;

      if (mode !== "calendar" && mode !== "ai_chat") {
        return NextResponse.json({ error: "Invalid booking_mode" }, { status: 400 });
      }

      const supabase = createServiceRoleClient();
      const { error } = await supabase
        .from("businesses")
        .update({ booking_mode: mode })
        .eq("id", businessId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ booking_mode: mode });
    });
  });
}
