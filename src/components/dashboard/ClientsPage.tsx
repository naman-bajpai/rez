"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Search, Mail, Phone, DollarSign } from "lucide-react";

type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avg_spend?: number;
  last_booked_at?: string;
};

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/clients", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setClients(d.clients ?? []);
      })
      .catch((err) => { if (err.name !== "AbortError") setError("Failed to load clients"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="dash-page-header">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="dash-eyebrow">Guest list</p>
            <h1 className="dash-h1">Clients</h1>
            <p className="dash-subtitle">People who have booked with you.</p>
          </div>
          {!loading && (
            <p className="shrink-0 text-sm font-semibold tabular-nums" style={{ color: "var(--dash-text-secondary)" }}>
              {clients.length} total
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

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

      {/* List */}
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
              {search ? "No clients match your search" : "No clients yet"}
            </p>
            {!search && (
              <p className="mt-1 text-xs" style={{ color: "var(--dash-muted)" }}>
                Clients appear here once they complete a booking.
              </p>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((c, idx) => {
              const lastBooked = c.last_booked_at
                ? new Date(c.last_booked_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null;

              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-4 px-6 py-5"
                  style={{ borderTop: idx > 0 ? "1px solid var(--dash-divider)" : undefined }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="dash-icon-circle flex h-11 w-11 shrink-0 items-center justify-center text-sm font-bold">
                      {(c.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                        {c.name}
                      </p>
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
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {c.avg_spend != null && (
                      <p className="flex items-center justify-end gap-1 text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                        <DollarSign className="h-3.5 w-3.5" style={{ color: "var(--dash-muted)" }} />
                        {Number(c.avg_spend).toFixed(0)} avg
                      </p>
                    )}
                    {lastBooked && (
                      <p className="mt-0.5 text-xs" style={{ color: "var(--dash-muted)" }}>
                        Last: {lastBooked}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
