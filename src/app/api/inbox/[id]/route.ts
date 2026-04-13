import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { sendInstagramDm } from "@/lib/server/notification-service";

type StoredMessage = { role: "user" | "assistant"; content: string };

/** PATCH /api/inbox/[id]
 *  { paused: boolean }           → toggle paused flag
 *  { message: string }           → send manual DM + append to thread
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const { id } = await context.params;
      const body = await request.json() as { paused?: boolean; message?: string };
      const supabase = createServiceRoleClient();

      // Verify thread belongs to this business
      const { data: thread, error: fetchErr } = await supabase
        .from("ig_threads")
        .select("id, ig_user_id, messages, paused")
        .eq("id", id)
        .eq("business_id", businessId)
        .maybeSingle();

      if (fetchErr) throw new Error(fetchErr.message);
      if (!thread) {
        return NextResponse.json({ error: "Thread not found" }, { status: 404 });
      }

      // ── Toggle paused ──────────────────────────────────────────
      if (typeof body.paused === "boolean") {
        const { error } = await supabase
          .from("ig_threads")
          .update({ paused: body.paused, updated_at: new Date().toISOString() })
          .eq("id", id);

        if (error) throw new Error(error.message);
        return NextResponse.json({ paused: body.paused });
      }

      // ── Send manual message ────────────────────────────────────
      if (body.message?.trim()) {
        const text = body.message.trim();

        // Send via Meta Graph API
        await sendInstagramDm(thread.ig_user_id as string, text);

        // Append to thread history
        const existing = (thread.messages as StoredMessage[]) ?? [];
        const updated: StoredMessage[] = [
          ...existing,
          { role: "assistant" as const, content: text },
        ].slice(-20);

        const { error } = await supabase
          .from("ig_threads")
          .update({ messages: updated, updated_at: new Date().toISOString() })
          .eq("id", id);

        if (error) throw new Error(error.message);
        return NextResponse.json({ sent: true });
      }

      return NextResponse.json({ error: "No valid action in body" }, { status: 400 });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
