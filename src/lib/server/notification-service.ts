/**
 * Notification helpers — Instagram DM (Meta Graph API).
 * SMS is not implemented.
 */

export async function sendSms(_to: string, _body: string): Promise<void> {
  // SMS not implemented
}

/**
 * Send an Instagram DM via the Meta Graph API.
 * Pass `pageAccessToken` for per-business tokens (multi-tenant).
 * Falls back to the global META_PAGE_ACCESS_TOKEN env var.
 */
export async function sendInstagramDm(
  recipientId: string,
  message: string,
  pageAccessToken?: string
): Promise<void> {
  const token = pageAccessToken ?? process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) {
    console.warn("[sendInstagramDm] No page access token available — skipping send");
    return;
  }

  const res = await fetch("https://graph.facebook.com/v21.0/me/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
      messaging_type: "RESPONSE",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta Graph API error ${res.status}: ${body}`);
  }
}

/** Download a media URL from Instagram (requires page token as param) */
export async function fetchInstagramMediaUrl(
  mediaId: string,
  pageAccessToken?: string
): Promise<string | null> {
  const token = pageAccessToken ?? process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) return null;

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${mediaId}?fields=url&access_token=${token}`
  );
  if (!res.ok) return null;
  const data = await res.json() as { url?: string };
  return data.url ?? null;
}
