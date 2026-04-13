import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

/** GET /api/inbox — IG threads for this business, merged with client info */
export async function GET(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();

      const { data: threads, error } = await supabase
        .from("ig_threads")
        .select("id, ig_user_id, messages, paused, updated_at, created_at")
        .eq("business_id", businessId)
        .order("updated_at", { ascending: false })
        .limit(60);

      // Table might not exist yet (migration not run)
      if (error) {
        if (error.code === "42P01") {
          return NextResponse.json({ threads: [] });
        }
        throw new Error(error.message);
      }

      if (!threads?.length) {
        return NextResponse.json({ threads: [] });
      }

      // Pull clients that have instagram_id set
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name, email, phone, avg_spend, last_booked_at, instagram_id")
        .eq("business_id", businessId)
        .not("instagram_id", "is", null);

      const clientMap = new Map(
        (clients ?? []).map((c) => [c.instagram_id as string, c])
      );

      const result = threads.map((t) => ({
        ...t,
        client: clientMap.get(t.ig_user_id as string) ?? null,
      }));

      return NextResponse.json({ threads: result });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
