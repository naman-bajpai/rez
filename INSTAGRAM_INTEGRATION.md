# Instagram DM Integration — Current State & Path Forward

## What's Working

### OAuth Self-Connect Flow
Providers click **Connect Instagram** in their dashboard settings. This triggers a full Facebook OAuth flow:

```
/dashboard/settings → "Connect Instagram"
  → GET /api/instagram/connect   (builds OAuth URL, sets nonce cookie, redirects)
  → facebook.com/v21.0/dialog/oauth  (provider logs in, grants permissions)
  → GET /api/instagram/callback  (exchanges code → long-lived page token, saves to businesses row)
  → /dashboard/settings?ig_connected=1
```

Scopes requested: `instagram_basic`, `instagram_manage_messages`, `pages_show_list`, `pages_read_engagement`, `pages_manage_metadata`, `pages_messaging`

Token stored per-business in `businesses.page_access_token` (not a global env var).

### Webhook & AI DM Handling
Once connected, the webhook at `POST /api/webhooks/instagram` handles all inbound DMs:

```
User DMs → Meta webhook → look up business via ig_page_id
  → fetch ig_threads history
  → GPT-4o: check_availability → create_booking → Stripe deposit link
  → reply via Graph API POST /me/messages
  → save updated thread to ig_threads
```

### Status & Disconnect
- `GET /api/instagram/status` — returns `{ connected, ig_page_id, ig_username }`
- `POST /api/instagram/disconnect` — revokes token, clears businesses row

---

## The Core Remaining Issue: Meta App Review

**The problem**: The Meta app is in **Development Mode**. In this mode, the webhook only fires for DMs from accounts added as Testers in the Meta Developer portal. Regular users get no response from Rez.

This means: the OAuth connection works, tokens are stored correctly, the AI handles DMs correctly — but only tester accounts can trigger it.

### Current workaround
Add early clients as Testers manually:
1. Meta Developer Portal → **App Roles → Roles → Instagram Testers**
2. Add the client's Instagram username
3. They accept the invite via **Instagram Settings → Website permissions → Apps and Websites → Tester Invites**

### Path to Full Production: Meta App Review

To lift the tester restriction and allow any Instagram user to trigger Rez:

**Step 1 — Submit App Review**
- Go to Meta Developer Portal → **App Review → Permissions and Features**
- Request:
  - `instagram_manage_messages` — to read and send DMs
  - `pages_manage_metadata` — to subscribe the page to the app

**Step 2 — Record a screen walkthrough** showing the complete flow:
1. A user sends a DM to the business's Instagram account
2. Rez receives the webhook and replies with availability
3. The user selects a time
4. Rez creates a booking and sends a Stripe payment link
5. The booking appears in the Rez dashboard

**Step 3 — Submit & wait** (~5 business days review time)

**Step 4 — After approval**, set the app to **Live Mode** in Meta Developer Portal. At this point, any Instagram user can interact with Rez via DM.

---

## Environment Variables Required

```env
# Required for OAuth connect/callback
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret

# Required for webhook verification
META_WEBHOOK_VERIFY_TOKEN=rez_webhook_secret_2026

# page_access_token is now per-business in Supabase (businesses.page_access_token)
# No longer a global env var
```

---

## Database Columns on `businesses`

| Column | Purpose |
|---|---|
| `ig_page_id` | Facebook Page ID — used to route incoming webhooks to the right business |
| `page_access_token` | Never-expiring Page Access Token — used to send replies via Graph API |
| `ig_username` | Display name shown in dashboard settings |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Webhook fires but no reply | Check `page_access_token` in businesses row is valid |
| `No business found for page X` in logs | The `ig_page_id` in businesses doesn't match what Meta is sending — re-connect via OAuth |
| DMs from testers work, others don't | App is in Dev Mode — submit for App Review or add more testers |
| OAuth callback error `no_pages` | Provider's Facebook account has no Pages — they need an IG Business account linked to a Facebook Page |
| OAuth callback error `no_ig_account` | Their Page exists but Instagram isn't linked — fix in Facebook Page Settings → Linked Accounts |
| Token expired | Re-connect via OAuth (page tokens shouldn't expire but can be revoked) |
