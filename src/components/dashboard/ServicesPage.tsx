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
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: Service) => {
    try {
      const res = await fetch(`/api/services/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !s.is_active }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchServices();
    } catch {
      alert("Failed to update service status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    setDeleteLoading(id);
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      await fetchServices();
    } catch {
      alert("Failed to delete service");
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
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your bookable services
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm(emptyForm);
          }}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          New service
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card className="border-violet-200 bg-violet-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {editingId ? "Edit service" : "Add new service"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3 grid gap-2">
                <Label htmlFor="svc-name">Service name</Label>
                <Input
                  id="svc-name"
                  placeholder="e.g. Full Set Gel Nails"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
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
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleSave}
                disabled={
                  !form.name || !form.duration_mins || !form.price || saving
                }
                className="bg-violet-600 hover:bg-violet-700"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
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
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services list */}
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading services…
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <Scissors className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No services yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Add your first service to start accepting bookings.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-4 gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                      <Scissors className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">
                          {s.name}
                        </span>
                        {!s.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {s.duration_mins} min · ${Number(s.price).toFixed(2)}
                        {s.add_ons?.length > 0 &&
                          ` · ${s.add_ons.length} add-on${s.add_ons.length > 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => startEdit(s)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-gray-500"
                      onClick={() => handleToggleActive(s)}
                    >
                      {s.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(s.id)}
                      disabled={deleteLoading === s.id}
                    >
                      {deleteLoading === s.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
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
