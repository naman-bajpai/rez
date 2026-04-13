"use client";

import Image from "next/image";
import Link from "next/link";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";

const flowSteps = [
  {
    kicker: "01 / Signal",
    title: "Client sends DM",
    body: "The lead starts where your clients already are. No portal. No account creation. No handoff delay.",
  },
  {
    kicker: "02 / Agent",
    title: "AI responds instantly",
    body: "ReZ qualifies the request, checks context, and keeps the conversation moving while you stay booked.",
  },
  {
    kicker: "03 / Link",
    title: "Booking link generated",
    body: "A branded booking page appears with live slots, email OTP, policy details, and checkout-ready intent.",
  },
  {
    kicker: "04 / Paid",
    title: "Checkout complete",
    body: "Stripe Connect captures payment, syncs the slot, and closes the loop without commission leakage.",
  },
];

const features = [
  "Email OTP",
  "Live Slot Search",
  "Stripe Connect",
  "Calendar Sync",
  "AI Agent",
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

function MagneticLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={`landing-magnetic group inline-flex h-14 items-center justify-center gap-4 rounded-full px-4 pl-6 text-sm font-semibold tracking-[-0.01em] transition duration-700 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
        variant === "primary"
          ? "bg-white text-zinc-950 shadow-[0_0_44px_rgba(94,23,235,0.35)] hover:bg-[oklch(0.94_0.04_291)]"
          : "border border-white/12 bg-white/[0.04] text-zinc-100 hover:border-white/24 hover:bg-white/[0.08]"
      }`}
    >
      <span>{children}</span>
      <span
        className={`grid h-8 w-8 place-items-center rounded-full transition duration-700 group-hover:translate-x-1 group-hover:-translate-y-0.5 group-hover:scale-105 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] ${
          variant === "primary" ? "bg-zinc-950 text-white" : "bg-white/10 text-white"
        }`}
        aria-hidden
      >
        -&gt;
      </span>
    </Link>
  );
}

function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4 py-5 md:px-8">
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/10 bg-[oklch(0.1_0.015_285/0.72)] px-3 py-3 shadow-[0_20px_80px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.09)] backdrop-blur-2xl">
        <Link href="/" className="group flex items-center gap-3 rounded-full pr-4">
          <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]">
            <Image src="/images/ReZ.png" alt="ReZ" width={64} height={64} className="h-10 w-10 object-contain" priority />
          </span>
          <span className="text-base font-semibold tracking-[-0.04em] text-white">ReZ</span>
        </Link>

        <div className="hidden items-center gap-7 text-xs font-medium text-zinc-400 md:flex">
          <a href="#flow" className="transition-colors hover:text-white">Flow</a>
          <a href="#features" className="transition-colors hover:text-white">Stack</a>
          <a href="#metrics" className="transition-colors hover:text-white">Metrics</a>
          <Link href="/login" className="transition-colors hover:text-white">Sign in</Link>
          <MagneticLink href="/signup">Join beta</MagneticLink>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] md:hidden"
        >
          <span className={`absolute h-px w-4 bg-white transition duration-500 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] ${open ? "rotate-45" : "-translate-y-1"}`} />
          <span className={`absolute h-px w-4 bg-white transition duration-500 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] ${open ? "-rotate-45" : "translate-y-1"}`} />
        </button>
      </nav>

      <div
        className={`mx-auto mt-3 max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[oklch(0.09_0.018_285/0.9)] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition duration-700 md:hidden [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-4 text-lg font-semibold text-white">
          <a href="#flow" onClick={() => setOpen(false)}>Flow</a>
          <a href="#features" onClick={() => setOpen(false)}>Stack</a>
          <a href="#metrics" onClick={() => setOpen(false)}>Metrics</a>
          <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
          <MagneticLink href="/signup">Join beta</MagneticLink>
        </div>
      </div>
    </header>
  );
}

function HeroStack({ progress, reduced }: { progress: number; reduced: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 8, y: -12 });

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduced) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -12 + 4, y: x * 16 - 8 });
  }

  const depth = reduced ? 0 : progress;

  return (
    <div
      ref={rootRef}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setTilt({ x: 8, y: -12 })}
      className="landing-hero-stage mx-auto h-[520px] w-full max-w-[560px] [perspective:1500px] md:h-[680px]"
      aria-label="Layered ReZ product interface preview"
    >
      <div
        className="relative h-full w-full [transform-style:preserve-3d]"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        <div className="landing-screen landing-card-main absolute left-[7%] top-[18%] w-[76%] p-2 [transform-style:preserve-3d] md:left-[9%]">
          <div className="rounded-[1.65rem] border border-white/10 bg-[oklch(0.12_0.02_285/0.86)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              <span>your-brand.rez.app</span>
              <span className="h-2 w-2 rounded-full bg-[oklch(0.75_0.19_158)] shadow-[0_0_20px_oklch(0.75_0.19_158/0.8)]" />
            </div>
            <div className="mt-7 rounded-3xl bg-white p-5 text-zinc-950 shadow-[0_22px_80px_rgba(0,0,0,0.45)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Next available</p>
              <div className="mt-5 flex items-end justify-between gap-6">
                <div>
                  <p className="text-4xl font-semibold tracking-[-0.08em]">Thu 2:30</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Studio Session</p>
                </div>
                <span className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-semibold text-white">Reserve</span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {["1:00", "2:30", "4:00"].map((slot) => (
                  <span key={slot} className="rounded-xl bg-zinc-100 px-3 py-3 text-center text-xs font-semibold text-zinc-600">{slot}</span>
                ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Conversion</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.07em] text-white">94%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Net growth</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.07em] text-[oklch(0.78_0.18_157)]">+12</p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="landing-screen absolute right-[2%] top-[8%] w-[52%] rounded-[2rem] border border-white/10 bg-[oklch(0.13_0.035_285/0.82)] p-4 shadow-[0_30px_100px_rgba(94,23,235,0.28),inset_0_1px_0_rgba(255,255,255,0.14)]"
          style={{ transform: `translate3d(0, ${depth * 56}px, 130px) rotateZ(5deg)` }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Instagram DM</p>
          <div className="mt-4 space-y-3 text-xs">
            <p className="ml-auto w-[78%] rounded-2xl bg-white/10 px-4 py-3 text-zinc-200">Do you have any openings this week?</p>
            <p className="w-[82%] rounded-2xl bg-[oklch(0.6_0.24_291)] px-4 py-3 text-white">Yes. I can hold Thursday at 2:30.</p>
            <div className="flex gap-1.5 px-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:240ms]" />
            </div>
          </div>
        </div>

        <div
          className="landing-screen absolute bottom-[11%] left-0 w-[54%] rounded-[2rem] border border-white/10 bg-[oklch(0.92_0.03_274)] p-4 text-zinc-950 shadow-[0_30px_100px_rgba(42,106,255,0.24)]"
          style={{ transform: `translate3d(0, ${depth * -44}px, 90px) rotateZ(-7deg)` }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Checkout</p>
          <div className="mt-5 rounded-2xl bg-zinc-950 p-4 text-white">
            <p className="text-xs text-zinc-400">Studio Session</p>
            <p className="mt-1 text-3xl font-semibold tracking-[-0.07em]">$120</p>
          </div>
          <div className="mt-3 h-10 rounded-full bg-[oklch(0.6_0.24_291)]" />
        </div>

        <div
          className="landing-screen absolute bottom-[7%] right-[5%] w-[44%] rounded-[1.75rem] border border-white/10 bg-black/80 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
          style={{ transform: `translate3d(0, ${depth * -72}px, 170px) rotateZ(9deg)` }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Calendar</p>
          <div className="mt-4 grid grid-cols-5 gap-1.5">
            {Array.from({ length: 20 }).map((_, index) => (
              <span
                key={index}
                className={`aspect-square rounded-md ${[6, 7, 13, 17].includes(index) ? "bg-[oklch(0.65_0.24_291)] shadow-[0_0_16px_oklch(0.65_0.24_291/0.6)]" : "bg-white/8"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WordReveal({ text }: { text: string }) {
  return (
    <span aria-label={text}>
      {text.split(" ").map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="landing-word inline-block"
          style={{ "--word-delay": `${index * 54}ms` } as CSSProperties}
          aria-hidden
        >
          {word}&nbsp;
        </span>
      ))}
    </span>
  );
}

function ProblemSolution() {
  return (
    <section className="relative mx-auto grid max-w-7xl gap-12 px-4 py-28 md:grid-cols-[0.88fr_1.12fr] md:px-8 md:py-36">
      <div className="landing-reveal">
        <p className="landing-eyebrow">Problem to Solution</p>
        <h2 className="mt-5 max-w-xl text-5xl font-semibold leading-[0.96] tracking-[-0.075em] text-white md:text-7xl">
          <WordReveal text="Every lost DM is a tax on your calendar." />
        </h2>
        <p className="mt-8 max-w-[56ch] text-lg leading-8 text-zinc-400">
          ReZ replaces scattered tools with one branded route from intent to paid booking.
        </p>
      </div>
      <div className="landing-reveal relative min-h-[520px]">
        <div className="absolute left-0 top-8 w-[68%] rotate-[-4deg] rounded-[2rem] border border-red-400/20 bg-[oklch(0.16_0.05_25/0.65)] p-5 opacity-70 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.2em] text-red-200/70">Before</p>
          {["Manual replies", "Payment chase", "Calendar screenshots", "No-show risk"].map((item) => (
            <div key={item} className="mt-4 rounded-2xl bg-black/24 px-4 py-4 text-sm font-medium text-red-50/70 line-through">{item}</div>
          ))}
        </div>
        <div className="absolute bottom-0 right-0 w-[78%] rounded-[2.5rem] border border-white/10 bg-[oklch(0.1_0.026_285/0.92)] p-2 shadow-[0_40px_140px_rgba(94,23,235,0.32),inset_0_1px_0_rgba(255,255,255,0.12)]">
          <div className="rounded-[2rem] bg-[oklch(0.135_0.03_285)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[oklch(0.78_0.17_291)]">After</p>
            {["AI qualifies the lead", "Live slot search", "Stripe checkout", "Synced confirmation"].map((item, index) => (
              <div key={item} className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.05] px-4 py-4 text-sm font-medium text-white">
                <span>{item}</span>
                <span className="text-[oklch(0.77_0.18_156)]">{index === 3 ? "done" : "live"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowPreview({ active }: { active: number }) {
  return (
    <div className="landing-flow-device rounded-[2.75rem] border border-white/10 bg-[oklch(0.1_0.024_285/0.92)] p-2 shadow-[0_45px_160px_rgba(0,0,0,0.7),0_0_100px_rgba(94,23,235,0.22),inset_0_1px_0_rgba(255,255,255,0.12)]">
      <div className="min-h-[540px] overflow-hidden rounded-[2.25rem] bg-[oklch(0.075_0.018_285)] p-5 md:p-7">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          <span>ReZ Agent</span>
          <span>Step 0{active + 1}</span>
        </div>
        <div className="relative mt-8 min-h-[430px]">
          <div className={`landing-flow-layer ${active === 0 ? "is-active" : ""}`}>
            <div className="rounded-[2rem] bg-white/[0.06] p-5">
              <p className="ml-auto max-w-[78%] rounded-3xl bg-white/12 px-5 py-4 text-sm text-zinc-100">Hey, can I book a cut before Friday?</p>
              <p className="mt-4 max-w-[72%] rounded-3xl bg-[oklch(0.58_0.23_291)] px-5 py-4 text-sm text-white">I found two openings. Want the fastest slot?</p>
            </div>
          </div>
          <div className={`landing-flow-layer ${active === 1 ? "is-active" : ""}`}>
            <div className="rounded-[2rem] border border-white/10 bg-black/40 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Typing</p>
              <div className="mt-7 flex items-center gap-2">
                <span className="h-3 w-3 animate-bounce rounded-full bg-white" />
                <span className="h-3 w-3 animate-bounce rounded-full bg-white [animation-delay:120ms]" />
                <span className="h-3 w-3 animate-bounce rounded-full bg-white [animation-delay:240ms]" />
              </div>
              <div className="mt-8 h-3 w-2/3 rounded-full bg-white/10" />
              <div className="mt-3 h-3 w-1/2 rounded-full bg-white/10" />
            </div>
          </div>
          <div className={`landing-flow-layer ${active === 2 ? "is-active" : ""}`}>
            <div className="rounded-[2.2rem] bg-white p-5 text-zinc-950">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">your-brand.rez.app</p>
              <p className="mt-8 text-4xl font-semibold tracking-[-0.08em]">Choose a time</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {["Thu 2:30", "Thu 4:00", "Fri 10:00", "Fri 12:30"].map((slot) => (
                  <span key={slot} className="rounded-2xl bg-zinc-100 px-4 py-4 text-sm font-semibold">{slot}</span>
                ))}
              </div>
            </div>
          </div>
          <div className={`landing-flow-layer ${active === 3 ? "is-active" : ""}`}>
            <div className="grid min-h-[380px] place-items-center rounded-[2rem] bg-[oklch(0.13_0.04_158)] p-8 text-center">
              <div>
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[oklch(0.78_0.18_156)] text-2xl font-semibold text-black shadow-[0_0_60px_oklch(0.78_0.18_156/0.55)]">OK</span>
                <p className="mt-8 text-5xl font-semibold tracking-[-0.08em] text-white">Booked.</p>
                <p className="mt-3 text-sm text-emerald-100/70">Payment captured. Calendar synced.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductFlow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-flow-step]"));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target instanceof HTMLElement) {
          setActive(Number(visible.target.dataset.flowStep ?? 0));
        }
      },
      { rootMargin: "-34% 0px -34% 0px", threshold: [0, 0.25, 0.5, 0.75] }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="flow" className="relative border-y border-white/8 bg-black/25">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-28 md:grid-cols-[0.86fr_1.14fr] md:px-8 md:py-36">
        <div className="space-y-[36vh] pb-[26vh] pt-10">
          {flowSteps.map((step, index) => (
            <div key={step.title} data-flow-step={index} className="landing-reveal min-h-[42vh]">
              <p className="landing-eyebrow">{step.kicker}</p>
              <h2 className={`mt-5 max-w-lg text-5xl font-semibold leading-[0.96] tracking-[-0.075em] transition-colors duration-700 md:text-7xl ${active === index ? "text-white" : "text-zinc-700"}`}>
                {step.title}
              </h2>
              <p className="mt-6 max-w-[48ch] text-lg leading-8 text-zinc-400">{step.body}</p>
            </div>
          ))}
        </div>
        <div className="relative hidden md:block">
          <div className="sticky top-28">
            <FlowPreview active={active} />
          </div>
        </div>
        <div className="md:hidden">
          <FlowPreview active={active} />
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-28 md:px-8 md:py-36">
      <div className="landing-reveal max-w-3xl">
        <p className="landing-eyebrow">Operational Stack</p>
        <h2 className="mt-5 text-5xl font-semibold leading-[0.96] tracking-[-0.075em] text-white md:text-7xl">
          The pieces independent operators should not have to wire themselves.
        </h2>
      </div>
      <div className="mt-20 grid gap-5 md:grid-cols-5">
        {features.map((feature, index) => (
          <div
            key={feature}
            className="landing-feature-card landing-reveal group rounded-[2rem] border border-white/10 bg-white/[0.035] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.09)]"
            style={{ "--reveal-delay": `${index * 80}ms` } as CSSProperties}
          >
            <div className="min-h-56 rounded-[1.6rem] bg-[oklch(0.1_0.025_285)] p-5 transition duration-700 group-hover:bg-[oklch(0.135_0.04_285)] [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]">
              <div className="h-24 rounded-[1.3rem] border border-white/8 bg-[radial-gradient(circle_at_50%_30%,oklch(0.62_0.24_291/0.45),transparent_62%),oklch(0.075_0.018_285)] shadow-[0_20px_70px_rgba(94,23,235,0.18)]" />
              <p className="mt-8 text-2xl font-semibold tracking-[-0.06em] text-white">{feature}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-500">Native infrastructure, tuned for fast booking decisions.</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AnimatedMetric({ value, suffix = "", label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      const start = performance.now();
      const animate = (now: number) => {
        const t = Math.min(1, (now - start) / 1200);
        const eased = 1 - Math.pow(1 - t, 4);
        setShown(Math.round(value * eased));
        if (t < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
      observer.disconnect();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="landing-reveal rounded-[2.5rem] border border-white/10 bg-[oklch(0.105_0.02_285)] p-2">
      <div className="rounded-[2rem] bg-black/45 p-7">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</p>
        <p className="mt-5 text-6xl font-semibold tracking-[-0.09em] text-white md:text-8xl">
          {suffix === "+" ? "+" : ""}{shown}{suffix !== "+" ? suffix : ""}
        </p>
      </div>
    </div>
  );
}

function Metrics() {
  return (
    <section id="metrics" className="mx-auto max-w-7xl px-4 py-28 md:px-8 md:py-36">
      <div className="landing-reveal flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <p className="landing-eyebrow">Performance Layer</p>
          <h2 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.96] tracking-[-0.075em] text-white md:text-7xl">
            Reads like a trading desk. Runs like booking infrastructure.
          </h2>
        </div>
        <p className="max-w-[34ch] text-lg leading-8 text-zinc-400">Live demand, conversion, and growth signals stay visible without turning the product into a spreadsheet.</p>
      </div>
      <div className="mt-16 grid gap-5 md:grid-cols-3">
        <AnimatedMetric value={94} suffix="%" label="Conversion" />
        <AnimatedMetric value={12} suffix="+" label="Net Growth" />
        <AnimatedMetric value={0} suffix="%" label="Commission" />
      </div>
    </section>
  );
}

function ZeroCommission() {
  return (
    <section className="relative overflow-hidden border-y border-white/8 py-28 md:py-44">
      <div className="landing-light-streak" aria-hidden />
      <div className="landing-reveal relative mx-auto max-w-6xl px-4 text-center md:px-8">
        <p className="landing-eyebrow justify-center">Zero Commission</p>
        <h2 className="mt-8 text-6xl font-semibold leading-[0.9] tracking-[-0.09em] text-white md:text-9xl">
          Keep 100% of what you earn.
        </h2>
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-zinc-400">
          ReZ is infrastructure, not a marketplace tax. Your clients, your brand, your revenue.
        </p>
      </div>
    </section>
  );
}

function Signup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="mx-auto max-w-5xl px-4 py-28 text-center md:px-8 md:py-36">
      <div className="landing-reveal">
        <p className="landing-eyebrow justify-center">Private beta</p>
        <h2 className="mt-6 text-5xl font-semibold leading-[0.96] tracking-[-0.075em] text-white md:text-7xl">
          Claim the next booking layer.
        </h2>
        <form
          className="mx-auto mt-12 flex max-w-2xl flex-col gap-3 rounded-[2rem] border border-white/10 bg-white/[0.05] p-2 shadow-[0_30px_110px_rgba(94,23,235,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] md:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            if (email) setSubmitted(true);
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="operator@studio.com"
            className="min-h-14 flex-1 rounded-[1.5rem] border border-white/10 bg-black/35 px-5 text-base text-white outline-none transition duration-700 placeholder:text-zinc-600 focus:border-[oklch(0.62_0.24_291)] focus:shadow-[0_0_44px_rgba(94,23,235,0.32)] [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]"
          />
          <button
            type="submit"
            className="landing-magnetic group inline-flex min-h-14 items-center justify-center gap-4 rounded-[1.5rem] bg-white px-5 pl-7 text-sm font-semibold text-zinc-950 transition duration-700 hover:bg-[oklch(0.94_0.04_291)] active:scale-[0.98] [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]"
          >
            {submitted ? "Request received" : "Request access"}
            <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-950 text-white transition duration-700 group-hover:translate-x-1 group-hover:-translate-y-0.5 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]">-&gt;</span>
          </button>
        </form>
      </div>
    </section>
  );
}

export function LandingExperience() {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [cursor, setCursor] = useState({ x: -100, y: -100 });

  const heroWords = useMemo(() => "Infrastructure for Creators. Booking, Simplified.".split(" "), []);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setProgress(Math.min(1, window.scrollY / max));
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    const onPointerMove = (event: PointerEvent) => setCursor({ x: event.clientX, y: event.clientY });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [reduced]);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".landing-reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.16 }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-premium relative min-h-[100dvh] overflow-x-hidden bg-[oklch(0.055_0.012_285)] text-white selection:bg-[oklch(0.62_0.24_291)] selection:text-white">
      <div className="landing-ambient" aria-hidden />
      <div className="landing-noise" aria-hidden />
      {!reduced && (
        <div
          className="landing-cursor"
          style={{ transform: `translate3d(${cursor.x - 110}px, ${cursor.y - 110}px, 0)` }}
          aria-hidden
        />
      )}
      <LandingNav />

      <main className="relative z-10">
        <section className="relative mx-auto grid min-h-[100dvh] max-w-7xl items-center gap-12 px-4 pb-24 pt-32 md:grid-cols-[0.92fr_1.08fr] md:px-8 md:pb-28 md:pt-40">
          <div className="landing-reveal is-visible">
            <p className="landing-eyebrow">Independent service infrastructure</p>
            <h1 className="mt-7 max-w-5xl text-6xl font-semibold leading-[0.88] tracking-[-0.09em] text-white sm:text-7xl md:text-8xl lg:text-[7.5rem]">
              {heroWords.map((word, index) => (
                <span key={`${word}-${index}`} className="landing-word inline-block" style={{ "--word-delay": `${index * 70}ms` } as CSSProperties}>
                  {word}&nbsp;
                </span>
              ))}
            </h1>
            <p className="mt-8 max-w-[44ch] text-lg leading-8 text-zinc-400 md:text-xl">
              One link turns DMs into verified slots, paid bookings, and synced calendars.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <MagneticLink href="/signup">Get started</MagneticLink>
              <MagneticLink href="/book?slug=demo" variant="secondary">View demo</MagneticLink>
            </div>
          </div>
          <HeroStack progress={progress} reduced={reduced} />
        </section>

        <ProblemSolution />
        <ProductFlow />
        <FeatureGrid />
        <Metrics />
        <ZeroCommission />
        <Signup />
      </main>

      <footer className="relative z-10 border-t border-white/8 px-4 py-10 text-xs text-zinc-600 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 md:flex-row">
          <p>(c) 2026 ReZ Infrastructure Inc.</p>
          <div className="flex gap-6">
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <a href="mailto:hello@rez.app" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
