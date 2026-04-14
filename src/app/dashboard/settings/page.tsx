export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--dash-text)" }}>
          Settings
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--dash-muted)" }}>
          Manage your account and business preferences.
        </p>
      </div>
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: "var(--dash-border)", backgroundColor: "var(--dash-card)" }}
      >
        <p className="text-sm" style={{ color: "var(--dash-muted)" }}>
          Settings coming soon.
        </p>
      </div>
    </div>
  );
}
