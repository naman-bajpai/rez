import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function uniqueSlug(
  supabase: ReturnType<typeof createServiceRoleClient>,
  base: string
) {
  const root = base || "studio";
  for (let i = 0; i < 6; i++) {
    const candidate = i === 0 ? root : `${root}-${Math.random().toString(36).slice(2, 6)}`;
    const { data } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { businessName?: string; timezone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const businessName = (body.businessName ?? "").trim();
  const timezone = (body.timezone ?? "").trim();

  if (businessName.length < 2) {
    return NextResponse.json(
      { error: "Business name must be at least 2 characters." },
      { status: 400 }
    );
  }
  if (!timezone) {
    return NextResponse.json({ error: "Timezone is required." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("profiles")
    .select("id, business_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (profileLookupError) {
    return NextResponse.json(
      { error: `Could not read your profile: ${profileLookupError.message}` },
      { status: 500 }
    );
  }

  if (existingProfile?.business_id) {
    return NextResponse.json({ businessId: existingProfile.business_id });
  }

  const slug = await uniqueSlug(supabase, slugify(businessName));

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({
      name: businessName,
      slug,
      timezone,
      owner_name: session.user.name ?? null,
    })
    .select("id")
    .single();

  if (businessError || !business) {
    return NextResponse.json(
      { error: businessError?.message ?? "Failed to create business." },
      { status: 500 }
    );
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        business_id: business.id,
      },
      { onConflict: "user_id" }
    );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ businessId: business.id, slug });
}
