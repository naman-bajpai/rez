import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

/** GET /api/crm/broadcast — list sent/draft broadcasts */
export async function GET(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("broadcast_messages")
        .select("id, segment, channel, message, status, sent_at, recipient_count, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw new Error(error.message);
      return NextResponse.json({ broadcasts: data ?? [] });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

/** POST /api/crm/broadcast — create and queue a broadcast */
export async function POST(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const body = await request.json() as {
        segment: string;
        channel: "sms" | "email";
        message: string;
      };

      if (!body.segment || !body.message) {
        return NextResponse.json({ error: "segment and message are required" }, { status: 400 });
      }

      const supabase = createServiceRoleClient();

      // Fetch matching recipients based on segment
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("id, phone, email, tags, total_visits, lifetime_spend, last_booked_at, created_at, churn_risk_score, typical_frequency_days, no_show_count")
        .eq("business_id", businessId);

      if (clientsError) throw new Error(clientsError.message);

      const now = Date.now();
      function daysSince(iso: string) {
        return (now - new Date(iso).getTime()) / 86_400_000;
      }

      function matchesSegment(c: typeof clients[0], seg: string): boolean {
        if (seg === "all") return true;
        const isVip = c.tags?.includes("vip") || (c.total_visits ?? 0) >= 8 || (c.lifetime_spend ?? 0) >= 500;
        const isLapsed = !c.last_booked_at || daysSince(c.last_booked_at) > 60;
        const isNew = daysSince(c.created_at) <= 30 && (c.total_visits ?? 0) <= 1;

        let risk = c.churn_risk_score ?? 0;
        if (!c.churn_risk_score && c.last_booked_at) {
          const days = daysSince(c.last_booked_at);
          const freq = c.typical_frequency_days ?? 45;
          risk = Math.min(1, Math.max(0, days / (freq * 2) - 0.5));
          risk = Math.min(1, risk + Math.min(0.3, (c.no_show_count ?? 0) * 0.1));
        }

        if (seg === "vip") return isVip;
        if (seg === "lapsed") return isLapsed && !isVip;
        if (seg === "new") return isNew;
        if (seg === "at_risk") return risk >= 0.7 && !isVip && !isLapsed && !isNew;
        return false;
      }

      const recipients = (clients ?? []).filter((c) => matchesSegment(c, body.segment));

      // Insert broadcast record
      const { data: broadcast, error: broadcastError } = await supabase
        .from("broadcast_messages")
        .insert({
          business_id: businessId,
          segment: body.segment,
          channel: body.channel ?? "sms",
          message: body.message,
          status: "sent",
          sent_at: new Date().toISOString(),
          recipient_count: recipients.length,
        })
        .select()
        .single();

      if (broadcastError) throw new Error(broadcastError.message);

      // Insert recipient rows for delivery tracking
      if (recipients.length > 0) {
        await supabase.from("broadcast_recipients").insert(
          recipients.map((c) => ({
            broadcast_id: broadcast.id,
            client_id: c.id,
            status: "queued",
          }))
        );
      }

      // TODO: enqueue actual SMS/email delivery via notification-service
      // await notificationService.sendBroadcast(broadcast.id, recipients, body.channel, body.message);

      return NextResponse.json({ broadcast, recipientCount: recipients.length });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
