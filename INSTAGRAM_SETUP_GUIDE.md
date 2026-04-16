# 💅 Rez Instagram DM Integration: Complete Setup Guide

Follow these exact steps to connect your Rez "Autonomous DM Receptionist" to your Instagram Business account.

---

## 1. Meta Developer App Setup
1.  Go to [developers.facebook.com/apps](https://developers.facebook.com/apps).
2.  Click **Create App** → Select **Business** → Name it `Rez-IG`.
3.  In the left sidebar, click **Add Product** and find **Instagram** → Click **Set Up**.
4.  Go to **Instagram → API Setup with Instagram Login** (for Business/Creator accounts).

---

## 2. Roles & Permissions (Development Mode)
*Meta requires these steps before you can message any account while in "Development Mode".*

1.  In your Meta App dashboard, go to **App Roles → Roles**.
2.  Scroll to **Instagram Testers** → Click **Add Instagram Testers**.
3.  Type in the **exact Instagram username** of the account you want to use.
4.  **Accept the Invite:**
    - Log into that Instagram account on a computer.
    - Go to **Settings → Website permissions → Apps and Websites → Tester Invites**.
    - Click **Accept**.

---

## 3. Generate a Never-Expiring Page Access Token
1.  Go to the [Meta Graph Explorer](https://developers.facebook.com/tools/explorer).
2.  Select your App (**Rez-IG**) in the top right.
3.  In **User or Page**, select **Get Page Access Token**.
4.  **Add Permissions:**
    - `instagram_basic`
    - `instagram_manage_messages`
    - `pages_manage_metadata`
    - `pages_read_engagement`
5.  Click **Generate Access Token** and log in to select your Page.
6.  **Verify the Token:**
    - Click the blue **"i" icon** next to the token → **Open in Access Token Tool**.
    - Click **Extend Access Token** at the bottom to get a 60-day token.
    - *(Note: Page Access Tokens usually don't expire once extended).*

---

## 4. Local Development & Webhooks
1.  **Start your app locally:** `npm run dev`
2.  **Start ngrok:** `ngrok http 3000`
3.  **Update `.env.local`:**
    ```env
    META_PAGE_ACCESS_TOKEN=EAAM0V... (Your full token)
    META_WEBHOOK_VERIFY_TOKEN=rez_dev_2026 (Or your chosen secret)
    ```
4.  **Configure Webhook in Meta:**
    - Go to **Instagram → Webhooks** in your Meta App.
    - **Callback URL:** `https://your-ngrok-url.ngrok-free.app/api/webhooks/instagram`
    - **Verify Token:** `rez_dev_2026`
    - Click **Verify and Save**.
5.  **Add Subscriptions:** On the same page, click **Add Subscriptions** and check **`messages`** and **`messaging_postbacks`**.

---

## 5. Link to Supabase
Rez needs to know which business owns which Instagram Page.

1.  **Get your numeric Page ID:**
    - Run this in terminal: `curl -G "https://graph.facebook.com/v21.0/me?fields=id&access_token=YOUR_TOKEN"`
    - Or find it in the **Access Token Tool** from Step 3.
2.  **Update Database:**
    - Open your **Supabase SQL Editor** and run:
    ```sql
    UPDATE businesses 
    SET ig_page_id = '1234567890' -- Your numeric Page ID
    WHERE slug = 'nails'; -- Your business slug
    ```

---

## 6. Final Activation
Tell Meta to start sending messages to your app. Run this in your terminal:

```bash
curl -X POST "https://graph.facebook.com/v21.0/YOUR_PAGE_ID/subscribed_apps?subscribed_fields=messages&access_token=YOUR_PAGE_ACCESS_TOKEN"
```

---

## 🚀 Testing it Out
1.  Send a DM to your Instagram account from a **different** test account.
2.  Check your terminal/ngrok logs for activity.
3.  Rez should automatically reply using the AI booking engine!

---

## Troubleshooting
- **Error #100 (Nonexisting field):** Your Facebook Page is not fully linked to your Instagram account. Go to **Facebook Page Settings → Linked Accounts** to fix it.
- **No reply:** Ensure your `.env.local` has a valid `OPENAI_API_KEY` and `STRIPE_SECRET_KEY`, as the AI loop needs these to generate slots and payment links.
