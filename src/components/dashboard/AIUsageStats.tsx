"use client";

import { useEffect, useState } from "react";
import { Bot, Zap, DollarSign, Loader2, Check, AlertTriangle } from "lucide-react";

type Totals = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  call_count: number;
  budget_usd: number;
};

type Endpoint = {
  endpoint: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  call_count: number;
};

type DayPoint = { day: string; cost_usd: number; tokens: number };

const ENDPOINT_LABELS: Record<string, string> = {
  instagram_dm: "Instagram DM",
  web_chat:     "Web Chat",
  booking_chat: "Booking Chat",
  dashboard_ai: "Dashboard AI",
  post_booking: "Post-Booking",
  ig_scrape:    "IG Scrape",
};

function fmtCost(n: number) {
  return n < 0.01 ? `<$0.01` : `$${n.toFixed(2)}`;
}

function fmtTokens(n: number) {
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(1)}k`
    : String(n);
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: DayPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-14 text-xs" style={{ color: "var(--dash-muted)" }}>
        No activity yet this month
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.cost_usd), 0.001);
  const width = 300;
  const height = 48;
  const barW = Math.max(2, Math.floor((width - data.length) / data.length));
  const gap = Math.floor((width - barW * data.length) / Math.max(data.length - 1, 1));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 48 }}>
      {data.map((d, i) => {
        const h = Math.max(2, (d.cost_usd / max) * height);
        const x = i * (barW + gap);
        const y = height - h;
        const today = new Date().toISOString().slice(0, 10);
        const isToday = d.day === today;
        return (
          <rect
            key={d.day}
            x={x} y={y} width={barW} height={h}
            rx={1}
            fill={isToday ? "var(--rez-glow)" : "var(--dash-border-strong)"}
            opacity={isToday ? 1 : 0.6}
          />
        );
      })}
    </svg>
  );
}

// ── Budget gauge ──────────────────────────────────────────────────────────────

function BudgetGauge({ cost, budget }: { cost: number; budget: number }) {
  const pct = budget > 0 ? Math.min(1, cost / budget) : 0;
  const color = pct >= 0.9 ? "#ef4444" : pct >= 0.7 ? "#f59e0b" : "var(--rez-glow)";
  const circumference = 2 * Math.PI * 36;
  const dash = pct * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
      <svg width={100} height={100} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={50} cy={50} r={36} fill="none" stroke="var(--dash-border)" strokeWidth={8} />
        <circle
          cx={50} cy={50} r={36} fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-base font-bold tabular-nums leading-none" style={{ color: "var(--dash-text)" }}>
          {Math.round(pct * 100)}%
        </p>
        <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "var(--dash-muted)" }}>used</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AIUsageStats() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [daily, setDaily] = useState<DayPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetInput, setBudgetInput] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);
  const [budgetSaved, setBudgetSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/ai-usage")
      .then((r) => r.json())
      .then((d) => {
        if (d.totals)    setTotals(d.totals);
        if (d.endpoints) setEndpoints(d.endpoints);
        if (d.daily)     setDaily(d.daily);
        setBudgetInput(String(d.totals?.budget_usd ?? 50));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveBudget() {
    const val = parseFloat(budgetInput);
    if (!Number.isFinite(val) || val < 0) return;
    setSavingBudget(true);
    try {
      const res = await fetch("/api/settings/ai-usage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget_usd: val }),
      });
      const d = await res.json();
      if (d.budget_usd !== undefined) {
        setTotals((prev) => prev ? { ...prev, budget_usd: d.budget_usd } : prev);
        setBudgetSaved(true);
        setTimeout(() => setBudgetSaved(false), 2000);
      }
    } finally {
      setSavingBudget(false);
    }
  }

  const pct = totals && totals.budget_usd > 0 ? totals.cost_usd / totals.budget_usd : 0;
  const overBudget = pct >= 1;
  const monthName = new Date().toLocaleString("en-US", { month: "long" });

  return (
    <div
      className="rez-bento-card overflow-hidden"
      style={{ border: overBudget ? "1px solid rgba(239,68,68,0.4)" : undefined }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-6 py-4"
        style={{ borderBottom: "1px solid var(--dash-divider)" }}
      >
        <div className="dash-icon-circle h-8 w-8">
          <Bot className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight" style={{ color: "var(--dash-text)" }}>AI Usage</p>
          <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>{monthName} · estimated cost</p>
        </div>
        {overBudget && (
          <div className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
            <AlertTriangle className="h-3 w-3" /> Over budget
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16" style={{ color: "var(--dash-muted)" }}>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading usage…</span>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--dash-divider)" }}>

          {/* Gauge + stats */}
          <div className="flex items-center gap-6 px-6 py-5">
            <BudgetGauge cost={totals?.cost_usd ?? 0} budget={totals?.budget_usd ?? 50} />

            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: DollarSign, label: "Cost this month", value: fmtCost(totals?.cost_usd ?? 0) },
                  { icon: Zap,        label: "API calls",        value: String(totals?.call_count ?? 0) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-60" style={{ color: "var(--dash-muted)" }}>
                      {label}
                    </p>
                    <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight" style={{ color: "var(--dash-text)" }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Token row */}
              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--dash-muted)" }}>
                <span>
                  <span className="font-bold" style={{ color: "var(--dash-text-secondary)" }}>
                    {fmtTokens(totals?.prompt_tokens ?? 0)}
                  </span>{" "}
                  in
                </span>
                <span>
                  <span className="font-bold" style={{ color: "var(--dash-text-secondary)" }}>
                    {fmtTokens(totals?.completion_tokens ?? 0)}
                  </span>{" "}
                  out
                </span>
                <span>
                  <span className="font-bold" style={{ color: "var(--dash-text-secondary)" }}>
                    {fmtTokens(totals?.total_tokens ?? 0)}
                  </span>{" "}
                  total
                </span>
              </div>
            </div>
          </div>

          {/* Daily sparkline */}
          <div className="px-6 py-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] opacity-60" style={{ color: "var(--dash-muted)" }}>
              Last 30 days
            </p>
            <Sparkline data={daily} />
          </div>

          {/* Per-endpoint breakdown */}
          {endpoints.length > 0 && (
            <div className="px-6 py-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] opacity-60" style={{ color: "var(--dash-muted)" }}>
                Breakdown by feature
              </p>
              <div className="space-y-2">
                {endpoints.map((ep) => {
                  const share = (totals?.cost_usd ?? 0) > 0 ? ep.cost_usd / (totals?.cost_usd ?? 1) : 0;
                  return (
                    <div key={`${ep.endpoint}:${ep.model}`} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold" style={{ color: "var(--dash-text)" }}>
                          {ENDPOINT_LABELS[ep.endpoint] ?? ep.endpoint}
                          <span className="ml-1.5 opacity-50 font-normal">{ep.model}</span>
                        </span>
                        <span className="font-bold tabular-nums" style={{ color: "var(--dash-text-secondary)" }}>
                          {fmtCost(ep.cost_usd)}
                          <span className="ml-1.5 text-[10px] font-normal opacity-60">{ep.call_count} calls</span>
                        </span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--dash-border)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${share * 100}%`, background: "var(--rez-glow)", opacity: 0.7 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Budget editor */}
          <div className="px-6 py-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] opacity-60" style={{ color: "var(--dash-muted)" }}>
              Monthly budget cap
            </p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "var(--dash-muted)" }}>$</span>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveBudget()}
                  className="w-28 rounded-xl pl-7 pr-3 py-2 text-sm font-bold outline-none tabular-nums"
                  style={{
                    background: "var(--dash-surface-elevated)",
                    border: "1px solid var(--dash-border)",
                    color: "var(--dash-text)",
                  }}
                />
              </div>
              <button
                onClick={saveBudget}
                disabled={savingBudget}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all disabled:opacity-40"
                style={{
                  background: budgetSaved ? "rgba(34,197,94,0.15)" : "var(--rez-highlight)",
                  color: budgetSaved ? "#22c55e" : "var(--dash-text)",
                  border: "1px solid var(--dash-border)",
                }}
              >
                {savingBudget ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : budgetSaved ? (
                  <Check className="h-3 w-3" />
                ) : null}
                {budgetSaved ? "Saved" : "Set limit"}
              </button>
              <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                / month · {fmtCost(totals?.cost_usd ?? 0)} used
              </p>
            </div>
            {pct >= 0.8 && !overBudget && (
              <p className="mt-2 text-xs font-medium" style={{ color: "#f59e0b" }}>
                You&apos;re at {Math.round(pct * 100)}% of your budget.
              </p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
