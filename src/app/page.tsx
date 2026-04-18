"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  ArrowRight,
  CalendarCheck2,
  Camera,
  Check,
  CreditCard,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { Button } from "@/components/ui/button";
import "./dashboard/dashboard-skins.css";

const features = [
  {
    title: "Visual Quote Engine",
    copy: "Multimodal AI reads inspiration photos to estimate complexity, duration, and price in seconds.",
    icon: Sparkles,
  },
  {
    title: "Cleaner schedules",
    copy: "Only valid times are offered, based on your availability and per-service rules.",
    icon: CalendarCheck2,
  },
  {
    title: "Deposit-first booking",
    copy: "Slots lock after Stripe checkout, so no-shows and last-minute churn quietly disappear.",
    icon: CreditCard,
  },
];

const HEADLINE = "Turn DMs into booked appointments before you even open the chat.";

function useTilt(strength = 8) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 22, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 220, damping: 22, mass: 0.5 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [strength, -strength]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-strength, strength]);

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((event.clientX - rect.left) / rect.width - 0.5);
    y.set((event.clientY - rect.top) / rect.height - 0.5);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { ref, onMove, onLeave, rotateX, rotateY };
}

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  const { ref, onMove, onLeave, rotateX, rotateY } = useTilt(7);
  const Icon = feature.icon;

  return (
    <motion.article
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 1200,
      }}
      className="group relative rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow-card)]"
    >
      <motion.div
        style={{ transform: "translateZ(40px)" }}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--dash-accent-soft)] text-[var(--dash-accent)] ring-1 ring-[var(--rez-glow-dim,rgba(124,58,237,0.12))]"
      >
        <Icon className="h-5 w-5" />
      </motion.div>
      <motion.h3
        style={{ transform: "translateZ(28px)" }}
        className="mt-5 text-lg font-[400] text-[var(--dash-text)]"
      >
        {feature.title}
      </motion.h3>
      <motion.p
        style={{ transform: "translateZ(14px)" }}
        className="mt-2 text-sm leading-6 text-[var(--dash-text-secondary)]"
      >
        {feature.copy}
      </motion.p>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: "0 30px 60px -30px rgba(124, 58, 237, 0.35)" }}
      />
    </motion.article>
  );
}

function FloatingMockup({ scrollY }: { scrollY: MotionValue<number> }) {
  const { ref, onMove, onLeave, rotateX, rotateY } = useTilt(6);
  const yLift = useTransform(scrollY, [0, 600], [0, -90]);
  const scale = useTransform(scrollY, [0, 600], [1, 0.96]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ y: yLift, scale }}
      className="relative mx-auto mt-20 max-w-4xl"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-12 -inset-y-10 rounded-[48px] bg-gradient-to-b from-[#7C3AED]/25 via-[#7C3AED]/5 to-transparent blur-3xl"
      />

      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          transformPerspective: 1400,
        }}
        className="relative rounded-3xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[0_40px_100px_-40px_rgba(124,58,237,0.35)] sm:p-6"
      >
        <div className="flex items-center gap-3 border-b border-[var(--dash-divider)] pb-4">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FECACA]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FDE68A]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#BBF7D0]" />
          </div>
          <div className="ml-1 flex items-center gap-1.5 text-xs text-[var(--dash-muted)]">
            <Camera className="h-3.5 w-3.5" />
            <span>@your.studio · DM from Maya R.</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--dash-accent)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--dash-accent)]" />
            Rez handling
          </div>
        </div>

        <div className="grid gap-5 pt-5 lg:grid-cols-[1.15fr_1fr]">
          <div className="space-y-3" style={{ transform: "translateZ(40px)" }}>
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="max-w-[88%] rounded-2xl rounded-tl-md border border-[var(--dash-border)] bg-[var(--dash-surface-muted)] px-4 py-2.5 text-sm text-[var(--dash-text)]"
            >
              hey — got space saturday for almond shape set? here&rsquo;s a ref
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="ml-2 h-28 w-36 overflow-hidden rounded-xl border border-[var(--dash-border)] bg-gradient-to-br from-[#F5F3FF] via-[#E9D5FF] to-[#DDD6FE]"
            >
              <div className="flex h-full items-end justify-end p-2 text-[9px] uppercase tracking-[0.15em] text-[var(--dash-accent)]/70">
                ref · nails
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.85, duration: 0.5 }}
              className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md border border-[var(--rez-glow-dim,rgba(124,58,237,0.18))] bg-[var(--dash-accent-soft)] px-4 py-2.5 text-sm text-[var(--dash-text)]"
            >
              love it — almond gel + chrome reads ~45 min, $85. saturday 2pm or 4pm. $25 deposit locks it in
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.15, duration: 0.6 }}
            style={{ transform: "translateZ(70px)" }}
            className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface-muted)] p-4 shadow-[0_18px_44px_-28px_rgba(124,58,237,0.4)]"
          >
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              Auto-drafted booking
            </div>
            <div className="mt-2 text-base font-[400] text-[var(--dash-text)]">
              Almond Gel · Chrome
            </div>
            <div className="mt-3 space-y-2 text-sm text-[var(--dash-text-secondary)]">
              <div className="flex items-center justify-between">
                <span>Maya R.</span>
                <span className="text-[var(--dash-muted)]">new client</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sat, Apr 19 · 2:00 PM</span>
                <span>45 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Deposit</span>
                <span className="font-[400] text-[var(--dash-text)]">$25</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--dash-accent-soft)] px-3 py-2 text-xs text-[var(--dash-accent)]">
              <Check className="h-3.5 w-3.5" />
              <span>Confirms after Stripe checkout</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HomePage() {
  const { scrollY } = useScroll();
  const eyebrowY = useTransform(scrollY, [0, 400], [0, -32]);
  const titleY = useTransform(scrollY, [0, 400], [0, -56]);
  const subY = useTransform(scrollY, [0, 400], [0, -28]);

  return (
    <BackgroundPaths title="Background Paths">
      <main className="dash-root mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-8 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between"
        >
          <p className="text-sm font-[400] text-[var(--dash-text-secondary)]">Rez</p>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text-secondary)] hover:bg-[var(--dash-surface-muted)] hover:text-[var(--dash-text)]"
            >
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              className="rounded-xl bg-[var(--dash-accent)] px-5 text-[var(--dash-accent-fg)] hover:bg-[var(--dash-accent-hover)]"
            >
              <Link href="/signup">
                Join waitlist
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.header>

        <section
          className="mt-20 text-center"
          style={{ perspective: 1200 }}
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            style={{ y: eyebrowY }}
            className="text-xs uppercase tracking-[0.2em] text-[var(--dash-muted)]"
          >
            Instagram-first booking
          </motion.p>

          <motion.h1
            style={{ y: titleY }}
            className="mx-auto mt-4 max-w-4xl text-4xl font-[400] leading-[1.05] tracking-tight text-[var(--dash-text)] sm:text-6xl"
          >
            {HEADLINE.split(" ").map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                initial={{ opacity: 0, y: 36, rotateX: -50 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  delay: 0.25 + i * 0.045,
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  display: "inline-block",
                  marginRight: "0.28em",
                  transformOrigin: "50% 100%",
                  transformStyle: "preserve-3d",
                }}
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            style={{ y: subY }}
            className="mx-auto mt-6 max-w-2xl text-base text-[var(--dash-text-secondary)]"
          >
            Rez helps independent operators automate booking conversations, collect deposits, and
            confirm clients with less back and forth.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.6 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <Button
              asChild
              size="lg"
              className="rounded-xl bg-[var(--dash-accent)] text-[var(--dash-accent-fg)] hover:bg-[var(--dash-accent-hover)]"
            >
              <Link href="/signup">Get early access</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-xl border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] hover:bg-[var(--dash-surface-muted)]"
            >
              <Link href="/dashboard">View product</Link>
            </Button>
          </motion.div>
        </section>

        <FloatingMockup scrollY={scrollY} />

        <section className="mt-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--dash-muted)]">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-[400] tracking-tight text-[var(--dash-text)] sm:text-4xl">
              Three systems, one conversation.
            </h2>
          </motion.div>

          <div
            className="mt-12 grid gap-5 md:grid-cols-3"
            style={{ perspective: 1400 }}
          >
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </section>
      </main>
    </BackgroundPaths>
  );
}
