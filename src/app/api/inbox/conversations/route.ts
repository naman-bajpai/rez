import { NextResponse } from "next/server";
import { withBusiness, authRoute } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

/** GET — all booking conversations for the owner's business */
export async function GET(request: Request) {
  return authRoute(async () => {
    return withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();

      // Check table exists
      const { data: convs, error } = await supabase
        .from("booking_conversations")
        .select(`
          id,
          booking_id,
          messages,
          created_at,
          updated_at,
          bookings (
            id,
            guest_name,
            guest_email,
            starts_at,
            status,
            services ( name )
          )
        `)
        .eq("business_id", businessId)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (error) {
        // Table might not exist yet
        if (error.code === "42P01") {
          return NextResponse.json({ conversations: [] });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ conversations: convs ?? [] });
    });
  });
}

