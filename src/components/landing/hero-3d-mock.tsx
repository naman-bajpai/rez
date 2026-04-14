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
      className={`rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition-transform hover:scale-[1.01] ${className ?? ""}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          Next Available
        </span>
        <span className="flex h-2 w-2 rounded-full bg-zinc-950 animate-pulse" />
      </div>
      <p className="text-xl font-bold tracking-tight text-zinc-950">Thu · 14:30</p>
      <p className="mt-1 text-xs font-bold text-zinc-400 uppercase tracking-widest">Studio Session</p>
      
      <div className="mt-6 flex items-center gap-3 border-t border-zinc-50 pt-4">
        <div className="h-8 w-8 rounded-lg bg-zinc-950 flex items-center justify-center text-[10px] font-bold text-white">
          AM
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-900">Alex Morgan</p>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Verified Guest</p>
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
    targetRef.current = { rx: ny * -10, ry: nx * 10 };
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
      className={`relative mx-auto max-w-md lg:ml-auto lg:mr-0 animate-in fade-in slide-in-from-right-8 duration-1000 [perspective:1200px]`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div
        className={`relative isolate [transform-style:preserve-3d] ${reduceMotion ? "" : "cursor-crosshair"}`}
        style={{
          transform: reduceMotion ? "rotateX(4deg) rotateY(-6deg)" : transform,
          transition: reduceMotion ? undefined : "none",
        }}
      >
        <div
          className="absolute inset-x-8 top-12 -z-10 h-full rounded-[2.5rem] bg-zinc-200/50 blur-3xl [transform:translateZ(-100px)]"
          aria-hidden
        />

        <div className="relative z-10 [transform:translateZ(40px)]">
          <div className="rounded-[3rem] border border-zinc-200 bg-white p-3 shadow-[0_30px_90px_rgba(113,113,122,0.2)]">
            <div className="rounded-[2.25rem] border border-zinc-100 bg-zinc-50/80 p-8">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">your-brand.rez.app</span>
                <div className="flex gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-200" />
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-200" />
                </div>
              </div>
              
              <MockBookingCard />
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Conversion</p>
                  <p className="mt-2 text-2xl font-bold tracking-tighter text-zinc-950">94%</p>
                </div>
                <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Net Growth</p>
                  <p className="mt-2 text-2xl font-bold tracking-tighter text-zinc-950">+12</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`absolute -right-7 top-1/4 z-20 hidden rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-700 shadow-lg lg:block [transform:translateZ(100px) rotateY(-10deg)] ${ease}`}
          aria-hidden
        >
          Secure Checkout
        </div>

        <div
          className={`absolute -bottom-10 -left-10 z-[5] hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg lg:block [transform:translateZ(80px) rotateY(15deg)] ${ease}`}
          aria-hidden
        >
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-zinc-950" />
            <div className="h-2 w-12 rounded-full bg-zinc-100" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-1 w-24 rounded-full bg-zinc-100" />
            <div className="h-1 w-16 rounded-full bg-zinc-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
