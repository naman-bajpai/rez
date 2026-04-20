import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

/** GET /api/crm/segments — segment counts + revenue breakdown */
export async function GET(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();

      const { data, error } = await supabase
        .from("clients")
        .select(
          "id, tags, total_visits, lifetime_spend, no_show_count, " +
          "last_booked_at, created_at, churn_risk_score, typical_frequency_days"
        )
        .eq("business_id", businessId);

      if (error) throw new Error(error.message);

      const clients = data ?? [];
      const now = Date.now();

      function daysSince(iso: string) {
        return (now - new Date(iso).getTime()) / 86_400_000;
      }

      function computeChurnRisk(c: typeof clients[0]): number {
        if (!c.last_booked_at) return 0.5;
        const days = daysSince(c.last_booked_at);
        const freq = c.typical_frequency_days ?? 45;
        let risk = Math.min(1, Math.max(0, days / (freq * 2) - 0.5));
        risk = Math.min(1, risk + Math.min(0.3, (c.no_show_count ?? 0) * 0.1));
        if ((c.total_visits ?? 0) < 2) risk *= 0.6;
        return Math.round(risk * 100) / 100;
      }

      function segment(c: typeof clients[0]): string {
        if (c.tags?.includes("vip")) return "vip";
        if ((c.total_visits ?? 0) >= 8 || (c.lifetime_spend ?? 0) >= 500) return "vip";
        if (!c.last_booked_at || daysSince(c.last_booked_at) > 60) return "lapsed";
        if (daysSince(c.created_at) <= 30 && (c.total_visits ?? 0) <= 1) return "new";
        if ((c.churn_risk_score ?? computeChurnRisk(c)) >= 0.7) return "at_risk";
        return "active";
      }

      const counts = { all: clients.length, vip: 0, new: 0, at_risk: 0, lapsed: 0, active: 0 };
      const revenue = { vip: 0, new: 0, at_risk: 0, lapsed: 0, active: 0 };

      for (const c of clients) {
        const seg = segment(c) as keyof typeof counts;
        counts[seg]++;
        if (seg !== "all") revenue[seg as keyof typeof revenue] += c.lifetime_spend ?? 0;
      }

      const retentionRate =
        clients.length > 0
          ? Math.round(((counts.active + counts.vip) / clients.length) * 100)
          : 0;

      return NextResponse.json({ counts, revenue, retentionRate });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
