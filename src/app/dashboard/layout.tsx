import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { DashboardSkinProvider } from "@/components/dashboard/dashboard-skin-context";
import "./dashboard-skins.css";

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
    <DashboardSkinProvider>
      <div className="dash-shell">
        <div className="dash-mesh" aria-hidden />
        <div className="relative mx-auto grid min-h-[100dvh] w-full max-w-[1600px] gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
          <DashboardNav />
          <main className="dash-main min-w-0 px-4 pb-12 pt-4 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </DashboardSkinProvider>
  );
}
