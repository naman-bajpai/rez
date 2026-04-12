"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type FormState = {
  name: string;
  duration_mins: string;
  price: string;
};

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

  useEffect(() => {
    fetchServices();
  }, []);

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

      if (editingId) {
        const res = await fetch(`/api/services/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to update");
      } else {
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to create");
      }

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
      setActionError(err instanceof Error ? err.message : "Failed to update service status");
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
      setActionError(err instanceof Error ? err.message : "Failed to delete service");
    } finally {
      setDeleteLoading(null);
    }
  };

  const startEdit = (s: Service) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      duration_mins: String(s.duration_mins),
      price: String(s.price),
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-zinc-200 bg-[oklch(0.997_0.005_95)] p-6 shadow-[0_30px_90px_-60px_rgba(39,39,42,0.7)] sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            Offer menu
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">
            Services
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Manage your bookable services
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm(emptyForm);
            setFormError(null);
          }}
          className="h-11 rounded-lg bg-zinc-950 px-5 text-[#fbfaf7] hover:bg-zinc-800"
        >
          <Plus className="mr-1 h-4 w-4" />
          New service
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {showForm && (
        <Card className="border-zinc-200 bg-[oklch(0.997_0.005_95)] shadow-[0_30px_90px_-60px_rgba(39,39,42,0.7)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold tracking-tight text-zinc-950">
              {editingId ? "Edit service" : "Add new service"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2 sm:col-span-3">
                <Label htmlFor="svc-name">Service name</Label>
                <Input
                  id="svc-name"
                  placeholder="e.g. Full Set Gel Nails"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="h-11 rounded-lg border-zinc-200 bg-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="svc-duration">Duration (mins)</Label>
                <Input
                  id="svc-duration"
                  type="number"
                  placeholder="60"
                  min={5}
                  value={form.duration_mins}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, duration_mins: e.target.value }))
                  }
                  className="h-11 rounded-lg border-zinc-200 bg-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="svc-price">Price ($)</Label>
                <Input
                  id="svc-price"
                  type="number"
                  placeholder="75.00"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  className="h-11 rounded-lg border-zinc-200 bg-white"
                />
              </div>
            </div>
            {formError && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <Button
                onClick={handleSave}
                disabled={
                  !form.name || !form.duration_mins || !form.price || saving
                }
                className="rounded-lg bg-zinc-950 text-[#fbfaf7] hover:bg-zinc-800"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    {editingId ? "Save changes" : "Add service"}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm(emptyForm);
                  setFormError(null);
                }}
                className="rounded-lg"
              >
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden border-zinc-200 bg-[oklch(0.997_0.005_95)] shadow-[0_30px_90px_-60px_rgba(39,39,42,0.7)]">
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading services...
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-lg bg-zinc-50 py-12 text-center">
              <Scissors className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
              <p className="text-sm font-medium text-zinc-500">No services yet.</p>
              <p className="mt-1 text-xs text-zinc-400">
                Add your first service to start accepting bookings.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                      <Scissors className="h-4 w-4 text-violet-800" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-950">
                          {s.name}
                        </span>
                        {!s.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {s.duration_mins} min · ${Number(s.price).toFixed(2)}
                        {s.add_ons?.length > 0 &&
                          ` · ${s.add_ons.length} add-on${s.add_ons.length > 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => startEdit(s)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-lg text-xs text-zinc-500"
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
                          {deleteLoading === s.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Delete"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 rounded-lg text-xs"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Keep
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50"
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
        </CardContent>
      </Card>
    </div>
  );
}
