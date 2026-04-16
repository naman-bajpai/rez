/**
 * POST /api/instagram/disconnect
 * Removes the IG connection for the authenticated business.
 */

import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

export async function POST(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();
      await supabase
        .from("businesses")
        .update({
          ig_page_id: null,
          ig_page_access_token: null,
          ig_username: null,
        })
        .eq("id", businessId);

      return NextResponse.json({ ok: true });
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
