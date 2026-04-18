"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

type ContextData = {
  ig_username: string | null;
  ai_context: string | null;
  ai_context_synced_at: string | null;
};

function formatSyncedAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000 / 60);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString();
}

export function BusinessContextEditor() {
  const [data, setData] = useState<ContextData | null>(null);
  const [draft, setDraft] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/business-context")
      .then((r) => r.json())
      .then((d: ContextData) => {
        setData(d);
        setDraft(d.ai_context ?? "");
      })
      .catch(() => setLoadError("Could not load business context."));
  }, []);

  const syncFromIG = async () => {
    setScraping(true);
    setScrapeError(null);
    setSaved(false);

    const res = await fetch("/api/settings/ig-scrape", { method: "POST" });
    const json = (await res.json()) as {
      ai_context?: string;
      ig_username?: string;
      error?: string;
    };

    if (!res.ok || json.error) {
      setScrapeError(json.error ?? "Sync failed. Try again.");
    } else {
      const now = new Date().toISOString();
      setData((prev) => ({
        ig_username: json.ig_username ?? prev?.ig_username ?? null,
        ai_context: json.ai_context ?? null,
        ai_context_synced_at: now,
      }));
      setDraft(json.ai_context ?? "");
    }

    setScraping(false);
  };

  const saveContext = async () => {
    setSaving(true);
    setSaved(false);

    const res = await fetch("/api/settings/business-context", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ai_context: draft }),
    });

    if (res.ok) {
      setData((prev) =>
        prev ? { ...prev, ai_context: draft } : prev
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }

    setSaving(false);
  };

  if (loadError) {
    return (
      <div
        className="flex items-center gap-2 rounded-2xl p-4 text-sm"
        style={{ color: "var(--dash-muted)", background: "var(--dash-surface-muted)" }}
      >
        <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "#EF4444" }} />
        {loadError}
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="flex items-center gap-2 rounded-2xl p-4 text-sm"
        style={{ color: "var(--dash-muted)", background: "var(--dash-surface-muted)" }}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}
    >
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4" style={{ color: "var(--dash-accent)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
            AI agent training
          </p>
        </div>
        {saved && (
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ color: "oklch(0.45 0.13 160)", background: "oklch(0.95 0.05 160 / 0.5)" }}
          >
            <CheckCircle2 className="h-3 w-3" /> Saved
          </span>
        )}
      </div>
      <p className="mb-5 text-xs" style={{ color: "var(--dash-muted)" }}>
        Teach Rez about your business so it never gives clients wrong information. The AI only
        speaks to what&rsquo;s written here — nothing more.
      </p>

      {/* Anti-hallucination badge */}
      <div
        className="mb-5 flex items-start gap-2.5 rounded-xl p-3"
        style={{
          background: "var(--dash-accent-soft)",
          border: "1px solid var(--rez-glow-dim, rgba(124,58,237,0.15))",
        }}
      >
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--dash-accent)" }} />
        <p className="text-xs leading-relaxed" style={{ color: "var(--dash-text-secondary)" }}>
          <span className="font-semibold" style={{ color: "var(--dash-text)" }}>
            Hallucination guard active.
          </span>{" "}
          The AI is instructed to only answer from the knowledge below and say &ldquo;I&rsquo;ll have [your name] follow
          up&rdquo; for anything not covered here.
        </p>
      </div>

      {/* Sync from Instagram */}
      <div
        className="mb-4 flex items-center justify-between rounded-xl p-3.5"
        style={{
          background: "var(--dash-surface-muted)",
          border: "1px solid var(--dash-border)",
        }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
            {data.ig_username ? `@${data.ig_username}` : "Instagram not synced"}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--dash-muted)" }}>
            {data.ai_context_synced_at ? (
              <>
                Last synced {formatSyncedAgo(data.ai_context_synced_at)} · Rez reads your bio and
                recent captions
              </>
            ) : (
              "Connect your Instagram page then sync to auto-extract your business knowledge"
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={syncFromIG}
          disabled={scraping}
          className="ml-4 flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
          style={{
            background: "var(--dash-accent)",
            color: "var(--dash-accent-fg)",
          }}
        >
          {scraping ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {scraping ? "Syncing…" : "Sync from Instagram"}
        </button>
      </div>

      {scrapeError && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
          style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {scrapeError}
        </div>
      )}

      {/* Editable context */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--dash-muted)" }}>
          Business knowledge
        </p>
        <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
          Review or edit the extracted knowledge. Use{" "}
          <code
            className="rounded px-1 py-px"
            style={{ background: "var(--dash-surface-muted)", color: "var(--dash-text)" }}
          >
            ## SECTION NAME
          </code>{" "}
          headers to organise. Anything written here is what Rez will use — and only this.
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={14}
          placeholder={`## SERVICES & PRICING\n- Almond gel set: $85, 45 min\n- Nail removal: $25, 15 min\n\n## BOOKING POLICIES\n$25 deposit required. 24h cancellation notice or deposit is forfeited.\n\n## BUSINESS HOURS\nTue–Sat, 10am–6pm\n\n## SPECIALTIES & STYLE\nSpecialise in nail art, soft gel, and chrome finishes. Known for attention to detail.`}
          className="w-full resize-y rounded-xl px-3.5 py-3 font-mono text-xs leading-relaxed outline-none transition-all"
          style={{
            background: "var(--dash-surface-muted)",
            border: "1px solid var(--dash-border)",
            color: "var(--dash-text)",
            minHeight: "220px",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.boxShadow = "0 0 0 3px var(--dash-accent-ring)")
          }
          onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
          Changes take effect on the next DM or booking conversation.
        </p>
        <button
          type="button"
          onClick={saveContext}
          disabled={saving || draft === (data?.ai_context ?? "")}
          className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40"
          style={{ background: "var(--dash-accent)", color: "var(--dash-accent-fg)" }}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {saving ? "Saving…" : "Save knowledge"}
        </button>
      </div>
    </div>
  );
}
