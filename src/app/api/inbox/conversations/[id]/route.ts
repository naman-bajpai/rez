import { NextResponse } from "next/server";
import { withBusiness, authRoute } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

/** PATCH — owner sends a reply to a booking conversation */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return authRoute(async () => {
    return withBusiness(request, async ({ businessId }) => {
      const { id } = await context.params;
      const body = await request.json() as { message?: string };

      if (!body.message?.trim()) {
        return NextResponse.json({ error: "message required" }, { status: 400 });
      }

      const supabase = createServiceRoleClient();
      const { data: conv } = await supabase
        .from("booking_conversations")
        .select("id, messages")
        .eq("id", id)
        .eq("business_id", businessId)
        .maybeSingle();

      if (!conv) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const existing = (conv.messages as { role: string; content: string; created_at: string }[]) ?? [];
      const newMsg = {
        role: "provider",
        content: body.message.trim(),
        created_at: new Date().toISOString(),
      };

      await supabase
        .from("booking_conversations")
        .update({ messages: [...existing, newMsg] })
        .eq("id", id);

      return NextResponse.json({ message: newMsg });
    });
  });
}
