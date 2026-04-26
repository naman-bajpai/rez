import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { AuthForm } from "@/components/auth/auth-form";
import { SignInPage } from "@/components/ui/sign-in";
import "../dashboard/dashboard-skins.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create account | ReZ",
  description: "Create a ReZ account and start turning client messages into booked appointments.",
};

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
      eyebrow={null}
      title={null}
      description={null}
    >
      <div className="rounded-lg border border-[#d9dfdb] bg-white p-5 shadow-[0_24px_80px_-52px_rgba(8,28,22,0.48)] sm:p-6">
        <div className="mb-1 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-[400] text-[#17211d]">Create account</h2>
          <Link href="/" className="text-sm text-[#66716c] transition hover:text-[#2f6f61]">
            Home
          </Link>
        </div>
        <p className="text-sm leading-6 text-[#5c6862]">Passwords need at least 8 characters.</p>
        <AuthForm mode="signup" />
      </div>
    </SignInPage>
  );
}
