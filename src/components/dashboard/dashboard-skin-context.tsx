"use client";

/** Static theme wrapper — no skin switching. */
export function DashboardSkinProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash-root min-h-[100dvh]">
      {children}
    </div>
  );
}
