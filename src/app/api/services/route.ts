import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

/** GET — list services */
export async function GET(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("services")
        .select("id, name, duration_mins, price, add_ons, is_active, created_at")
        .eq("business_id", businessId)
        .order("name");

      if (error) throw new Error(error.message);
      return NextResponse.json({ services: data ?? [] });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

/** POST — create service */
export async function POST(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const body = await request.json();
      const { name, duration_mins, price, add_ons } = body as {
        name?: string;
        duration_mins?: number;
        price?: number;
        add_ons?: unknown[];
      };

      if (!name || !duration_mins || price === undefined) {
        return NextResponse.json(
          { error: "name, duration_mins, and price are required" },
          { status: 400 }
        );
      }

      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("services")
        .insert({
          business_id: businessId,
          name,
          duration_mins,
          price,
          add_ons: add_ons ?? [],
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return NextResponse.json({ service: data }, { status: 201 });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
