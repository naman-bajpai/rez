/**
 * GET /api/instagram/connect
 * Initiates Meta OAuth — redirects the authenticated business owner to Facebook Login.
 * After approval, Meta redirects to /api/instagram/callback.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withBusiness } from "@/lib/server/auth";

export async function GET(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const appId = process.env.META_APP_ID;
      if (!appId) {
        return NextResponse.json({ error: "META_APP_ID not configured" }, { status: 500 });
      }

      const nonce = crypto.randomUUID();
      const state = `${businessId}.${nonce}`;

      const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
      const redirectUri = `${appUrl}/api/instagram/callback`;

      const params = new URLSearchParams({
        client_id: appId,
        redirect_uri: redirectUri,
        scope: [
          "instagram_manage_messages",
          "pages_messaging",
          "pages_show_list",
          "pages_read_engagement",
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
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
