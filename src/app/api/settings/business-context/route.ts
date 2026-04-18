import { NextResponse } from "next/server";
import { withBusiness, authRoute } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

type BusinessRow = {
  ig_username?: string | null;
  ai_context?: string | null;
  ai_context_synced_at?: string | null;
};

export async function GET(request: Request) {
  return authRoute(() =>
    withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();
      const { data } = await supabase
        .from("businesses")
        .select("ig_username, ai_context, ai_context_synced_at")
        .eq("id", businessId)
        .maybeSingle();

      const row = data as BusinessRow | null;
      return NextResponse.json({
        ig_username: row?.ig_username ?? null,
        ai_context: row?.ai_context ?? null,
        ai_context_synced_at: row?.ai_context_synced_at ?? null,
      });
    })
  );
}

export async function PATCH(request: Request) {
  return authRoute(() =>
    withBusiness(request, async ({ businessId }) => {
      const body = (await request.json()) as {
        ai_context?: string;
        ig_username?: string;
      };

      const update: Record<string, string | null> = {};
      if (body.ai_context !== undefined) update.ai_context = body.ai_context;
      if (body.ig_username !== undefined) update.ig_username = body.ig_username;

      if (!Object.keys(update).length) {
        return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
      }

      const supabase = createServiceRoleClient();
      const { error } = await supabase
        .from("businesses")
        .update(update)
        .eq("id", businessId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ ok: true });
    })
  );
}
