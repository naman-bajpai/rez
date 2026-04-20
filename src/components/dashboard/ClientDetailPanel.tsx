"use client";

import { useEffect, useState } from "react";
import {
  X, Loader2, Star, Calendar, DollarSign, AlertTriangle,
  Phone, Mail, TrendingUp, Hash, Plus,
  MessageCircle,
} from "lucide-react";

type Booking = {
  id: string;
  starts_at: string;
  status: string;
  payment_status?: string;
  services?: { name: string; price?: number } | null;
};

type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  instagram_id?: string;
  tags?: string[];
  total_visits?: number;
  lifetime_spend?: number;
  no_show_count?: number;
  cancellation_count?: number;
  birthday?: string;
  churn_risk_score?: number;
  segment?: string;
  last_booked_at?: string;
  created_at?: string;
};

const PRESET_TAGS = ["vip", "loyal", "referral", "sensitive", "prepaid"];

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#22c55e",
  pending:   "#f59e0b",
  cancelled: "#ef4444",
  no_show:   "#94a3b8",
  completed: "var(--dash-muted)",
};

function RiskBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.7 ? "#ef4444" : score >= 0.4 ? "#f59e0b" : "#22c55e";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--dash-muted)" }}>Churn risk</span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--dash-border)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function ClientDetailPanel({
  client,
  onClose,
  onUpdate,
}: {
  client: Client;
  onClose: () => void;
  onUpdate: (updated: Client) => void;
}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [tags, setTags] = useState<string[]>(client.tags ?? []);
  const [newTag, setNewTag] = useState("");
  const [savingTags, setSavingTags] = useState(false);
  const [birthday, setBirthday] = useState(client.birthday ?? "");
  const [savingBirthday, setSavingBirthday] = useState(false);

  useEffect(() => {
    setTags(client.tags ?? []);
    setBirthday(client.birthday ?? "");

    fetch(`/api/clients/${client.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.bookings) setBookings(d.bookings); })
      .catch(() => {})
      .finally(() => setLoadingBookings(false));
  }, [client.id]);

  async function saveTags(nextTags: string[]) {
    setTags(nextTags);
    setSavingTags(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: nextTags }),
      });
      const d = await res.json();
      if (d.client) onUpdate({ ...client, ...d.client });
    } finally {
      setSavingTags(false);
    }
  }

  function addTag(tag: string) {
    const t = tag.trim().toLowerCase();
    if (!t || tags.includes(t)) return;
    saveTags([...tags, t]);
    setNewTag("");
  }

  function removeTag(tag: string) {
    saveTags(tags.filter((t) => t !== tag));
  }

  async function saveBirthday(value: string) {
    setBirthday(value);
    setSavingBirthday(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthday: value || null }),
      });
      const d = await res.json();
      if (d.client) onUpdate({ ...client, ...d.client });
    } finally {
      setSavingBirthday(false);
    }
  }

  const risk = client.churn_risk_score ?? 0;
  const isVip = tags.includes("vip") || (client.total_visits ?? 0) >= 8 || (client.lifetime_spend ?? 0) >= 500;

  return (
    <div className="rez-bento-card flex flex-col overflow-hidden" style={{ maxHeight: "calc(100vh - 200px)" }}>
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 p-5"
        style={{ borderBottom: "1px solid var(--dash-divider)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="dash-icon-circle flex h-12 w-12 shrink-0 items-center justify-center text-base font-bold relative"
            style={{ boxShadow: isVip ? "0 0 0 2px #f59e0b" : undefined }}
          >
            {(client.name || "?")[0].toUpperCase()}
            {isVip && <Star className="absolute -top-1 -right-1 h-3 w-3 fill-amber-400 text-amber-400" />}
          </div>
          <div className="min-w-0">
            <p className="font-bold tracking-tight truncate" style={{ color: "var(--dash-text)" }}>
              {client.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--dash-muted)" }}>
              Since {client.created_at ? new Date(client.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1.5 rounded-lg transition-colors hover:bg-[var(--rez-highlight)]"
        >
          <X className="h-4 w-4" style={{ color: "var(--dash-muted)" }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Contact */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-60" style={{ color: "var(--dash-muted)" }}>
            Contact
          </p>
          {client.email && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--dash-text)" }}>
              <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--dash-muted)" }} />
              {client.email}
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--dash-text)" }}>
              <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--dash-muted)" }} />
              {client.phone}
            </div>
          )}
          {client.instagram_id && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--dash-text)" }}>
              <MessageCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--dash-muted)" }} />
              {client.instagram_id}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: TrendingUp, label: "Visits",   value: String(client.total_visits ?? 0) },
            { icon: DollarSign, label: "Lifetime",  value: `$${Number(client.lifetime_spend ?? 0).toFixed(0)}` },
            { icon: AlertTriangle, label: "No-shows", value: String(client.no_show_count ?? 0) },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-xl p-3 text-center"
              style={{ background: "var(--dash-surface-elevated)", border: "1px solid var(--dash-border)" }}
            >
              <Icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: "var(--dash-muted)" }} />
              <p className="text-base font-bold tabular-nums" style={{ color: "var(--dash-text)" }}>{value}</p>
              <p className="text-[9px] uppercase tracking-wider font-bold opacity-60" style={{ color: "var(--dash-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Churn risk */}
        {client.churn_risk_score != null && (
          <RiskBar score={risk} />
        )}

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-60" style={{ color: "var(--dash-muted)" }}>
              Tags
            </p>
            {savingTags && <Loader2 className="h-3 w-3 animate-spin" style={{ color: "var(--dash-muted)" }} />}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => removeTag(t)}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all hover:opacity-70"
                style={{
                  background: t === "vip" ? "rgba(245,158,11,0.15)" : "var(--rez-highlight)",
                  color: t === "vip" ? "#f59e0b" : "var(--dash-text)",
                  border: "1px solid var(--dash-border)",
                }}
              >
                {t} <X className="h-2.5 w-2.5" />
              </button>
            ))}
          </div>

          {/* Preset tags */}
          <div className="flex flex-wrap gap-1">
            {PRESET_TAGS.filter((t) => !tags.includes(t)).map((t) => (
              <button
                key={t}
                onClick={() => addTag(t)}
                className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold opacity-60 hover:opacity-100 transition-opacity"
                style={{ background: "var(--rez-highlight)", color: "var(--dash-muted)", border: "1px dashed var(--dash-border)" }}
              >
                <Plus className="h-2.5 w-2.5" /> {t}
              </button>
            ))}
          </div>

          {/* Custom tag input */}
          <form
            onSubmit={(e) => { e.preventDefault(); addTag(newTag); }}
            className="flex gap-2"
          >
            <div className="flex-1 relative">
              <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: "var(--dash-muted)" }} />
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="custom tag…"
                className="w-full rounded-lg pl-7 pr-3 py-1.5 text-xs outline-none"
                style={{
                  background: "var(--dash-surface-elevated)",
                  border: "1px solid var(--dash-border)",
                  color: "var(--dash-text)",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!newTag.trim()}
              className="rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-40 transition-opacity"
              style={{ background: "var(--rez-highlight)", color: "var(--dash-text)", border: "1px solid var(--dash-border)" }}
            >
              Add
            </button>
          </form>
        </div>

        {/* Birthday */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-60" style={{ color: "var(--dash-muted)" }}>
              Birthday
            </p>
            {savingBirthday && <Loader2 className="h-3 w-3 animate-spin" style={{ color: "var(--dash-muted)" }} />}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--dash-muted)" }} />
            <input
              type="date"
              value={birthday}
              onChange={(e) => saveBirthday(e.target.value)}
              className="rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{
                background: "var(--dash-surface-elevated)",
                border: "1px solid var(--dash-border)",
                color: "var(--dash-text)",
              }}
            />
          </div>
        </div>

        {/* Booking history */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-60" style={{ color: "var(--dash-muted)" }}>
            Visit History
          </p>

          {loadingBookings ? (
            <div className="flex items-center gap-2 py-4" style={{ color: "var(--dash-muted)" }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Loading…</span>
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-xs py-2" style={{ color: "var(--dash-muted)" }}>No bookings on record.</p>
          ) : (
            <div className="space-y-1.5">
              {bookings.slice(0, 10).map((b) => {
                const statusColor = STATUS_COLORS[b.status] ?? "var(--dash-muted)";
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                    style={{ background: "var(--dash-surface-elevated)", border: "1px solid var(--dash-border)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--dash-text)" }}>
                        {b.services?.name ?? "Appointment"}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--dash-muted)" }}>
                        {new Date(b.starts_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {b.services?.price && (
                        <span className="text-xs font-semibold" style={{ color: "var(--dash-text)" }}>
                          ${b.services.price}
                        </span>
                      )}
                      <span
                        className="rounded-full px-2 py-px text-[9px] font-bold uppercase tracking-wide"
                        style={{ color: statusColor, background: `${statusColor}20` }}
                      >
                        {b.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
