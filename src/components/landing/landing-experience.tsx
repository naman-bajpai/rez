import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Clock, CreditCard, MessageCircle, Sparkles } from "lucide-react";

const proofPoints = [
  "Captures booking details from DMs",
  "Collects deposits before the slot is held",
  "Sends reminders without another app",
];

const flowSteps = [
  {
    icon: MessageCircle,
    title: "DMs get sorted",
    copy: "Rez recognizes pricing, availability, and booking intent so the same questions stop eating the day.",
  },
  {
    icon: Clock,
    title: "Times stay clean",
    copy: "Clients see only the services and openings you actually want to offer.",
  },
  {
    icon: CreditCard,
    title: "Deposits lock it in",
    copy: "The slot is not real until checkout is done, which cuts down ghosting and last-minute backtracking.",
  },
];

export function LandingExperience() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[oklch(0.965_0.035_156)] text-[oklch(0.145_0.025_162)]">
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,oklch(0.99_0.018_156),transparent)]" />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" aria-label="Rez home">
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-[oklch(0.78_0.045_156)] bg-[oklch(0.995_0.008_156)]">
              <Image
                src="/images/logo.png"
                alt=""
                width={80}
                height={80}
                className="h-full w-full object-contain"
                priority
              />
            </span>
            <span className="text-lg font-semibold tracking-tight">ReZ</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[oklch(0.36_0.045_162)] md:flex">
            <a href="#flow" className="transition-colors hover:text-[oklch(0.145_0.025_162)]">
              Flow
            </a>
            <a href="#fit" className="transition-colors hover:text-[oklch(0.145_0.025_162)]">
              Who it is for
            </a>
            <Link href="/login" className="transition-colors hover:text-[oklch(0.145_0.025_162)]">
              Sign in
            </Link>
          </nav>

          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[oklch(0.19_0.035_162)] px-4 text-sm font-semibold text-[oklch(0.98_0.015_156)] shadow-[0_12px_30px_-18px_oklch(0.19_0.035_162)] transition hover:bg-[oklch(0.25_0.05_162)] active:scale-[0.98]"
          >
            Join the waitlist
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_31rem] lg:gap-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.75_0.06_156)] bg-[oklch(0.99_0.016_156)] px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[oklch(0.34_0.075_156)]">
              <Sparkles className="h-3.5 w-3.5" />
              Private waitlist
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight text-[oklch(0.13_0.028_162)] sm:text-6xl lg:text-7xl">
              Turn Instagram DMs into booked appointments before you answer.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[oklch(0.34_0.045_162)]">
              Rez is booking software for independent operators who live in the inbox:
              barbers, lash techs, trainers, stylists, tattoo artists, and anyone tired of
              repeating prices and chasing deposits.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[oklch(0.19_0.035_162)] px-6 text-sm font-semibold text-[oklch(0.98_0.015_156)] shadow-[0_18px_42px_-22px_oklch(0.19_0.035_162)] transition hover:bg-[oklch(0.25_0.05_162)] active:scale-[0.98]"
              >
                Join the waitlist
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#flow"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[oklch(0.72_0.05_156)] bg-[oklch(0.99_0.014_156)] px-6 text-sm font-semibold text-[oklch(0.21_0.04_162)] transition hover:border-[oklch(0.58_0.08_156)]"
              >
                See the flow
              </a>
            </div>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {proofPoints.map((point) => (
                <div key={point} className="flex items-start gap-2 text-sm leading-6 text-[oklch(0.32_0.045_162)]">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[oklch(0.52_0.16_148)]" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:pt-8" aria-label="Example Rez booking flow">
            <div className="absolute -left-8 top-10 hidden h-48 w-48 rounded-full border border-[oklch(0.69_0.07_156)] md:block" />
            <div className="relative rounded-lg border border-[oklch(0.72_0.055_156)] bg-[oklch(0.992_0.012_156)] p-4 shadow-[0_34px_90px_-60px_oklch(0.22_0.045_162)]">
              <div className="flex items-center justify-between border-b border-[oklch(0.84_0.025_156)] pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[oklch(0.46_0.07_156)]">
                    Inbox today
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">17 booking DMs</p>
                </div>
                <span className="rounded-full bg-[oklch(0.91_0.09_148)] px-3 py-1 text-xs font-bold text-[oklch(0.31_0.11_148)]">
                  Live
                </span>
              </div>

              <div className="space-y-3 py-4">
                <div className="rounded-lg bg-[oklch(0.955_0.025_156)] p-4">
                  <p className="text-sm font-semibold">maya_inked</p>
                  <p className="mt-1 text-sm leading-6 text-[oklch(0.39_0.045_162)]">
                    how much for a fine line piece this friday?
                  </p>
                </div>
                <div className="ml-8 rounded-lg bg-[oklch(0.21_0.04_162)] p-4 text-[oklch(0.98_0.015_156)]">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[oklch(0.78_0.09_148)]">
                    Rez reply
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    Fine line starts at $120. Friday has 2:30 or 5:00 open. Want me to hold
                    one with a $40 deposit?
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[oklch(0.83_0.03_156)] bg-[oklch(0.99_0.014_156)] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[oklch(0.49_0.06_156)]">
                      Held slot
                    </p>
                    <p className="mt-2 text-xl font-semibold">Fri 5:00</p>
                  </div>
                  <div className="rounded-lg border border-[oklch(0.83_0.03_156)] bg-[oklch(0.99_0.014_156)] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[oklch(0.49_0.06_156)]">
                      Deposit
                    </p>
                    <p className="mt-2 text-xl font-semibold">$40 paid</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-[oklch(0.9_0.105_28)] px-4 py-3 text-sm font-semibold text-[oklch(0.24_0.075_28)]">
                Booking confirmed. Reminder scheduled.
              </div>
            </div>
          </div>
        </section>

        <section id="flow" className="grid gap-4 border-t border-[oklch(0.78_0.045_156)] py-12 lg:grid-cols-3">
          {flowSteps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.title}
                className="rounded-lg border border-[oklch(0.76_0.045_156)] bg-[oklch(0.99_0.014_156)] p-5"
              >
                <Icon className="h-5 w-5 text-[oklch(0.48_0.14_148)]" />
                <h2 className="mt-5 text-xl font-semibold tracking-tight">{step.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[oklch(0.38_0.045_162)]">{step.copy}</p>
              </article>
            );
          })}
        </section>

        <section
          id="fit"
          className="mb-6 grid gap-6 rounded-lg bg-[oklch(0.18_0.035_162)] p-6 text-[oklch(0.98_0.015_156)] md:grid-cols-[1fr_auto] md:items-center md:p-8"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[oklch(0.78_0.09_148)]">
              Built for the busy inbox
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight">
              Best fit: 10+ booking DMs a week, fixed services, and clients who are ready
              to put down a deposit.
            </h2>
          </div>
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-[oklch(0.9_0.105_28)] px-6 text-sm font-bold text-[oklch(0.24_0.075_28)] transition hover:bg-[oklch(0.86_0.12_28)] active:scale-[0.98]"
          >
            Join the waitlist
          </Link>
        </section>
      </div>
    </main>
  );
}
