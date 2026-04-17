import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { AuthForm } from "@/components/auth/auth-form";
import { SignInPage, type Testimonial } from "@/components/ui/sign-in";
import "../dashboard/dashboard-skins.css";

export const dynamic = "force-dynamic";

const testimonials: Testimonial[] = [
];

export default async function LoginPage() {
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
    <SignInPage
      title={
        <>
          Welcome back.
          <br />
          <span className="text-[var(--dash-accent)]">Keep your bookings moving.</span>
        </>
      }
      description="Log in to manage appointments, clients, services, and booking links from one workspace."
      heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
      testimonials={testimonials}
    >
      <div className="rounded-3xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-6 shadow-[var(--dash-shadow-card)] sm:p-8">
        <div className="mb-2 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-[400] tracking-tight text-[var(--dash-text)]">Log in</h2>
          <Link href="/" className="text-xs uppercase tracking-[0.12em] text-[var(--dash-muted)]">
            ReZ
          </Link>
        </div>
        <p className="text-sm leading-6 text-[var(--dash-text-secondary)]">
          Use the email and password connected to your ReZ workspace.
        </p>
        <AuthForm mode="login" />
      </div>
    </SignInPage>
  );
}
