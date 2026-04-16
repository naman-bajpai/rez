/**
 * GET /api/instagram/status
 * Returns the current IG connection state for the authenticated business.
 */

import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

export async function GET(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();
      const { data } = await supabase
        .from("businesses")
        .select("ig_page_id, ig_username")
        .eq("id", businessId)
        .maybeSingle();

      const connected = !!(data?.ig_page_id);
      return NextResponse.json({
        connected,
        ig_page_id: (data?.ig_page_id as string | null) ?? null,
        ig_username: (data?.ig_username as string | null) ?? null,
      });
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
