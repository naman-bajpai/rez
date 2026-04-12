"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ease = "[transition-timing-function:cubic-bezier(0.32,0.72,0,1)]";

function LogoMark() {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-[0_0_28px_-6px_rgba(139,92,246,0.75)] ring-1 ring-white/25"
      aria-hidden
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="text-white/95">
        <path
          d="M7 5h10M7 9h10M7 13h6v6H7v-6Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function ArrowTray({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M3 7h8M8 3l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LandingNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const close = () => setOpen(false);

  const railLink = cn(
    "rounded-full px-3.5 py-2 text-sm text-zinc-600",
    ease,
    "transition-[color,background-color] duration-300",
    "hover:bg-zinc-100 hover:text-zinc-950"
  );

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-6 md:pt-6">
        <div className="pointer-events-auto mx-auto max-w-6xl">
          <nav
            aria-label="Primary"
            className={cn(
              "relative flex items-center justify-between gap-2 rounded-2xl border border-zinc-200",
              "bg-[oklch(0.995_0.006_95)]/86 py-2 pl-3 pr-2 shadow-[0_18px_50px_-34px_rgba(39,39,42,0.6)]",
              "backdrop-blur-2xl md:gap-4 md:pl-4 md:pr-3",
              ease,
              "transition-shadow duration-500"
            )}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/70 to-transparent to-45% opacity-60"
              aria-hidden
            />

            <div className="relative flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className={cn(
                  "flex min-w-0 items-center gap-2.5 rounded-xl py-0.5 pr-1",
                  ease,
                  "transition-opacity duration-300 hover:opacity-90"
                )}
                onClick={close}
              >
                <LogoMark />
                <div className="min-w-0">
                  <span className="block text-[15px] font-semibold tracking-tight text-zinc-950">
                    ReZ
                  </span>
                  <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500 sm:block">
                    Booking OS
                  </span>
                </div>
              </Link>

              <div
                className="mx-1 hidden h-6 w-px shrink-0 bg-gradient-to-b from-transparent via-zinc-200 to-transparent sm:block"
                aria-hidden
              />

              <div className="hidden items-center rounded-full border border-zinc-200 bg-zinc-50 p-0.5 sm:flex">
                <Link href="/book?slug=demo" className={railLink}>
                  Live demo
                </Link>
                <Link href="/dashboard" className={railLink}>
                  Dashboard
                </Link>
              </div>
            </div>

            <div className="relative flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Link
                href="/login"
                className={cn(
                  "hidden rounded-full px-3.5 py-2 text-sm font-medium text-zinc-600 md:inline-flex",
                  ease,
                  "transition-colors duration-300 hover:text-zinc-950"
                )}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className={cn(
                  "group hidden items-center gap-0.5 rounded-full bg-zinc-950 px-1 py-1 pl-4 text-sm font-medium text-[#fbfaf7]",
                  "shadow-[0_14px_44px_-18px_rgba(39,39,42,0.75)] sm:inline-flex",
                  ease,
                  "transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
                )}
                onClick={close}
              >
                Get started
                <span
                  className={cn(
                    "ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/10",
                    ease,
                    "transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px"
                  )}
                >
                  <ArrowTray className="text-[#fbfaf7]" />
                </span>
              </Link>

              <button
                type="button"
                aria-expanded={open}
                aria-controls="landing-mobile-menu"
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200",
                  "bg-white/70 text-zinc-900 sm:hidden",
                  ease,
                  "transition-[background-color,border-color] duration-300 hover:border-zinc-300 hover:bg-white"
                )}
                onClick={() => setOpen((v) => !v)}
              >
                <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
                <span className="relative block h-3 w-4">
                  <span
                    className={cn(
                      "absolute left-0 top-0.5 h-0.5 w-4 rounded-full bg-current",
                      ease,
                      "origin-center transition-all duration-300",
                      open && "top-1.5 rotate-45"
                    )}
                  />
                  <span
                    className={cn(
                      "absolute left-0 top-[0.625rem] h-0.5 w-4 rounded-full bg-current",
                      ease,
                      "origin-center transition-all duration-300",
                      open && "top-1.5 -rotate-45"
                    )}
                  />
                </span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      <div
        id="landing-mobile-menu"
        className={cn(
          "fixed inset-0 z-40 sm:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          className={cn(
            "absolute inset-0 bg-zinc-950/20 backdrop-blur-[6px]",
            ease,
            "transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={close}
          aria-label="Close menu"
        />
        <div
          className={cn(
            "absolute left-4 right-4 top-[4.75rem] overflow-hidden rounded-2xl border border-zinc-200",
            "bg-[oklch(0.995_0.006_95)]/94 p-2 shadow-[0_32px_64px_-32px_rgba(39,39,42,0.55)] backdrop-blur-2xl",
            ease,
            "transition-[opacity,transform] duration-300",
            open ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
          )}
        >
          <div className="flex flex-col gap-0.5 p-1.5">
            <Link
              href="/book?slug=demo"
              className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200"
              onClick={close}
            >
              Live demo
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200"
              onClick={close}
            >
              Dashboard
            </Link>
            <div className="my-1 h-px bg-zinc-200" />
            <Link
              href="/login"
              className="rounded-xl px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              onClick={close}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className={cn(
                "mt-1 flex items-center justify-center gap-2 rounded-xl bg-zinc-950 py-3.5 text-sm font-semibold text-[#fbfaf7]",
                ease,
                "transition-transform duration-200 active:scale-[0.98]"
              )}
              onClick={close}
            >
              Get started
              <ArrowTray className="text-[#fbfaf7]" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
