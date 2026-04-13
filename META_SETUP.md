# Meta / Instagram DM Integration Setup

Everything you need to connect Rez to Instagram DMs.

---

## Prerequisites

- A **Facebook Page** (your business page)
- An **Instagram Business or Creator Account** connected to that Facebook Page
- Your Rez app deployed to a public HTTPS URL (or use ngrok for local dev)

---

## Step 1 — Create a Meta Developer App

1. Go to **https://developers.facebook.com/apps**
2. Click **Create App**
3. Select **Business** → click **Next**
4. Fill in:
   - App name: `Rez` (or anything)
   - App contact email: your email
   - Business account: select yours (or skip)
5. Click **Create App**

---

## Step 2 — Add the Instagram Product

1. From your app dashboard, click **Add Product**
2. Find **Instagram** → click **Set Up**
3. In the left sidebar you'll now see **Instagram** with sub-items

---

## Step 3 — Add Your Instagram Account

1. Go to **Instagram → API Setup with Instagram Login** (or "Basic Display" if you see it — pick the one for **business accounts**)
2. Under **Instagram Business Accounts**, click **Add Account**
3. Log in with the Instagram account that is connected to your Facebook Page
4. Grant all requested permissions

---

## Step 4 — Generate a Page Access Token

1. Go to **https://developers.facebook.com/tools/explorer**
2. In the top-right dropdown select your app
3. Click **Generate Access Token** → log in and accept permissions
4. In the **Permissions** section, make sure these are checked:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_manage_metadata`
   - `pages_read_engagement`
5. Click **Generate Access Token**
6. Copy the token — this is your **short-lived token**

### Convert to a Long-Lived Page Access Token

Short-lived tokens expire in ~1 hour. Run this in your terminal (replace values):

```bash
# 1. Exchange user token for long-lived user token (60 days)
curl -G "https://graph.facebook.com/v21.0/oauth/access_token" \
  --data-urlencode "grant_type=fb_exchange_token" \
  --data-urlencode "client_id=YOUR_APP_ID" \
  --data-urlencode "client_secret=YOUR_APP_SECRET" \
  --data-urlencode "fb_exchange_token=SHORT_LIVED_TOKEN"
# → copy the access_token from the response

# 2. Get your Page ID and Page Access Token
curl -G "https://graph.facebook.com/v21.0/me/accounts" \
  --data-urlencode "access_token=LONG_LIVED_USER_TOKEN"
# → find your page in the list, copy its "id" and "access_token"
```

The `access_token` from step 2 is a **never-expiring Page Access Token** (as long as the user doesn't revoke it).

Set this in your `.env.local`:

```env
META_PAGE_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxx...
```

---

## Step 5 — Get Your Instagram Page ID

The IG webhook identifies which business a DM is for via `ig_page_id`. This is the **numeric ID of your Instagram-connected Facebook Page** (same ID you got in Step 4, step 2 above).

Run:

```bash
curl -G "https://graph.facebook.com/v21.0/me" \
  --data-urlencode "fields=id,name,instagram_business_account" \
  --data-urlencode "access_token=YOUR_PAGE_ACCESS_TOKEN"
```

You'll get something like:

```json
{
  "id": "123456789012345",
  "name": "Your Business Name",
  "instagram_business_account": {
    "id": "987654321098765"
  }
}
```

The **top-level `id`** is your Facebook Page ID — this is what Meta sends as `entry[].id` in the webhook payload, so this is what goes in `ig_page_id`.

### Save it to Supabase

Run this SQL in your Supabase SQL Editor (replace both values):

```sql
update businesses
set ig_page_id = '123456789012345'
where slug = 'your-business-slug';
```

---

## Step 6 — Configure the Webhook

1. In your Meta app, go to **Instagram → Webhooks** (or **Webhooks** in the left sidebar)
2. Click **Add Callback URL**
3. Fill in:
   - **Callback URL**: `https://yourdomain.com/api/webhooks/instagram`
   - **Verify Token**: a secret string you choose, e.g. `rez_webhook_secret_2026`
4. Click **Verify and Save**

Meta will send a `GET` request to your URL with `hub.challenge`. Your route will echo it back if the verify token matches.

Set the same string in `.env.local`:

```env
META_WEBHOOK_VERIFY_TOKEN=rez_webhook_secret_2026
```

5. After saving, click **Add Subscriptions** on your webhook and enable:
   - `messages`
   - `messaging_postbacks` (optional — for quick reply buttons later)

---

## Step 7 — Subscribe Your Page to the App

```bash
curl -X POST "https://graph.facebook.com/v21.0/YOUR_PAGE_ID/subscribed_apps" \
  --data "subscribed_fields=messages" \
  --data "access_token=YOUR_PAGE_ACCESS_TOKEN"
```

You should get `{ "success": true }`.

---

## Step 8 — App Review (for going live)

While in **Development Mode**, your app can only DM users who are listed as testers/developers in the app.

To DM any Instagram user, you need to submit for **App Review**:

1. Go to **App Review → Permissions and Features**
2. Request:
   - `instagram_manage_messages`
   - `pages_manage_metadata`
3. Submit a screen recording showing the DM flow (Rez responding to a booking inquiry)
4. Meta reviews within ~5 business days

Until then, add test users at **Roles → Testers**.

---

## Step 9 — Local Development with ngrok

Meta webhooks require a public HTTPS URL. For local dev:

```bash
# Install ngrok (https://ngrok.com)
ngrok http 3000
# → copies a URL like https://abc123.ngrok-free.app
```

Use `https://abc123.ngrok-free.app/api/webhooks/instagram` as your callback URL.

Note: ngrok URL changes every session (unless you have a paid plan with a static domain). Update it in Meta each time.

---

## Final .env.local Checklist

```env
# Meta / Instagram
META_PAGE_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxx      # never-expiring page token
META_WEBHOOK_VERIFY_TOKEN=rez_webhook_secret_2026

# Make sure these are also set (needed by the IG booking flow)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
```

---

## How It Works End-to-End

```
User DMs your IG account
       ↓
Meta sends POST to /api/webhooks/instagram
       ↓
Rez looks up your business via ig_page_id
       ↓
Checks ig_threads for conversation history + paused flag
       ↓
[If image] → VIP: GPT-4o vision analyses inspo photo → price quote
       ↓
AI loop: check_availability → create_booking → Stripe deposit link
       ↓
Sends reply via Meta Graph API (POST /me/messages)
       ↓
Saves updated thread history to ig_threads table
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Webhook verification fails | Check `META_WEBHOOK_VERIFY_TOKEN` matches exactly |
| `No business found for page X` in logs | Run the SQL `update` in Step 5 with the correct page ID |
| DMs send but no reply | Check `META_PAGE_ACCESS_TOKEN` is valid; test with the Graph Explorer |
| "Only testers can receive messages" | App is in Dev Mode — add the user as a tester or submit for App Review |
| Token expired | Re-run the long-lived token exchange in Step 4 |
