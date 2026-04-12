import Link from "next/link";
import { Hero3DMock } from "@/components/landing/hero-3d-mock";
import { LandingNav } from "@/components/landing/landing-nav";

const easeOut = "[transition-timing-function:cubic-bezier(0.32,0.72,0,1)]";

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="text-[#fbfaf7]"
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

export default function HomePage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[oklch(0.985_0.008_95)] text-zinc-950">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[min(90vw,720px)] w-[min(90vw,720px)] -translate-x-1/2 rounded-full bg-violet-200/50 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-[40%] -right-32 h-96 w-96 rounded-full bg-teal-200/50 blur-[90px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-80 w-[120%] -translate-x-[10%] bg-gradient-to-t from-violet-100/60 to-transparent"
        aria-hidden
      />

      <LandingNav />

      <main className="relative z-10">
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-24 pt-28 md:grid-cols-12 md:items-center md:gap-8 md:px-6 md:pt-36 lg:pt-40">
          <div className="md:col-span-6 lg:col-span-5">
            <p
              className={`mb-6 inline-flex items-center rounded-full border border-zinc-200 bg-[oklch(0.995_0.006_95)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500 shadow-sm ${easeOut} animate-[fade-up_0.85s_cubic-bezier(0.32,0.72,0,1)_both]`}
            >
              Booking infrastructure
            </p>
            <h1
              className={`text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.03em] text-zinc-950 sm:text-5xl lg:text-[3.25rem] ${easeOut} animate-[fade-up_0.9s_cubic-bezier(0.32,0.72,0,1)_0.05s_both]`}
            >
              One link.
              <br />
              <span className="text-violet-700">
                Full calendar.
              </span>
            </h1>
            <p
              className={`mt-6 max-w-md text-base leading-relaxed text-zinc-600 sm:text-lg ${easeOut} animate-[fade-up_0.9s_cubic-bezier(0.32,0.72,0,1)_0.1s_both]`}
            >
              ReZ gives service businesses a branded booking page, secure guest checkout, and a
              dashboard that keeps every appointment, client, and payout in sync.
            </p>
            <div
              className={`mt-10 flex flex-col gap-3 sm:flex-row sm:items-center ${easeOut} animate-[fade-up_0.9s_cubic-bezier(0.32,0.72,0,1)_0.14s_both]`}
            >
              <Link
                href="/signup"
                className={`group inline-flex items-center justify-center gap-0.5 rounded-full bg-zinc-950 px-1 py-1 pl-6 text-sm font-medium text-[#fbfaf7] shadow-[0_20px_50px_-20px_rgba(39,39,42,0.55)] ${easeOut} transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]`}
              >
                Start free
                <span
                  className={`ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ${easeOut} transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px`}
                >
                  <ArrowIcon />
                </span>
              </Link>
              <Link
                href="/book?slug=demo"
                className={`inline-flex items-center justify-center rounded-full border border-zinc-200 bg-[oklch(0.995_0.006_95)] px-6 py-3 text-sm font-medium text-zinc-800 shadow-sm ${easeOut} transition-colors duration-300 hover:border-zinc-300 hover:bg-white`}
              >
                View live demo
              </Link>
            </div>
          </div>

          <div className="md:col-span-6 lg:col-span-7">
            <Hero3DMock />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-28 md:px-6">
          <div className="mb-12 max-w-xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Built for operators
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              Everything before the appointment — automated.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-12 md:gap-5 [perspective:1400px]">
            <div className="md:col-span-7 [transform-style:preserve-3d]">
              <div
                className={`h-full rounded-[2rem] border border-zinc-200 bg-white/80 p-2 shadow-[0_24px_70px_-48px_rgba(39,39,42,0.55)] ${easeOut} transition-[transform,box-shadow] duration-700 will-change-transform hover:[transform:rotateX(4deg)_rotateY(-6deg)_translateZ(12px)] hover:shadow-[0_40px_80px_-40px_rgba(139,92,246,0.25)]`}
              >
                <div className="flex h-full min-h-[280px] flex-col justify-between rounded-[calc(2rem-8px)] border border-zinc-200 bg-[oklch(0.997_0.005_95)] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-950">Guest-ready booking</h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600">
                      Email verification, slot search, and Stripe checkout on a page that matches
                      your brand slug — no extra logins for clients.
                    </p>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-2">
                    {["OTP gate", "Live slots", "Deposits"].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-zinc-200 bg-violet-50 px-3 py-1 text-xs text-violet-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:col-span-5 md:grid-rows-2 [transform-style:preserve-3d]">
              <div
                className={`rounded-[2rem] border border-zinc-200 bg-white/80 p-2 shadow-[0_24px_70px_-52px_rgba(39,39,42,0.55)] ${easeOut} transition-[transform,box-shadow] duration-700 will-change-transform hover:[transform:rotateX(3deg)_rotateY(8deg)_translateZ(16px)] hover:shadow-[0_32px_64px_-32px_rgba(20,184,166,0.22)]`}
              >
                <div className="h-full rounded-[calc(2rem-8px)] border border-zinc-200 bg-[oklch(0.997_0.005_95)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <h3 className="text-base font-semibold text-zinc-950">Owner dashboard</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Bookings, services, clients, and revenue in one place — with AI assist when you
                    need a second brain.
                  </p>
                </div>
              </div>
              <div
                className={`rounded-[2rem] border border-zinc-200 bg-white/80 p-2 shadow-[0_24px_70px_-52px_rgba(39,39,42,0.55)] ${easeOut} transition-[transform,box-shadow] duration-700 will-change-transform hover:[transform:rotateX(4deg)_rotateY(-5deg)_translateZ(14px)] hover:shadow-[0_32px_64px_-32px_rgba(167,139,250,0.28)]`}
              >
                <div className="h-full rounded-[calc(2rem-8px)] border border-zinc-200 bg-[oklch(0.997_0.005_95)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <h3 className="text-base font-semibold text-zinc-950">Channels that nudge</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    Email, SMS, and DMs — wired for reminders and replies so fewer slots go empty.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-32 md:px-6 [perspective:1600px]">
          <div
            className={`rounded-[2rem] border border-zinc-200 bg-gradient-to-r from-violet-100 via-white to-teal-100 p-2 shadow-[0_24px_70px_-50px_rgba(39,39,42,0.55)] ${easeOut} transition-[transform,box-shadow] duration-700 [transform-style:preserve-3d] hover:[transform:rotateX(2deg)_translateZ(8px)] hover:shadow-[0_50px_100px_-40px_rgba(139,92,246,0.24)]`}
          >
            <div className="flex flex-col items-start justify-between gap-8 rounded-[calc(2rem-8px)] border border-zinc-200 bg-[oklch(0.997_0.005_95)] px-8 py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] md:flex-row md:items-center md:px-12 md:py-14">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">
                  Ready when your calendar is.
                </h2>
                <p className="mt-3 max-w-lg text-sm text-zinc-600 md:text-base">
                  Open the dashboard to connect your business, or preview the guest flow with the
                  demo link first.
                </p>
              </div>
              <Link
                href="/signup"
                className={`group inline-flex shrink-0 items-center gap-0.5 rounded-full bg-zinc-950 px-1 py-1 pl-6 text-sm font-medium text-[#fbfaf7] ${easeOut} transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]`}
              >
                Open dashboard
                <span
                  className={`ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ${easeOut} transition-transform duration-300 group-hover:translate-x-0.5`}
                >
                  <ArrowIcon />
                </span>
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-zinc-200 px-4 py-10 md:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 text-sm text-zinc-500 sm:flex-row sm:items-center">
            <span className="font-semibold text-zinc-800">ReZ</span>
            <div className="flex flex-wrap gap-6">
              <Link href="/book?slug=demo" className="hover:text-zinc-900">
                Demo
              </Link>
              <Link href="/dashboard" className="hover:text-zinc-900">
                Dashboard
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
