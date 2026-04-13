# Instagram OAuth — Client Self-Connect Flow

How service providers connect their own Instagram account to Rez.

---

## The Problem with Manual Setup

The current `META_SETUP.md` approach requires you (the Rez operator) to manually grab tokens and run SQL for each client. That doesn't scale. This document covers the self-serve OAuth flow — the same pattern Buffer, Later, and every social tool uses.

---

## The Flow

```
Provider clicks "Connect Instagram" in their Rez dashboard
       ↓
Rez redirects them to Facebook Login (OAuth)
       ↓
Provider logs in, selects their Page, grants permissions
       ↓
Meta redirects back to /api/auth/instagram/callback?code=...
       ↓
Rez exchanges code → user token → long-lived page token
       ↓
Rez fetches their Pages + linked IG account IDs
       ↓
If they have multiple pages, show a picker ("Which account is this for?")
       ↓
Rez stores page_access_token + ig_page_id on their businesses row
       ↓
Webhook is now live — Rez starts handling their DMs automatically
```

---

## What Needs to Be Built

### Backend (2 routes)
- `GET /api/auth/instagram/connect` — builds the OAuth URL and redirects the provider to Facebook Login
- `GET /api/auth/instagram/callback` — exchanges the code, fetches their pages, saves token + page ID to Supabase

### Database
- `page_access_token text` column on `businesses` — token is currently a global env var, needs to be per-business
- `ig_page_id` is already there from the existing migration

### Frontend
- "Connect Instagram" button in dashboard settings / onboarding
- Page picker UI if the provider has multiple Facebook Pages linked to their account

### Webhook change
The webhook stays the same structurally — it just reads `page_access_token` from the `businesses` row instead of `process.env.META_PAGE_ACCESS_TOKEN`.

---

## OAuth Scope (Permissions to Request)

```
instagram_manage_messages
pages_manage_metadata
pages_read_engagement
instagram_basic
```

---

## OAuth URL Structure

```
https://www.facebook.com/v21.0/dialog/oauth
  ?client_id=YOUR_APP_ID
  &redirect_uri=https://yourdomain.com/api/auth/instagram/callback
  &scope=instagram_manage_messages,pages_manage_metadata,pages_read_engagement,instagram_basic
  &response_type=code
  &state=BUSINESS_ID  ← use this to know which business to update on callback
```

---

## Callback — Token Exchange Steps

```
1. POST https://graph.facebook.com/v21.0/oauth/access_token
   body: { client_id, client_secret, redirect_uri, code }
   → short-lived user token

2. GET https://graph.facebook.com/v21.0/oauth/access_token
   params: { grant_type: fb_exchange_token, client_id, client_secret, fb_exchange_token }
   → long-lived user token (60 days)

3. GET https://graph.facebook.com/v21.0/me/accounts
   params: { access_token: long_lived_user_token }
   → list of Pages + their never-expiring Page access tokens

4. For each Page, GET https://graph.facebook.com/v21.0/{page_id}
   params: { fields: instagram_business_account, access_token: page_token }
   → get the linked Instagram Business Account ID

5. Save to businesses row:
   - ig_page_id      = page.id
   - page_access_token = page.access_token  ← this one never expires
```

---

## Database Migration

```sql
alter table businesses
  add column if not exists page_access_token text;
```

---

## The App Review Catch

Until Meta approves your app, only accounts listed as **Testers** in your Meta Developer App can complete the OAuth flow.

**To go live with any provider:**

1. Go to **App Review → Permissions and Features** in Meta Developer portal
2. Request:
   - `instagram_manage_messages`
   - `pages_manage_metadata`
3. Submit a screen recording showing: connect flow → DM received → Rez replies → booking created
4. Meta reviews in ~5 business days

**While waiting for review:**
- Add early clients as testers at **Roles → Testers** in your Meta app
- They can connect and use Rez fully — just can't receive DMs from the general public yet

---

## Environment Variables Needed

```env
# Meta OAuth credentials (from your Meta Developer App)
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret

# Webhook (same as before — one global verify token is fine)
META_WEBHOOK_VERIFY_TOKEN=rez_webhook_secret_2026
```

Note: `META_PAGE_ACCESS_TOKEN` becomes **per-business** (stored in Supabase) — no longer a global env var.
