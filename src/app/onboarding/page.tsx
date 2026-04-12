import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { OnboardingForm } from "./OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const supabase = createServiceRoleClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (profile?.business_id) redirect("/dashboard");

  const guessedTimezone =
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";

  return (
    <main className="min-h-[100dvh] bg-[oklch(0.985_0.008_95)] px-4 py-6 text-zinc-950">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl flex-col">
        <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-950">
          ReZ
        </Link>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1fr_30rem]">
          <div className="max-w-2xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Step 1 of 1
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">
              Name your studio. Lock your timezone.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600">
              We’ll use this on your booking page, confirmations, and reminders. You can refine
              every detail — services, availability, branding — from the dashboard.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-zinc-600">
              <li className="flex items-start gap-2">
                <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-zinc-950" />
                Your business name becomes the header of your booking page.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-zinc-950" />
                Timezone drives slots, reminders, and calendar invites.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-zinc-950" />
                Takes about 20 seconds.
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-[oklch(0.997_0.005_95)] p-6 shadow-[0_30px_90px_-60px_rgba(39,39,42,0.7)] sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Set up your workspace
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              You can change any of this later.
            </p>
            <OnboardingForm defaultTimezone={guessedTimezone} defaultName={session.user.name} />
          </div>
        </section>
      </div>
    </main>
  );
}
