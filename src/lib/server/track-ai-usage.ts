import { createServiceRoleClient } from "./supabase";

// GPT-4o pricing (per 1M tokens, USD)
const PRICING: Record<string, { prompt: number; completion: number }> = {
  "gpt-4o":           { prompt: 2.50,  completion: 10.00 },
  "gpt-4o-mini":      { prompt: 0.15,  completion: 0.60  },
  "gpt-4-turbo":      { prompt: 10.00, completion: 30.00 },
  "gpt-4":            { prompt: 30.00, completion: 60.00 },
};

function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const key = Object.keys(PRICING).find((k) => model.startsWith(k)) ?? "gpt-4o";
  const p = PRICING[key];
  return (promptTokens / 1_000_000) * p.prompt + (completionTokens / 1_000_000) * p.completion;
}

export type AIEndpoint =
  | "instagram_dm"
  | "web_chat"
  | "booking_chat"
  | "dashboard_ai"
  | "post_booking"
  | "ig_scrape";

export async function trackAIUsage({
  businessId,
  model,
  endpoint,
  usage,
}: {
  businessId: string;
  model: string;
  endpoint: AIEndpoint;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null | undefined;
}) {
  if (!usage || !businessId) return;

  const cost = estimateCost(model, usage.prompt_tokens, usage.completion_tokens);
  const supabase = createServiceRoleClient();

  // Fire-and-forget — don't block the main response path
  supabase
    .from("ai_usage_logs")
    .insert({
      business_id:        businessId,
      model,
      endpoint,
      prompt_tokens:      usage.prompt_tokens,
      completion_tokens:  usage.completion_tokens,
      total_tokens:       usage.total_tokens,
      estimated_cost_usd: cost,
    })
    .then(({ error }) => {
      if (error) console.error("[trackAIUsage]", error.message);
    });
}
