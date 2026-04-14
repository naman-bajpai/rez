import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { redirect } from "next/navigation";
import { ShareLinkPanel } from "@/components/dashboard/ShareLinkPanel";

export default async function SharePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const supabase = createServiceRoleClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!profile?.business_id) redirect("/onboarding");

  const { data: business } = await supabase
    .from("businesses")
    .select("slug, name")
    .eq("id", profile.business_id)
    .maybeSingle();

  return <ShareLinkPanel slug={business?.slug ?? ""} name={business?.name ?? ""} />;
}
