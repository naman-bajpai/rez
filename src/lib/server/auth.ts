import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServiceRoleClient } from "./supabase";

export type AuthedContext = {
  userId: string;
  businessId: string;
};

/** Get the current Better Auth session from the incoming request headers */
async function getSession() {
  try {
    const hdrs = await headers();
    const session = await auth.api.getSession({ headers: hdrs });
    return session;
  } catch {
    return null;
  }
}

export async function withAuth<T>(
  _request: Request,
  handler: (ctx: { userId: string }) => Promise<T>
): Promise<T> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return handler({ userId: session.user.id });
}

export async function withBusiness<T>(
  request: Request,
  handler: (ctx: AuthedContext) => Promise<T>
): Promise<T> {
  if (
    process.env.ALLOW_LEGACY_BUSINESS_HEADER === "true" ||
    process.env.NODE_ENV === "development"
  ) {
    const devBusinessId = request.headers.get("x-business-id");
    if (devBusinessId) {
      return handler({ userId: "dev", businessId: devBusinessId });
    }
  }

  const session = await getSession();
  if (!session?.user?.id) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!profile?.business_id) {
    throw Object.assign(new Error("No business linked to this account"), { status: 403 });
  }

  return handler({ userId: session.user.id, businessId: profile.business_id as string });
}

export async function withAdmin<T>(
  _request: Request,
  handler: (ctx: { userId: string }) => Promise<T>
): Promise<T> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  return handler({ userId: session.user.id });
}

/** Helper to wrap route handlers and catch auth errors */
export function authRoute<T>(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  return fn().catch((err) => {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: err.message }, { status });
  });
}
