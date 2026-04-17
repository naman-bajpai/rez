"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

export function LandingExperience() {
  const [handle, setHandle] = useState("");
  const [copied, setCopied] = useState(false);

  const slug = handle.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const bookingUrl = slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${slug}` : "";

  function copyLink() {
    if (!bookingUrl) return;
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-zinc-50 px-4">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <Image
            src="/images/logo.png"
            alt="ReZ"
            width={80}
            height={80}
            className="h-full w-full object-contain"
          />
        </div>
        <span className="text-xl font-semibold tracking-tight text-zinc-950">ReZ</span>
      </div>

      {/* Headline */}
      <h1 className="mt-8 max-w-sm text-center text-3xl font-semibold tracking-tight text-zinc-950 sm:max-w-md sm:text-4xl">
        Booking infrastructure for independent operators.
      </h1>

      <p className="mt-3 text-center text-sm leading-6 text-zinc-500">
        We&apos;re in private beta. Sign up for early access.
      </p>

      {/* Generate booking link */}
      <div className="mt-8 w-full max-w-sm">
        <p className="mb-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-widest">
          Preview your booking link
        </p>
        <div className="flex items-center overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-200 transition-all">
          <span className="flex-shrink-0 pl-4 text-sm text-zinc-400 select-none">rez.app/book/</span>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="your-name"
            className="min-w-0 flex-1 bg-transparent py-3 pr-2 text-sm text-zinc-950 placeholder:text-zinc-300 outline-none"
          />
          <button
            onClick={copyLink}
            disabled={!slug}
            className="flex h-full items-center gap-1.5 border-l border-zinc-200 px-4 py-3 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        {slug && (
          <div className="mt-2 flex items-center gap-1.5 px-1">
            <Link2 className="h-3 w-3 text-zinc-400" />
            <span className="text-xs text-zinc-400 truncate">rez.app/book/{slug}</span>
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-8 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 active:scale-[0.98]"
        >
          Sign up for beta access
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
        >
          Already have access? Sign in
        </Link>
      </div>
    </div>
  );
}
