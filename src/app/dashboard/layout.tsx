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
      <div className="mx-auto grid min-h-[100dvh] w-full max-w-[1600px] gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
        <DashboardNav />
        <main className="min-w-0 px-4 pb-12 pt-4 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
