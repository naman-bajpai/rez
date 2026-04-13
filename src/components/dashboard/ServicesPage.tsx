"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Pencil, Trash2, Check, X, Scissors } from "lucide-react";

type Service = {
  id: string;
  name: string;
  duration_mins: number;
  price: number;
  is_active: boolean;
  add_ons: { name: string; price: number; duration_mins: number }[];
};

type FormState = { name: string; duration_mins: string; price: string };
const emptyForm: FormState = { name: "", duration_mins: "", price: "" };

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setServices(data.services ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.duration_mins || !form.price) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name,
        duration_mins: parseInt(form.duration_mins),
        price: parseFloat(form.price),
      };
      const url = editingId ? `/api/services/${editingId}` : "/api/services";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      await fetchServices();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: Service) => {
    setActionError(null);
    try {
      const res = await fetch(`/api/services/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !s.is_active }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchServices();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setConfirmDeleteId(null);
      await fetchServices();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleteLoading(null);
    }
  };

  const startEdit = (s: Service) => {
    setEditingId(s.id);
    setForm({ name: s.name, duration_mins: String(s.duration_mins), price: String(s.price) });
    setShowForm(true);
    setFormError(null);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="dash-page-header dash-page-header--row">
        <div>
          <p className="dash-eyebrow">Offer menu</p>
          <h1 className="dash-h1">Services</h1>
          <p className="dash-subtitle">Manage your bookable services and pricing.</p>
        </div>
        <Button
          variant="dash"
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); setFormError(null); }}
          className="h-11 shrink-0 rounded-xl px-5"
        >
          <Plus className="h-4 w-4" /> New service
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
      )}

      {/* Add / edit form */}
      {showForm && (
        <div className="dash-card overflow-hidden">
          <div
            className="px-6 py-4"
            style={{ borderBottom: "1px solid var(--dash-divider)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
              {editingId ? "Edit service" : "New service"}
            </p>
          </div>
          <div className="px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2 sm:col-span-3">
                <Label htmlFor="svc-name" className="text-xs font-semibold" style={{ color: "var(--dash-muted)" }}>
                  Service name
                </Label>
                <Input
                  id="svc-name"
                  placeholder="e.g. Full Set Gel Nails"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="dash-input h-11 rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="svc-duration" className="text-xs font-semibold" style={{ color: "var(--dash-muted)" }}>
                  Duration (mins)
                </Label>
                <Input
                  id="svc-duration"
                  type="number"
                  placeholder="60"
                  min={5}
                  value={form.duration_mins}
                  onChange={(e) => setForm((p) => ({ ...p, duration_mins: e.target.value }))}
                  className="dash-input h-11 rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="svc-price" className="text-xs font-semibold" style={{ color: "var(--dash-muted)" }}>
                  Price ($)
                </Label>
                <Input
                  id="svc-price"
                  type="number"
                  placeholder="75.00"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  className="dash-input h-11 rounded-xl"
                />
              </div>
            </div>
            {formError && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <Button
                variant="dash"
                onClick={handleSave}
                disabled={!form.name || !form.duration_mins || !form.price || saving}
                className="rounded-xl"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {editingId ? "Save changes" : "Add service"}
              </Button>
              <Button variant="dashOutline" onClick={cancelForm} className="rounded-xl">
                <X className="h-4 w-4" /> Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="dash-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20" style={{ color: "var(--dash-muted)" }}>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading services…</span>
          </div>
        ) : services.length === 0 ? (
          <div className="dash-empty py-16">
            <Scissors className="mx-auto mb-3 h-10 w-10 opacity-25" />
            <p className="text-sm font-medium" style={{ color: "var(--dash-text-secondary)" }}>No services yet</p>
            <p className="mt-1 text-xs" style={{ color: "var(--dash-muted)" }}>
              Add your first service to start accepting bookings.
            </p>
          </div>
        ) : (
          <div>
            {services.map((s, idx) => (
              <div
                key={s.id}
                className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center"
                style={{ borderTop: idx > 0 ? "1px solid var(--dash-divider)" : undefined }}
              >
                <div className="flex items-center gap-3">
                  <div className="dash-icon-circle h-11 w-11 shrink-0">
                    <Scissors className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                        {s.name}
                      </span>
                      {!s.is_active && (
                        <Badge variant="secondary" className="text-[11px]">Inactive</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--dash-muted)" }}>
                      {s.duration_mins} min · ${Number(s.price).toFixed(2)}
                      {s.add_ons?.length > 0 && ` · ${s.add_ons.length} add-on${s.add_ons.length > 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-1">
                  <Button size="icon" variant="dashGhost" className="h-8 w-8 rounded-lg" onClick={() => startEdit(s)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="dashGhost"
                    className="h-8 rounded-lg text-xs"
                    onClick={() => handleToggleActive(s)}
                  >
                    {s.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  {confirmDeleteId === s.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-red-200 text-xs text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(s.id)}
                        disabled={deleteLoading === s.id}
                      >
                        {deleteLoading === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete"}
                      </Button>
                      <Button size="sm" variant="dashGhost" className="h-8 rounded-lg text-xs" onClick={() => setConfirmDeleteId(null)}>
                        Keep
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-500/10"
                      onClick={() => setConfirmDeleteId(s.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
