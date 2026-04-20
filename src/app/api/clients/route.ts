import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

/** GET /api/clients?segment=all|vip|lapsed|new|at_risk&search=... */
export async function GET(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const { searchParams } = new URL(request.url);
      const segment = searchParams.get("segment") ?? "all";

      const supabase = createServiceRoleClient();
      const { data, error } = await supabase
        .from("clients")
        .select(
          "id, name, email, phone, avg_spend, last_booked_at, created_at, " +
          "tags, total_visits, lifetime_spend, no_show_count, cancellation_count, " +
          "birthday, churn_risk_score, typical_frequency_days"
        )
        .eq("business_id", businessId)
        .order("last_booked_at", { ascending: false, nullsFirst: false })
        .limit(500);

      if (error) throw new Error(error.message);

      const clients = (data ?? []).map((c) => ({
        ...c,
        segment: deriveSegment(c),
      }));

      const filtered =
        segment === "all"
          ? clients
          : clients.filter((c) => c.segment === segment);

      const counts = {
        all: clients.length,
        vip: clients.filter((c) => c.segment === "vip").length,
        new: clients.filter((c) => c.segment === "new").length,
        at_risk: clients.filter((c) => c.segment === "at_risk").length,
        lapsed: clients.filter((c) => c.segment === "lapsed").length,
        active: clients.filter((c) => c.segment === "active").length,
      };

      return NextResponse.json({ clients: filtered, counts });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

type ClientRow = {
  tags?: string[];
  total_visits?: number;
  lifetime_spend?: number;
  no_show_count?: number;
  churn_risk_score?: number;
  last_booked_at?: string | null;
  created_at?: string;
  typical_frequency_days?: number | null;
};

function deriveSegment(c: ClientRow): string {
  if (c.tags?.includes("vip")) return "vip";
  if ((c.total_visits ?? 0) >= 8 || (c.lifetime_spend ?? 0) >= 500) return "vip";
  if (!c.last_booked_at || daysSince(c.last_booked_at) > 60) return "lapsed";
  if (c.created_at && daysSince(c.created_at) <= 30 && (c.total_visits ?? 0) <= 1) return "new";
  const risk = c.churn_risk_score ?? computeChurnRisk(c);
  if (risk >= 0.7) return "at_risk";
  return "active";
}

function daysSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

function computeChurnRisk(c: ClientRow): number {
  if (!c.last_booked_at) return 0.5;
  const days = daysSince(c.last_booked_at);
  const freq = c.typical_frequency_days ?? 45;
  let risk = Math.min(1, Math.max(0, days / (freq * 2) - 0.5));
  risk = Math.min(1, risk + Math.min(0.3, (c.no_show_count ?? 0) * 0.1));
  if ((c.total_visits ?? 0) < 2) risk *= 0.6;
  return Math.round(risk * 100) / 100;
}
