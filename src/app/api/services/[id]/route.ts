import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

/** PATCH — update service */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    return await withBusiness(request, async ({ businessId }) => {
      const body = await request.json();
      const { name, duration_mins, price, is_active, add_ons } = body as {
        name?: string;
        duration_mins?: number;
        price?: number;
        is_active?: boolean;
        add_ons?: unknown[];
      };

      const supabase = createServiceRoleClient();
      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (duration_mins !== undefined) updates.duration_mins = duration_mins;
      if (price !== undefined) updates.price = price;
      if (is_active !== undefined) updates.is_active = is_active;
      if (add_ons !== undefined) updates.add_ons = add_ons;

      const { data, error } = await supabase
        .from("services")
        .update(updates)
        .eq("id", id)
        .eq("business_id", businessId)
        .select()
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return NextResponse.json({ error: "Service not found" }, { status: 404 });

      return NextResponse.json({ service: data });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

/** DELETE — remove service */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    return await withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id)
        .eq("business_id", businessId);

      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
