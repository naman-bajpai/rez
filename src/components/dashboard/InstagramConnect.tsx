"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Camera as InstagramIcon, CheckCircle2, AlertCircle, Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = {
  connected: boolean;
  ig_page_id: string | null;
  ig_username: string | null;
};

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You declined the Instagram permissions. Try again and approve all requested permissions.",
  no_pages: "No Facebook Pages found on your account. You need a Facebook Page connected to an Instagram Business or Creator account.",
  no_ig_account: "None of your Facebook Pages have an Instagram Business Account connected. Go to Instagram → Settings → Account → Switch to Professional Account, then link it to your Facebook Page.",
  token_exchange_failed: "Something went wrong during login. Please try again.",
  token_extend_failed: "Could not extend your Instagram session. Please try again.",
  pages_fetch_failed: "Couldn't read your Facebook Pages. Re-authorise and try again.",
  state_mismatch: "Session expired. Please try connecting again.",
  invalid_state: "Invalid OAuth state. Please try connecting again.",
  missing_params: "Instagram returned an incomplete response. Please try again.",
  server_misconfigured: "Server configuration error. Contact support.",
  db_failed: "Failed to save your connection. Please try again.",
  not_signed_in: "Please sign in first, then connect Instagram.",
  no_business: "No business is linked to your account yet — finish onboarding first.",
  connect_failed: "Could not start the Instagram connection. Please try again.",
};

export function InstagramConnect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const igConnected = searchParams.get("ig_connected");
  const igError = searchParams.get("ig_error");

  useEffect(() => {
    fetch("/api/instagram/status")
      .then((r) => r.json())
      .then((data: Status) => setStatus(data))
      .catch(() => setStatus({ connected: false, ig_page_id: null, ig_username: null }))
      .finally(() => setLoading(false));
  }, [igConnected]); // re-fetch after OAuth redirect

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/instagram/disconnect", { method: "POST" });
      setStatus({ connected: false, ig_page_id: null, ig_username: null });
      // Clear search params
      router.replace("/dashboard/settings");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div
      className="rounded-2xl border p-6 space-y-5"
      style={{ borderColor: "var(--dash-border)", backgroundColor: "var(--dash-card)" }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}
        >
          <InstagramIcon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
            Instagram DMs
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--dash-muted)" }}>
            Connect your Instagram Business account so Rez can read and reply to DMs automatically.
          </p>
        </div>
      </div>

      {/* Success / error banners from OAuth redirect */}
      {igConnected && (
        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "var(--dash-border)", color: "var(--dash-text)" }}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
          Instagram connected successfully.
        </div>
      )}
      {igError && !igConnected && (
        <div
          className="flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "#f87171", color: "#ef4444" }}
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{ERROR_MESSAGES[igError] ?? "Connection failed. Please try again."}</span>
        </div>
      )}

      {/* Connection state */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--dash-muted)" }}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking connection…
        </div>
      ) : status?.connected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium" style={{ color: "var(--dash-text)" }}>
              Connected
              {status.ig_username ? (
                <span style={{ color: "var(--dash-muted)" }}> · @{status.ig_username}</span>
              ) : null}
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
            Rez is actively monitoring your DMs and replying to booking requests.
          </p>
          <Button
            variant="dashOutline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="h-8 rounded-lg px-3 text-xs"
          >
            {disconnecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Unlink className="h-3.5 w-3.5" />
            )}
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
            You&apos;ll need a Facebook Page connected to an Instagram Business or Creator account.
          </p>
          <Button
            asChild
            size="sm"
            className="h-9 rounded-lg px-4 text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)", color: "#fff", border: "none" }}
          >
            <a href="/api/instagram/connect">
                <InstagramIcon className="h-4 w-4" />
              Connect Instagram
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
