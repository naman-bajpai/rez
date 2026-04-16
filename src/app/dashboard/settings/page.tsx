import { Suspense } from "react";
import { InstagramConnect } from "@/components/dashboard/InstagramConnect";
import { BookingModeSelector } from "@/components/dashboard/BookingModeSelector";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--dash-text)" }}>
          Settings
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--dash-muted)" }}>
          Manage your account and business preferences.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--dash-muted)" }}>
          Booking
        </h2>
        <BookingModeSelector />
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--dash-muted)" }}>
          Integrations
        </h2>
        {/* Suspense needed because InstagramConnect reads useSearchParams */}
        <Suspense>
          <InstagramConnect />
        </Suspense>
      </div>
    </div>
  );
}
