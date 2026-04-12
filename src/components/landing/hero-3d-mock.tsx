"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const ease = "[transition-timing-function:cubic-bezier(0.32,0.72,0,1)]";

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

function MockBookingCard({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-[calc(1.75rem-6px)] bg-[oklch(0.995_0.006_95)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] ${className ?? ""}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
          Next slot
        </span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          Open
        </span>
      </div>
      <p className="text-lg font-medium tracking-tight text-zinc-950">Thu · 2:30 PM</p>
      <p className="mt-1 text-sm text-zinc-500">Studio session · 60 min</p>
      <div className="mt-5 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
      <div className="mt-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500/80 to-teal-400/60 ring-2 ring-white" />
        <div>
          <p className="text-sm font-medium text-zinc-800">Alex M.</p>
          <p className="text-xs text-zinc-500">Verified · Card on file</p>
        </div>
      </div>
    </div>
  );
}

/** Layered booking UI with perspective + pointer parallax (GPU transforms only). */
export function Hero3DMock() {
  const reduceMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ rx: 0, ry: 0 });
  const currentRef = useRef({ rx: 0, ry: 0 });

  const [transform, setTransform] = useState(
    "rotateX(6deg) rotateY(-10deg) translateZ(0)"
  );

  function tick() {
    const cur = currentRef.current;
    const tgt = targetRef.current;
    const k = 0.12;
    cur.rx += (tgt.rx - cur.rx) * k;
    cur.ry += (tgt.ry - cur.ry) * k;
    setTransform(
      `rotateX(${cur.rx.toFixed(2)}deg) rotateY(${cur.ry.toFixed(2)}deg) translateZ(0)`
    );
    if (Math.abs(tgt.rx - cur.rx) > 0.02 || Math.abs(tgt.ry - cur.ry) > 0.02) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (reduceMotion) return;
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    targetRef.current = { rx: ny * -14, ry: nx * 14 };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  const onPointerLeave = () => {
    if (reduceMotion) return;
    targetRef.current = { rx: 6, ry: -10 };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    targetRef.current = { rx: 6, ry: -10 };
    currentRef.current = { rx: 6, ry: -10 };
  }, [reduceMotion]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <div
      ref={rootRef}
      className={`relative mx-auto max-w-md md:ml-auto md:mr-0 ${ease} animate-[fade-up_1s_cubic-bezier(0.32,0.72,0,1)_0.12s_both] [perspective:1200px]`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {/* Ambient 3D shards — static, behind scene */}
      <div
        className="pointer-events-none absolute -inset-8 -z-10 [transform-style:preserve-3d]"
        aria-hidden
      >
        <div
          className="absolute left-[4%] top-[18%]"
          style={
            reduceMotion
              ? undefined
              : {
                  animation:
                    "landing-shard-float 18s cubic-bezier(0.32, 0.72, 0, 1) infinite",
                }
          }
        >
          <div className="h-24 w-24 rounded-xl border border-violet-200 bg-gradient-to-br from-violet-200/70 to-transparent shadow-[0_24px_70px_-45px_rgba(139,92,246,0.45)] [transform:rotateX(52deg)_rotateZ(32deg)_translateZ(-120px)]" />
        </div>
        <div
          className="absolute right-[0%] top-[8%]"
          style={
            reduceMotion
              ? undefined
              : {
                  animation:
                    "landing-shard-float 22s cubic-bezier(0.32, 0.72, 0, 1) infinite reverse",
                }
          }
        >
          <div className="h-20 w-36 rounded-lg border border-teal-200 bg-teal-100/70 [transform:rotateX(48deg)_rotateZ(-18deg)_translateZ(-100px)]" />
        </div>
        <div
          className="absolute bottom-[12%] left-[20%]"
          style={
            reduceMotion
              ? undefined
              : {
                  animation:
                    "landing-shard-float 15s cubic-bezier(0.32, 0.72, 0, 1) infinite",
                }
          }
        >
          <div className="h-16 w-16 rounded-lg border border-zinc-200 bg-white/80 [transform:rotateX(60deg)_rotateY(12deg)_translateZ(-140px)]" />
        </div>
      </div>

      <div
        className={`relative isolate [transform-style:preserve-3d] ${reduceMotion ? "" : "cursor-grab active:cursor-grabbing"}`}
        style={{
          transform: reduceMotion ? "rotateX(4deg) rotateY(-6deg)" : transform,
          transition: reduceMotion ? undefined : "none",
        }}
      >
        {/* Deep back plane */}
        <div
          className="absolute inset-x-4 top-8 z-0 h-[88%] rounded-[2rem] border border-violet-200 bg-gradient-to-b from-violet-100/80 to-white/80 opacity-80 shadow-[0_40px_80px_-50px_rgba(39,39,42,0.55)] [transform:translateZ(-140px)_scale(0.92)]"
          aria-hidden
        />
        {/* Mid frame ghost */}
        <div
          className="absolute inset-x-2 top-4 z-[1] rounded-[2rem] border border-zinc-200 bg-white/70 opacity-80 [transform:translateZ(-70px)_scale(0.96)]"
          aria-hidden
        />

        {/* Main device */}
        <div className="relative z-10 [transform:translateZ(24px)]">
          <div className="rounded-[2rem] border border-zinc-200 bg-white/75 p-2 shadow-[0_50px_100px_-55px_rgba(39,39,42,0.65)]">
            <div className="rounded-[calc(2rem-8px)] border border-zinc-200 bg-gradient-to-b from-white to-[oklch(0.965_0.015_95)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">yourstudio.rez.app</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]" />
              </div>
              <MockBookingCard />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">Today</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-950">7</p>
                  <p className="text-xs text-zinc-500">Bookings</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">Pipeline</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-950">$2.4k</p>
                  <p className="text-xs text-zinc-500">This week</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Foreground glass chip */}
        <div
          className="absolute -right-2 top-[42%] z-20 hidden rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600 shadow-xl backdrop-blur-md md:block [transform:translateX(12px)_translateZ(80px)_rotateY(-8deg)]"
          aria-hidden
        >
          Live
        </div>

        {/* Secondary floating panel */}
        <div
          className="absolute -bottom-8 -left-6 z-[5] hidden h-28 w-44 rounded-2xl border border-zinc-200 bg-white/85 p-3 shadow-2xl backdrop-blur-md md:block [transform:translateZ(48px)_rotateY(14deg)_rotateX(4deg)]"
          aria-hidden
        >
          <div className="h-1.5 w-12 rounded-full bg-zinc-300" />
          <div className="mt-2 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-zinc-200" />
            <div className="h-1.5 w-[80%] rounded-full bg-zinc-200" />
          </div>
          <p className="mt-3 text-[10px] text-zinc-500">Syncing slots…</p>
        </div>
      </div>
    </div>
  );
}
