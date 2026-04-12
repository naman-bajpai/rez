"use client";

import { useEffect, useMemo, useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Search, Mail, Phone } from "lucide-react";

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
      .catch((err) => {
        if (err.name !== "AbortError") setError("Failed to load clients");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

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
    <div className="space-y-6">
      <div className="dash-page-header">
        <p className="dash-eyebrow">Guest list</p>
        <h1 className="dash-h1">Clients</h1>
        <p className="dash-subtitle">People who have booked with you.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: "var(--dash-muted)" }}
        />
        <Input
          className="dash-input h-11 rounded-lg pl-9"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="dash-card overflow-hidden">
        <CardHeader className="border-b pb-4" style={{ borderColor: "var(--dash-divider)" }}>
          <CardTitle className="text-lg font-semibold tracking-tight" style={{ color: "var(--dash-text)" }}>
            {loading ? "Loading…" : `${filtered.length} client${filtered.length !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16" style={{ color: "var(--dash-muted)" }}>
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading clients...
            </div>
          ) : filtered.length === 0 ? (
            <div className="dash-empty py-12">
              <Users className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm font-medium" style={{ color: "var(--dash-text-secondary)" }}>
                {search ? "No clients match your search." : "No clients yet."}
              </p>
              {!search && (
                <p className="mt-1 text-xs" style={{ color: "var(--dash-muted)" }}>
                  Clients appear here once they book an appointment.
                </p>
              )}
            </div>
          ) : (
            <div className="dash-divide">
              {filtered.map((c) => {
                const lastBooked = c.last_booked_at
                  ? new Date(c.last_booked_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null;

                return (
                  <div key={c.id} className="flex items-center justify-between gap-3 py-5">
                    <div className="flex items-center gap-3">
                      <div className="dash-icon-circle h-11 w-11 shrink-0 text-sm font-bold">
                        {(c.name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                          {c.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          {c.email && (
                            <span
                              className="flex items-center gap-1 text-xs"
                              style={{ color: "var(--dash-muted)" }}
                            >
                              <Mail className="h-3 w-3" />
                              {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span
                              className="flex items-center gap-1 text-xs"
                              style={{ color: "var(--dash-muted)" }}
                            >
                              <Phone className="h-3 w-3" />
                              {c.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {c.avg_spend && (
                        <p className="text-sm font-semibold" style={{ color: "var(--dash-text-secondary)" }}>
                          ${Number(c.avg_spend).toFixed(0)} avg
                        </p>
                      )}
                      {lastBooked && (
                        <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                          Last: {lastBooked}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </div>
    </div>
  );
}
