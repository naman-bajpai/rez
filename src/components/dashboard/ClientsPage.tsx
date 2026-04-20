"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Loader2, Users, Search, Mail, Phone, DollarSign,
  Star, AlertTriangle, Clock, Sparkles, Send, X, ChevronRight,
} from "lucide-react";
import { ClientDetailPanel } from "./ClientDetailPanel";

type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avg_spend?: number;
  last_booked_at?: string;
  created_at?: string;
  tags?: string[];
  total_visits?: number;
  lifetime_spend?: number;
  no_show_count?: number;
  churn_risk_score?: number;
  birthday?: string;
  segment?: string;
};

type Counts = {
  all: number;
  vip: number;
  new: number;
  at_risk: number;
  lapsed: number;
  active: number;
};

type Segment = "all" | "vip" | "new" | "at_risk" | "lapsed";

const SEGMENT_CONFIG: Record<Segment, { label: string; icon: React.ElementType; color: string }> = {
  all:      { label: "All",      icon: Users,         color: "var(--dash-muted)" },
  vip:      { label: "VIP",      icon: Star,          color: "#f59e0b" },
  new:      { label: "New",      icon: Sparkles,       color: "var(--rez-online)" },
  at_risk:  { label: "At Risk",  icon: AlertTriangle,  color: "#f97316" },
  lapsed:   { label: "Lapsed",   icon: Clock,          color: "#94a3b8" },
};

function SegmentBadge({ segment }: { segment: string }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    vip:     { label: "VIP",      bg: "rgba(245,158,11,0.15)", fg: "#f59e0b" },
    new:     { label: "New",      bg: "rgba(34,197,94,0.15)",  fg: "#22c55e" },
    at_risk: { label: "At Risk",  bg: "rgba(249,115,22,0.15)", fg: "#f97316" },
    lapsed:  { label: "Lapsed",   bg: "rgba(148,163,184,0.12)", fg: "#94a3b8" },
    active:  { label: "Active",   bg: "rgba(100,116,139,0.1)", fg: "var(--dash-muted)" },
  };
  const cfg = map[segment] ?? map.active;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-px text-[9px] font-bold uppercase tracking-widest"
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      {cfg.label}
    </span>
  );
}

function TagPill({ tag }: { tag: string }) {
  const isVip = tag === "vip";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-px text-[9px] font-bold uppercase tracking-widest"
      style={{
        background: isVip ? "rgba(245,158,11,0.15)" : "var(--rez-highlight)",
        color: isVip ? "#f59e0b" : "var(--dash-muted)",
        border: `1px solid ${isVip ? "rgba(245,158,11,0.3)" : "var(--dash-border)"}`,
      }}
    >
      {tag}
    </span>
  );
}

// ── Broadcast compose panel ───────────────────────────────────────────────────

function BroadcastPanel({
  segment,
  counts,
  onClose,
}: {
  segment: Segment;
  counts: Counts;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const recipientCount = segment === "all" ? counts.all : counts[segment] ?? 0;

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    try {
      await fetch("/api/crm/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segment, channel, message }),
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="rez-bento-card p-6 space-y-4"
      style={{ border: "1px solid var(--rez-glow-dim)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--dash-text)" }}>
            Broadcast Message
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--dash-muted)" }}>
            {recipientCount} recipient{recipientCount !== 1 ? "s" : ""} in{" "}
            <SegmentBadge segment={segment} />
          </p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--rez-highlight)] transition-colors">
          <X className="h-4 w-4" style={{ color: "var(--dash-muted)" }} />
        </button>
      </div>

      {sent ? (
        <div className="flex items-center gap-2 rounded-xl p-4" style={{ background: "rgba(34,197,94,0.1)" }}>
          <span className="text-sm font-semibold" style={{ color: "#22c55e" }}>
            Broadcast queued for {recipientCount} client{recipientCount !== 1 ? "s" : ""}
          </span>
        </div>
      ) : (
        <>
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--dash-border)" }}>
            {(["sms", "email"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className="flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
                style={{
                  background: channel === c ? "var(--rez-highlight)" : "transparent",
                  color: channel === c ? "var(--dash-text)" : "var(--dash-muted)",
                }}
              >
                {c === "sms" ? "SMS" : "Email"}
              </button>
            ))}
          </div>

          <textarea
            className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none"
            style={{
              background: "var(--dash-surface-elevated)",
              border: "1px solid var(--dash-border)",
              color: "var(--dash-text)",
              minHeight: 100,
            }}
            placeholder={`Write your ${channel} message… (e.g. "Hey {name}, it's been a while! Book your next appointment →")`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-opacity disabled:opacity-40"
            style={{ background: "var(--rez-glow)", color: "var(--dash-accent-fg)" }}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Sending…" : `Send to ${recipientCount} client${recipientCount !== 1 ? "s" : ""}`}
          </button>
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [counts, setCounts] = useState<Counts>({ all: 0, vip: 0, new: 0, at_risk: 0, lapsed: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeSegment, setActiveSegment] = useState<Segment>("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);

  const fetchClients = useCallback((segment: Segment) => {
    setLoading(true);
    const controller = new AbortController();
    fetch(`/api/clients?segment=${segment}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setClients(d.clients ?? []);
          if (d.counts) setCounts(d.counts);
        }
      })
      .catch((err) => { if (err.name !== "AbortError") setError("Failed to load clients"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    return fetchClients(activeSegment);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSegment]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    );
  }, [search, clients]);

  function handleClientUpdate(updated: Client) {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    if (selectedClient?.id === updated.id) setSelectedClient({ ...selectedClient, ...updated });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="dash-page-header">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="dash-eyebrow">CRM</p>
            <h1 className="dash-h1">Clients</h1>
            <p className="dash-subtitle">Manage your guest relationships.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!loading && (
              <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--dash-text-secondary)" }}>
                {counts.all} total
              </p>
            )}
            <button
              onClick={() => setShowBroadcast((b) => !b)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors"
              style={{
                background: showBroadcast ? "var(--rez-glow)" : "var(--rez-highlight)",
                color: showBroadcast ? "var(--dash-accent-fg)" : "var(--dash-text)",
                border: "1px solid var(--dash-border)",
              }}
            >
              <Send className="h-3.5 w-3.5" />
              Broadcast
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Broadcast compose */}
      {showBroadcast && (
        <BroadcastPanel
          segment={activeSegment}
          counts={counts}
          onClose={() => setShowBroadcast(false)}
        />
      )}

      {/* Segment tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {(Object.entries(SEGMENT_CONFIG) as [Segment, typeof SEGMENT_CONFIG[Segment]][]).map(([seg, cfg]) => {
          const count = seg === "all" ? counts.all : counts[seg] ?? 0;
          const Icon = cfg.icon;
          const active = activeSegment === seg;
          return (
            <button
              key={seg}
              onClick={() => { setActiveSegment(seg); setSearch(""); }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all"
              style={{
                background: active ? "var(--rez-highlight)" : "transparent",
                border: `1px solid ${active ? "var(--rez-glow-dim)" : "var(--dash-border)"}`,
                color: active ? cfg.color : "var(--dash-muted)",
              }}
            >
              <Icon className="h-3 w-3" />
              {cfg.label}
              <span
                className="rounded-full px-1.5 py-px text-[9px] font-bold tabular-nums"
                style={{
                  background: active ? "var(--dash-surface-elevated)" : "var(--rez-highlight)",
                  color: "var(--dash-muted)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--dash-muted)" }} />
        <Input
          className="dash-input h-11 rounded-xl pl-10"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Main layout: list + detail panel */}
      <div className={`grid gap-3 transition-all ${selectedClient ? "lg:grid-cols-[1fr_380px]" : ""}`}>

        {/* Client list */}
        <div className="dash-card overflow-hidden">
          <div
            className="px-6 py-4"
            style={{ borderBottom: "1px solid var(--dash-divider)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
              {loading ? "Loading…" : `${filtered.length} client${filtered.length !== 1 ? "s" : ""}${search ? " found" : ""}`}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20" style={{ color: "var(--dash-muted)" }}>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading clients…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="dash-empty py-16">
              <Users className="mx-auto mb-3 h-10 w-10 opacity-25" />
              <p className="text-sm font-medium" style={{ color: "var(--dash-text-secondary)" }}>
                {search ? "No clients match your search" : `No ${activeSegment === "all" ? "" : activeSegment + " "}clients yet`}
              </p>
            </div>
          ) : (
            <div>
              {filtered.map((c, idx) => {
                const lastBooked = c.last_booked_at
                  ? new Date(c.last_booked_at).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })
                  : null;
                const isSelected = selectedClient?.id === c.id;

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClient(isSelected ? null : c)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-[var(--rez-highlight)]"
                    style={{
                      borderTop: idx > 0 ? "1px solid var(--dash-divider)" : undefined,
                      background: isSelected ? "var(--rez-highlight)" : "transparent",
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="dash-icon-circle flex h-11 w-11 shrink-0 items-center justify-center text-sm font-bold relative"
                        style={{
                          boxShadow: c.segment === "vip" ? "0 0 0 2px #f59e0b" : undefined,
                        }}
                      >
                        {(c.name || "?")[0].toUpperCase()}
                        {c.segment === "vip" && (
                          <Star className="absolute -top-1 -right-1 h-3 w-3 fill-amber-400 text-amber-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                            {c.name}
                          </p>
                          {c.segment && <SegmentBadge segment={c.segment} />}
                          {(c.tags ?? []).filter((t) => t !== "vip").map((t) => (
                            <TagPill key={t} tag={t} />
                          ))}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          {c.email && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--dash-muted)" }}>
                              <Mail className="h-3 w-3" /> {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--dash-muted)" }}>
                              <Phone className="h-3 w-3" /> {c.phone}
                            </span>
                          )}
                          {(c.total_visits ?? 0) > 0 && (
                            <span className="text-xs" style={{ color: "var(--dash-muted)" }}>
                              {c.total_visits} visit{c.total_visits !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <div className="text-right">
                        {(c.lifetime_spend ?? 0) > 0 && (
                          <p className="flex items-center justify-end gap-1 text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                            <DollarSign className="h-3.5 w-3.5" style={{ color: "var(--dash-muted)" }} />
                            {Number(c.lifetime_spend).toFixed(0)}
                            <span className="text-xs font-normal" style={{ color: "var(--dash-muted)" }}>lifetime</span>
                          </p>
                        )}
                        {lastBooked && (
                          <p className="mt-0.5 text-xs" style={{ color: "var(--dash-muted)" }}>
                            Last: {lastBooked}
                          </p>
                        )}
                      </div>
                      <ChevronRight
                        className="h-4 w-4 transition-transform"
                        style={{
                          color: "var(--dash-muted)",
                          transform: isSelected ? "rotate(90deg)" : "rotate(0deg)",
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedClient && (
          <ClientDetailPanel
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
            onUpdate={handleClientUpdate}
          />
        )}
      </div>
    </div>
  );
}
