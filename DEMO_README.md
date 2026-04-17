# Rez Demo README (90 Seconds)

Use this script to demo Rez in **1 minute 30 seconds**.

## Goal

Show that Rez turns Instagram conversations into bookable, paid appointments with AI support.

## Pre-Demo Setup (2 minutes before presenting)

- Start app: `npm run dev`
- Open `http://localhost:3000`
- Keep these tabs ready:
  - Landing: `http://localhost:3000`
  - Dashboard: `http://localhost:3000/dashboard`
  - Inbox: `http://localhost:3000/dashboard/inbox`
- If needed for guest flow, keep one booking link ready:
  - `http://localhost:3000/book/<your-slug>?view=upcoming`

## 90-Second Run of Show

### 0:00-0:15 - Hook (Landing)

- "Rez is an Instagram-first booking assistant for service businesses."
- Point to feature card:
  - **Visual Quote Engine**
  - "Multimodal AI analyzes inspiration photos to instantly estimate complexity, duration, and price."

### 0:15-0:45 - Instagram Messages (Inbox)

- Go to: `/dashboard/inbox` and stay on **Instagram DMs** tab.
- Say:
  - "This is the live operator inbox."
  - "For demo reliability, we are currently showing seeded sample DMs."
- Click one thread and show:
  - AI/customer message history
  - Pause/Resume controls ("Take over" / "Resume Rez")
  - Manual reply while paused

### 0:45-1:10 - Ops View (Dashboard)

- Go to: `/dashboard`
- Call out:
  - Upcoming schedule
  - Revenue / confirmed / pending stats
  - Fast access to bookings and services

### 1:10-1:30 - Customer Outcome (Booking Link)

- Open: `/book/<your-slug>?view=upcoming`
- Say:
  - "After booking, customers are returned directly to their upcoming bookings view."
  - "This keeps post-booking actions simple: review, reschedule, or continue chat."

## 1-Line Closing

"Rez reduces DM back-and-forth, quotes faster from inspiration photos, and converts conversations into scheduled, paid appointments."

## Backup Plan (If Anything Fails Live)

- If API/integration glitches:
  - Stay in `/dashboard/inbox`
  - Use the seeded Instagram DM conversations
  - Demonstrate pause/resume + manual reply flow
- If customer route is unavailable:
  - Return to `/dashboard` and finish with operational value (stats + scheduling)
