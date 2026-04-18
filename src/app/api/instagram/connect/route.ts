/**
 * GET /api/instagram/connect
 * Initiates Meta OAuth — redirects the authenticated business owner to Facebook Login.
 * After approval, Meta redirects to /api/instagram/callback.
 *
 * On any failure we redirect back to /dashboard/settings with ?ig_error=…
 * (instead of returning JSON) so the user sees a friendly banner.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withBusiness } from "@/lib/server/auth";

export async function GET(request: Request) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const settingsUrl = `${appUrl}/dashboard/settings`;
  const fail = (code: string) =>
    NextResponse.redirect(`${settingsUrl}?ig_error=${code}`);

  try {
    return await withBusiness(request, async ({ businessId }) => {
      const appId = process.env.META_APP_ID;
      if (!appId) return fail("server_misconfigured");

      const nonce = crypto.randomUUID();
      const state = `${businessId}.${nonce}`;
      const redirectUri = `${appUrl}/api/instagram/callback`;

      const params = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        scope: [
          "instagram_basic",
          "instagram_manage_messages",
          "pages_show_list",
          "pages_read_engagement",
          "pages_manage_metadata",
          "pages_messaging",
        ].join(","),
        response_type: "code",
        state,
      });

      const cookieStore = await cookies();
      cookieStore.set("ig_oauth_nonce", nonce, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 600, // 10 min
        secure: process.env.NODE_ENV === "production",
      });

      return NextResponse.redirect(
        `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`
      );
    });
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 401) return fail("not_signed_in");
    if (status === 403) return fail("no_business");
    console.error("[/api/instagram/connect]", err);
    return fail("connect_failed");
  }
}
