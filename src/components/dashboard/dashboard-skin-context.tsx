"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const DASHBOARD_SKINS = ["studio", "lagoon", "lunar", "paper"] as const;
export type DashboardSkinId = (typeof DASHBOARD_SKINS)[number];

const STORAGE_KEY = "rez-dashboard-skin";

type Ctx = {
  skin: DashboardSkinId;
  setSkin: (id: DashboardSkinId) => void;
};

const DashboardSkinContext = createContext<Ctx | null>(null);

function readStoredSkin(): DashboardSkinId {
  if (typeof window === "undefined") return "studio";
  try {
    const v = localStorage.getItem(STORAGE_KEY) as DashboardSkinId | null;
    if (v && DASHBOARD_SKINS.includes(v)) return v;
  } catch {
    /* ignore */
  }
  return "studio";
}

export function DashboardSkinProvider({ children }: { children: React.ReactNode }) {
  const [skin, setSkinState] = useState<DashboardSkinId>("studio");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSkinState(readStoredSkin());
    setReady(true);
  }, []);

  const setSkin = useCallback((id: DashboardSkinId) => {
    setSkinState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ skin, setSkin }), [skin, setSkin]);

  return (
    <DashboardSkinContext.Provider value={value}>
      <div
        className="dash-root min-h-[100dvh]"
        data-dashboard-skin={ready ? skin : "studio"}
        suppressHydrationWarning
      >
        {children}
      </div>
    </DashboardSkinContext.Provider>
  );
}

export function useDashboardSkin() {
  const ctx = useContext(DashboardSkinContext);
  if (!ctx) {
    throw new Error("useDashboardSkin must be used within DashboardSkinProvider");
  }
  return ctx;
}
