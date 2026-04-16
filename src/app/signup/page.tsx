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
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Nia Brooks",
    handle: "@niastudio",
    text: "Setup took minutes, and clients started booking from Instagram right away.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/49.jpg",
    name: "Omar Rivera",
    handle: "@omarfit",
    text: "The deposit flow made my weekly schedule dramatically more predictable.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/63.jpg",
    name: "Lena Park",
    handle: "@lenaartistry",
    text: "Finally, an inbox-first booking setup that feels simple and premium.",
  },
];

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
    <SignInPage
      title={
        <>
          Start with one link.
          <br />
          <span className="text-[var(--dash-accent)]">Build your booking desk.</span>
        </>
      }
      heroImageSrc="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=2160&q=80"
      testimonials={testimonials}
    >
      <div className="rounded-3xl border border-[var(--dash-border)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow-card)] sm:p-6">
        <div className="mb-1 flex items-center justify-between gap-4">
          <h2 className="text-xl font-[400] tracking-tight text-[var(--dash-text)]">Create account</h2>
          <Link href="/" className="text-xs uppercase tracking-[0.12em] text-[var(--dash-muted)]">
            ReZ
          </Link>
        </div>
        <p className="text-xs leading-5 text-[var(--dash-text-secondary)]">Passwords need at least 8 characters.</p>
        <div className="max-h-[62dvh] overflow-y-auto pr-1">
          <AuthForm mode="signup" />
        </div>
      </div>
    </SignInPage>
  );
}
