import { BackgroundPaths } from "@/components/ui/background-paths";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarCheck2, CreditCard, MessageCircle } from "lucide-react";
import Link from "next/link";
import "./dashboard/dashboard-skins.css";

const features = [
  {
    title: "Inbox to intent",
    copy: "Rez identifies service, price, and booking intent from DMs so you skip repetitive replies.",
    icon: MessageCircle,
  },
  {
    title: "Cleaner schedules",
    copy: "Only valid times are offered based on your availability and service rules.",
    icon: CalendarCheck2,
  },
  {
    title: "Deposit-first booking",
    copy: "Appointments are confirmed after checkout, reducing no-shows and last-minute churn.",
    icon: CreditCard,
  },
];

export default function HomePage() {
  return (
    <BackgroundPaths title="Background Paths">
      <main className="dash-root mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
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
        </header>

        <section className="mt-16 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--dash-muted)]">Instagram-first booking</p>
          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-[400] tracking-tight text-[var(--dash-text)] sm:text-6xl">
            Turn DMs into booked appointments before you even open the chat.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-[var(--dash-text-secondary)]">
            Rez helps independent operators automate booking conversations, collect deposits, and confirm
            clients with less back and forth.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
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
          </div>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow-card)]"
              >
                <Icon className="h-5 w-5 text-[var(--dash-accent)]" />
                <h2 className="mt-4 text-lg font-[400] text-[var(--dash-text)]">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--dash-text-secondary)]">{feature.copy}</p>
              </article>
            );
          })}
        </section>
      </main>
    </BackgroundPaths>
  );
}
