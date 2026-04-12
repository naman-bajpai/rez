import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

/** GET — list clients */
export async function GET(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email, phone, avg_spend, last_booked_at, created_at")
        .eq("business_id", businessId)
        .order("last_booked_at", { ascending: false, nullsFirst: false })
        .limit(100);

      if (error) throw new Error(error.message);
      return NextResponse.json({ clients: data ?? [] });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
