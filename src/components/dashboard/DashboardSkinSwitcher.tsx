"use client";

import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_SKINS,
  type DashboardSkinId,
  useDashboardSkin,
} from "@/components/dashboard/dashboard-skin-context";

const LABELS: Record<DashboardSkinId, { name: string; hint: string }> = {
  studio: { name: "Studio", hint: "Modern mono" },
  lagoon: { name: "Lagoon", hint: "Teal & glass" },
  lunar: { name: "Lunar", hint: "Dark & violet" },
  paper: { name: "Paper", hint: "Warm cream" },
};

export function DashboardSkinSwitcher({ className }: { className?: string }) {
  const { skin, setSkin } = useDashboardSkin();

  return (
    <div className={cn("rounded-xl border p-3", className)} style={{ borderColor: "var(--dash-border)", background: "var(--dash-surface-muted)" }}>
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--dash-muted)" }}>
        <Palette className="h-3.5 w-3.5" aria-hidden />
        Skin
      </div>
      <div className="flex gap-1.5" role="group" aria-label="Dashboard color theme">
        {DASHBOARD_SKINS.map((id) => {
          const active = skin === id;
          return (
            <button
              key={id}
              type="button"
              title={`${LABELS[id].name} — ${LABELS[id].hint}`}
              onClick={() => setSkin(id)}
              className={cn(
                "flex-1 rounded-lg px-2 py-2 text-center text-[11px] font-semibold transition-[opacity,transform] duration-200",
                active ? "scale-[1.02] opacity-100" : "opacity-75 hover:opacity-100"
              )}
              style={{
                background: "var(--dash-surface-elevated)",
                color: "var(--dash-text)",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: active ? "var(--dash-accent)" : "var(--dash-border)",
                boxShadow: active ? "0 0 0 1px var(--dash-accent)" : "none",
              }}
            >
              {LABELS[id].name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
