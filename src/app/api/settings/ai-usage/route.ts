import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

/** GET /api/settings/ai-usage */
export async function GET(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();
      const monthStart = startOfMonth();
      const thirtyDaysAgo = daysAgo(30);

      const [logsRes, bizRes, dailyRes] = await Promise.all([
        // All calls this month — we aggregate in JS to avoid needing DB functions
        supabase
          .from("ai_usage_logs")
          .select("endpoint, model, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, created_at")
          .eq("business_id", businessId)
          .gte("created_at", monthStart),

        // Budget setting
        supabase
          .from("businesses")
          .select("ai_monthly_budget_usd")
          .eq("id", businessId)
          .single(),

        // Raw rows for the 30-day sparkline (lightweight select)
        supabase
          .from("ai_usage_logs")
          .select("created_at, estimated_cost_usd, total_tokens")
          .eq("business_id", businessId)
          .gte("created_at", thirtyDaysAgo)
          .order("created_at", { ascending: true }),
      ]);

      if (logsRes.error) throw new Error(logsRes.error.message);

      const logs = logsRes.data ?? [];
      const budget = Number((bizRes.data as { ai_monthly_budget_usd?: number } | null)?.ai_monthly_budget_usd ?? 50);

      // Monthly totals
      const totals = logs.reduce(
        (acc, r) => {
          acc.prompt_tokens    += r.prompt_tokens ?? 0;
          acc.completion_tokens += r.completion_tokens ?? 0;
          acc.total_tokens     += r.total_tokens ?? 0;
          acc.cost_usd         += Number(r.estimated_cost_usd ?? 0);
          acc.call_count++;
          return acc;
        },
        { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost_usd: 0, call_count: 0, budget_usd: budget }
      );

      // Per-endpoint breakdown
      const endpointMap: Record<string, {
        endpoint: string; model: string;
        prompt_tokens: number; completion_tokens: number;
        cost_usd: number; call_count: number;
      }> = {};

      for (const r of logs) {
        const key = `${r.endpoint}::${r.model}`;
        if (!endpointMap[key]) {
          endpointMap[key] = { endpoint: r.endpoint, model: r.model, prompt_tokens: 0, completion_tokens: 0, cost_usd: 0, call_count: 0 };
        }
        endpointMap[key].prompt_tokens    += r.prompt_tokens ?? 0;
        endpointMap[key].completion_tokens += r.completion_tokens ?? 0;
        endpointMap[key].cost_usd         += Number(r.estimated_cost_usd ?? 0);
        endpointMap[key].call_count++;
      }
      const endpoints = Object.values(endpointMap).sort((a, b) => b.cost_usd - a.cost_usd);

      // Daily sparkline
      const dailyMap: Record<string, { day: string; cost_usd: number; tokens: number }> = {};
      for (const r of dailyRes.data ?? []) {
        const day = r.created_at.slice(0, 10);
        if (!dailyMap[day]) dailyMap[day] = { day, cost_usd: 0, tokens: 0 };
        dailyMap[day].cost_usd += Number(r.estimated_cost_usd ?? 0);
        dailyMap[day].tokens   += r.total_tokens ?? 0;
      }
      const daily = Object.values(dailyMap).sort((a, b) => a.day.localeCompare(b.day));

      return NextResponse.json({ totals, endpoints, daily });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

/** PATCH /api/settings/ai-usage — update monthly budget */
export async function PATCH(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const body = await request.json() as { budget_usd?: number };
      const budget = Number(body.budget_usd);

      if (!Number.isFinite(budget) || budget < 0) {
        return NextResponse.json({ error: "Invalid budget" }, { status: 400 });
      }

      const supabase = createServiceRoleClient();
      const { error } = await supabase
        .from("businesses")
        .update({ ai_monthly_budget_usd: budget })
        .eq("id", businessId);

      if (error) throw new Error(error.message);
      return NextResponse.json({ budget_usd: budget });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}
