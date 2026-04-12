import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { AuthForm } from "@/components/auth/auth-form";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.id) {
    const supabase = createServiceRoleClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    redirect(profile?.business_id ? "/dashboard" : "/onboarding");
  }

  return (
    <main className="min-h-[100dvh] bg-[oklch(0.985_0.008_95)] px-4 py-6 text-zinc-950">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl flex-col">
        <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-950">
          ReZ
        </Link>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1fr_27rem]">
          <div className="max-w-2xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Start with one link
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">
              Build the booking desk your clients can use anytime.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600">
              Create your ReZ account, then set up services, availability, reminders, and checkout
              from the dashboard.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-[oklch(0.997_0.005_95)] p-6 shadow-[0_30px_90px_-60px_rgba(39,39,42,0.7)] sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Create account</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Passwords need at least 8 characters.
            </p>
            <AuthForm mode="signup" />
          </div>
        </section>
      </div>
    </main>
  );
}
