/**
 * GET /api/instagram/callback
 * Meta OAuth redirect handler.
 *
 * Flow:
 *   1. Verify state + nonce cookie (CSRF protection)
 *   2. Exchange short-lived code → long-lived User Access Token
 *   3. List user's Facebook Pages
 *   4. Find the page that has an Instagram Business Account connected
 *   5. Fetch the IG username for display
 *   6. Subscribe the page to the webhook (messages field)
 *   7. Persist ig_page_id, ig_page_access_token, ig_username to the business row
 *   8. Redirect back to /dashboard/settings
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/server/supabase";

type FbPage = {
  id: string;
  name: string;
  access_token: string;
};

type IgAccount = {
  id: string;
  username?: string;
};

export async function GET(request: Request) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const settingsUrl = `${appUrl}/dashboard/settings`;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const metaError = searchParams.get("error");

  // User denied
  if (metaError) {
    return NextResponse.redirect(`${settingsUrl}?ig_error=access_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}?ig_error=missing_params`);
  }

  // ── Parse and verify state ────────────────────────────────────────────────
  const dotIdx = state.lastIndexOf(".");
  if (dotIdx === -1) {
    return NextResponse.redirect(`${settingsUrl}?ig_error=invalid_state`);
  }
  const businessId = state.slice(0, dotIdx);
  const nonce = state.slice(dotIdx + 1);

  const cookieStore = await cookies();
  const storedNonce = cookieStore.get("ig_oauth_nonce")?.value;
  if (!storedNonce || storedNonce !== nonce) {
    return NextResponse.redirect(`${settingsUrl}?ig_error=state_mismatch`);
  }
  cookieStore.delete("ig_oauth_nonce");

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return NextResponse.redirect(`${settingsUrl}?ig_error=server_misconfigured`);
  }

  const redirectUri = `${appUrl}/api/instagram/callback`;

  // ── Exchange code for short-lived token ───────────────────────────────────
  const tokenParams = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });
  const tokenRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?${tokenParams.toString()}`
  );
  if (!tokenRes.ok) {
    console.error("[IG OAuth] Token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(`${settingsUrl}?ig_error=token_exchange_failed`);
  }
  const { access_token: shortLivedToken } = await tokenRes.json() as { access_token: string };

  // ── Extend to long-lived token ────────────────────────────────────────────
  const extendParams = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });
  const extendRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?${extendParams.toString()}`
  );
  if (!extendRes.ok) {
    console.error("[IG OAuth] Token extend failed:", await extendRes.text());
    return NextResponse.redirect(`${settingsUrl}?ig_error=token_extend_failed`);
  }
  const { access_token: longLivedToken } = await extendRes.json() as { access_token: string };

  // ── List user's Facebook Pages ────────────────────────────────────────────
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${longLivedToken}`
  );
  if (!pagesRes.ok) {
    console.error("[IG OAuth] Pages fetch failed:", await pagesRes.text());
    return NextResponse.redirect(`${settingsUrl}?ig_error=pages_fetch_failed`);
  }
  const pagesData = await pagesRes.json() as { data?: FbPage[] };
  const pages: FbPage[] = pagesData.data ?? [];

  if (!pages.length) {
    return NextResponse.redirect(`${settingsUrl}?ig_error=no_pages`);
  }

  // ── Find the page with an Instagram Business Account ──────────────────────
  let fbPageId: string | null = null;
  let pageAccessToken: string | null = null;
  let igAccount: IgAccount | null = null;

  for (const page of pages) {
    const igRes = await fetch(
      `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account{id,username}&access_token=${page.access_token}`
    );
    if (!igRes.ok) continue;
    const igData = await igRes.json() as { instagram_business_account?: IgAccount };
    if (igData.instagram_business_account?.id) {
      fbPageId = page.id;
      pageAccessToken = page.access_token;
      igAccount = igData.instagram_business_account;
      break;
    }
  }

  if (!fbPageId || !pageAccessToken || !igAccount) {
    return NextResponse.redirect(`${settingsUrl}?ig_error=no_ig_account`);
  }

  // ── Subscribe this page to the webhook (messages field) ───────────────────
  try {
    await fetch(
      `https://graph.facebook.com/v21.0/${fbPageId}/subscribed_apps`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscribed_fields: ["messages"],
          access_token: pageAccessToken,
        }),
      }
    );
  } catch (subErr) {
    // Non-fatal — the global app webhook subscription may already cover this
    console.warn("[IG OAuth] Webhook subscription failed:", subErr);
  }

  // ── Persist to DB ─────────────────────────────────────────────────────────
  const supabase = createServiceRoleClient();
  const { error: dbErr } = await supabase
    .from("businesses")
    .update({
      ig_page_id: fbPageId,
      ig_page_access_token: pageAccessToken,
      ig_username: igAccount.username ?? null,
    })
    .eq("id", businessId);

  if (dbErr) {
    console.error("[IG OAuth] DB update failed:", dbErr);
    return NextResponse.redirect(`${settingsUrl}?ig_error=db_failed`);
  }

  return NextResponse.redirect(`${settingsUrl}?ig_connected=1`);
}
