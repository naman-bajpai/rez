"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { Check, Copy, ExternalLink, Link2 } from "lucide-react";
import Link from "next/link";

export function ShareLinkPanel({ slug, name }: { slug: string; name: string }) {
  const origin = useSyncExternalStore(
    useCallback(() => () => {}, []),
    useCallback(() => window.location.origin, []),
    () => ""
  );
  const bookingUrl = `${origin}/book/${slug}`;

  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--dash-text)" }}>
          Share your booking link
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--dash-muted)" }}>
          Send this link to clients so they can book directly with {name || "you"}.
        </p>
      </div>

      {/* Link card */}
      <div
        className="rounded-2xl border p-6 space-y-4"
        style={{ borderColor: "var(--dash-border)", backgroundColor: "var(--dash-card)" }}
      >
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--dash-muted)" }}>
          <Link2 className="h-4 w-4" />
          Your booking page
        </div>

        <div
          className="flex items-center overflow-hidden rounded-xl border"
          style={{ borderColor: "var(--dash-border)" }}
        >
          <span
            className="flex-1 truncate px-4 py-3 text-sm font-mono"
            style={{ color: "var(--dash-text)" }}
          >
            {bookingUrl}
          </span>
          <button
            onClick={copyLink}
            className="flex shrink-0 items-center gap-2 border-l px-4 py-3 text-sm font-semibold transition-colors"
            style={{
              borderColor: "var(--dash-border)",
              color: copied ? "var(--dash-accent)" : "var(--dash-muted)",
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="flex gap-3 pt-1">
          <Link
            href={`/book/${slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: "var(--dash-accent)",
              color: "var(--dash-accent-fg)",
            }}
          >
            <ExternalLink className="h-4 w-4" />
            Preview page
          </Link>
        </div>
      </div>

      {/* Tips */}
      <div
        className="rounded-2xl border p-6 space-y-3"
        style={{ borderColor: "var(--dash-border)", backgroundColor: "var(--dash-card)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--dash-muted)" }}>
          Where to share
        </p>
        {[
          { label: "Instagram bio", detail: "Add it as the link in your bio." },
          { label: "DM replies", detail: "Drop it when a client asks about availability." },
          { label: "Email signature", detail: "Let clients book without the back-and-forth." },
        ].map(({ label, detail }) => (
          <div key={label} className="flex gap-3">
            <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "var(--dash-accent)" }} />
            <div>
              <span className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>{label}</span>
              <span className="text-sm" style={{ color: "var(--dash-muted)" }}> — {detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
