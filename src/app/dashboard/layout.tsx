import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const supabase = createServiceRoleClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!profile?.business_id) redirect("/onboarding");

  return (
    <div className="min-h-[100dvh] bg-[oklch(0.985_0.008_95)] text-zinc-950">
      <DashboardNav />
      <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
