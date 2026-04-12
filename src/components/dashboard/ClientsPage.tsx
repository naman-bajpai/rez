"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="rounded-lg border border-zinc-200 bg-[oklch(0.997_0.005_95)] p-6 shadow-[0_30px_90px_-60px_rgba(39,39,42,0.7)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
          Guest list
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">
          Clients
        </h1>
        <p className="mt-2 text-sm text-zinc-600">People who have booked with you.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          className="h-11 rounded-lg border-zinc-200 bg-white pl-9 shadow-sm"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden border-zinc-200 bg-[oklch(0.997_0.005_95)] shadow-[0_30px_90px_-60px_rgba(39,39,42,0.7)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight text-zinc-950">
            {loading ? "Loading…" : `${filtered.length} client${filtered.length !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading clients...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg bg-zinc-50 py-12 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
              <p className="text-sm font-medium text-zinc-500">
                {search ? "No clients match your search." : "No clients yet."}
              </p>
              {!search && (
                <p className="mt-1 text-xs text-zinc-400">
                  Clients appear here once they book an appointment.
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
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
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-sm font-bold text-violet-800">
                        {(c.name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-950">{c.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          {c.email && (
                            <span className="flex items-center gap-1 text-xs text-zinc-400">
                              <Mail className="h-3 w-3" />
                              {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span className="flex items-center gap-1 text-xs text-zinc-400">
                              <Phone className="h-3 w-3" />
                              {c.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {c.avg_spend && (
                        <p className="text-sm font-semibold text-zinc-800">
                          ${Number(c.avg_spend).toFixed(0)} avg
                        </p>
                      )}
                      {lastBooked && (
                        <p className="text-xs text-zinc-400">Last: {lastBooked}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
