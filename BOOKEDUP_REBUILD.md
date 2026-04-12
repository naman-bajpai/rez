# ReZ — Rebuild from Scratch

AI-powered booking platform for service businesses (nail/lash studios, salons, etc.).  
Stack: **Next.js 14 App Router · Supabase · OpenAI GPT-4o · Stripe · Twilio · Better Auth**

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Environment Variables](#2-environment-variables)
3. [Database Schema (SQL)](#3-database-schema-sql)
4. [Row Level Security](#4-row-level-security)
5. [Project Structure](#5-project-structure)
6. [Auth Setup (Better Auth)](#6-auth-setup-better-auth)
7. [API Routes Reference](#7-api-routes-reference)
8. [AI Prompts](#8-ai-prompts)
9. [AI Tool Definitions](#9-ai-tool-definitions)
10. [Guest Booking Flow](#10-guest-booking-flow)
11. [Notification Messages](#11-notification-messages)
12. [Stripe Integration](#12-stripe-integration)
13. [Build & Run](#13-build--run)

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Better Auth (cookie-based sessions) |
| AI | OpenAI GPT-4o via function calling |
| Payments | Stripe Checkout |
| SMS | Twilio |
| Instagram DM | Meta Graph API |
| Background jobs | BullMQ + Redis |
| Email (OTP) | Resend (or Nodemailer) |
| Styling | Tailwind CSS |

---

## 2. Environment Variables

Create `.env.local` at the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Better Auth
BETTER_AUTH_SECRET=your-random-32-char-secret
BETTER_AUTH_URL=http://localhost:3000
# Comma-separated emails that get is_admin=true automatically
ADMIN_EMAILS=you@example.com

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Meta / Instagram
META_PAGE_ACCESS_TOKEN=...

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Redis (BullMQ background jobs)
REDIS_URL=redis://localhost:6379

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Dev only — skip auth with X-Business-ID header (never true in prod)
ALLOW_LEGACY_BUSINESS_HEADER=false
```

---

## 3. Database Schema (SQL)

Run these migrations **in order** in Supabase SQL Editor or via `supabase db push`.

### 3.1 Enable UUID extension

```sql
create extension if not exists "pgcrypto";
```

### 3.2 businesses

```sql
create table businesses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  owner_name  text,
  timezone    text not null default 'America/New_York',
  external_booking_url text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index on businesses (slug);
```

### 3.3 profiles

Linked 1-to-1 with Better Auth users. Create a profile row automatically via a trigger on the auth users table, or via your onboarding route.

```sql
create table profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null unique,   -- Better Auth user.id (string)
  email        text,
  name         text,
  picture_url  text,
  is_admin     boolean not null default false,
  business_id  uuid references businesses (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index on profiles (user_id);
create index on profiles (business_id);
```

### 3.4 services

```sql
create table services (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses (id) on delete cascade,
  name          text not null,
  duration_mins integer not null check (duration_mins > 0),
  price         numeric(10, 2) not null default 0,
  add_ons       jsonb not null default '[]',
  -- add_ons shape: [{ name, price, duration_mins }]
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index on services (business_id);
create index on services (business_id, is_active);
```

### 3.5 clients

```sql
create table clients (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid not null references businesses (id) on delete cascade,
  name                  text not null,
  phone                 text,
  email                 text,
  instagram_id          text,
  notes                 text,
  avg_spend             numeric(10, 2),
  last_booked_at        timestamptz,
  typical_frequency_days integer,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index on clients (business_id);
create index on clients (business_id, email);
create index on clients (business_id, phone);
```

### 3.6 availability

Weekly schedule — one row per active day per business.

```sql
create table availability (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses (id) on delete cascade,
  day_of_week  integer not null check (day_of_week between 0 and 6),
  -- 0 = Sunday, 1 = Monday … 6 = Saturday
  start_time   text not null,  -- "HH:MM" e.g. "09:00"
  end_time     text not null,  -- "HH:MM" e.g. "17:00"
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create unique index on availability (business_id, day_of_week);
create index on availability (business_id, is_active);
```

### 3.7 bookings

```sql
create table bookings (
  id                        uuid primary key default gen_random_uuid(),
  business_id               uuid not null references businesses (id) on delete cascade,
  client_id                 uuid references clients (id) on delete set null,
  service_id                uuid references services (id) on delete set null,
  starts_at                 timestamptz not null,
  ends_at                   timestamptz not null,
  status                    text not null default 'pending'
                              check (status in ('pending','confirmed','cancelled','expired','no_show')),
  payment_status            text not null default 'unpaid'
                              check (payment_status in ('unpaid','paid','refunded')),
  add_ons                   jsonb not null default '[]',
  total_price               numeric(10, 2) not null default 0,
  source_channel            text not null default 'web'
                              check (source_channel in ('web','web_chat','sms','instagram')),
  stripe_checkout_session_id text,
  guest_email               text,
  guest_name                text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index on bookings (business_id, starts_at);
create index on bookings (business_id, status);
create index on bookings (client_id);

-- Prevent double-booking: same business cannot have two bookings starting at the same time
create unique index bookings_no_double_book
  on bookings (business_id, starts_at)
  where status in ('pending', 'confirmed');
```

### 3.8 guest_otps

Email OTP codes for the public booking flow.

```sql
create table guest_otps (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  business_id uuid not null references businesses (id) on delete cascade,
  code        text not null,
  expires_at  timestamptz not null,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index on guest_otps (email, business_id, used);
```

### 3.9 guest_sessions

Authenticated sessions for guests after OTP verification.

```sql
create table guest_sessions (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  email       text not null,
  name        text not null,
  business_id uuid not null references businesses (id) on delete cascade,
  expires_at  timestamptz not null default (now() + interval '30 days'),
  created_at  timestamptz not null default now()
);

create index on guest_sessions (token);
create index on guest_sessions (email, business_id);
```

### 3.10 booking_reminders

Tracks which reminders have been enqueued (idempotency).

```sql
create table booking_reminders (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid not null references bookings (id) on delete cascade,
  reminder_type  text not null check (reminder_type in ('24h', '2h')),
  status         text not null default 'scheduled'
                   check (status in ('scheduled', 'sent', 'failed')),
  scheduled_for  timestamptz not null,
  bullmq_job_id  text,
  created_at     timestamptz not null default now(),

  unique (booking_id, reminder_type)
);

create index on booking_reminders (booking_id);
```

### 3.11 Useful helper function — updated_at trigger

Apply this to every table that has an `updated_at` column.

```sql
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_businesses_updated_at
  before update on businesses
  for each row execute function set_updated_at();

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger trg_services_updated_at
  before update on services
  for each row execute function set_updated_at();

create trigger trg_clients_updated_at
  before update on clients
  for each row execute function set_updated_at();

create trigger trg_bookings_updated_at
  before update on bookings
  for each row execute function set_updated_at();
```

---

## 4. Row Level Security

Enable RLS and add policies so the service-role key (used server-side) bypasses all policies, while the anon key is blocked.

```sql
-- Enable RLS on every table
alter table businesses        enable row level security;
alter table profiles          enable row level security;
alter table services          enable row level security;
alter table clients           enable row level security;
alter table availability      enable row level security;
alter table bookings          enable row level security;
alter table guest_otps        enable row level security;
alter table guest_sessions    enable row level security;
alter table booking_reminders enable row level security;

-- The server uses the service_role key which bypasses RLS.
-- Block anon / authenticated roles unless you need specific policies.
-- Example: allow public read on businesses for the booking page
create policy "public can read businesses"
  on businesses for select
  using (true);

create policy "public can read active services"
  on services for select
  using (is_active = true);
```

> All writes go through API routes using the service-role key, so no additional write policies are needed unless you use Supabase client-side writes.

---

## 5. Project Structure

```
src/
  app/
    api/
      auth/[...all]/         # Better Auth handler
      onboarding/creator/    # POST — create business + link profile
      book/[slug]/
        route.ts             # GET — public business + services
        auth/route.ts        # POST — send OTP email
        verify/route.ts      # POST — verify OTP, return session token
        booking/route.ts     # POST — create booking + Stripe checkout
        booking/[id]/route.ts
        my-bookings/route.ts
        my-bookings/[id]/route.ts
        slots/route.ts
      bookings/
        route.ts             # GET — list bookings (dashboard)
        [id]/route.ts        # PATCH — status transitions
      services/
        route.ts             # GET, POST
        [id]/route.ts        # PATCH, DELETE
      clients/
        route.ts             # GET
        [id]/route.ts        # GET, PATCH
      availability/
        route.ts             # GET slots, PUT schedule
      analytics/route.ts     # GET — revenue + stats
      dashboard-ai/route.ts  # POST — owner AI assistant
      chat/route.ts          # POST — public booking chat
      webhooks/
        stripe/route.ts      # POST — payment confirmed/expired
        twilio/route.ts      # POST — inbound SMS
        instagram/route.ts   # POST — inbound IG DM
    book/
      page.tsx               # Redirect helper (requires ?slug=)
      [slug]/page.tsx        # Full guest booking UI
      [slug]/success/page.tsx
    dashboard/               # Owner dashboard pages
  lib/
    auth.ts                  # Better Auth instance
    server/
      supabase.ts            # Service-role Supabase client
      auth.ts                # withBusiness / withAuth / withAdmin wrappers
      guest-auth.ts          # OTP helpers, session validation, slugify
      booking-engine.ts      # checkAvailability, createBooking, transitions
      notification-service.ts # SMS + Instagram DM helpers
      reminder-scheduler.ts  # Enqueue 24h/2h reminders
      queue.ts               # BullMQ enqueue helpers
      email.ts               # Send OTP email via Resend
```

---

## 6. Auth Setup (Better Auth)

```ts
// src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: { enabled: true },
  // optionally add Google OAuth:
  // socialProviders: { google: { clientId: '...', clientSecret: '...' } },
  session: {
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
});
```

```ts
// src/app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
export const { GET, POST } = toNextJsHandler(auth);
```

Better Auth creates its own `user` and `session` tables. Your `profiles` table links to `user.id` (a string).

---

## 7. API Routes Reference

### Public (no auth)

| Method | Path | Description |
|---|---|---|
| GET | `/api/book/[slug]` | Get business info + active services by slug |
| POST | `/api/book/[slug]/auth` | Send OTP to guest email |
| POST | `/api/book/[slug]/verify` | Verify OTP → return session token |
| POST | `/api/book/[slug]/booking` | Create booking (Bearer token required) |
| GET | `/api/book/[slug]/slots` | Get available slots for a service+date |
| POST | `/api/chat` | AI booking chat (requires `businessSlug` in body) |

### Dashboard (Better Auth session required)

| Method | Path | Description |
|---|---|---|
| POST | `/api/onboarding/creator` | Create business, link to profile |
| GET | `/api/bookings` | List bookings with optional filters |
| PATCH | `/api/bookings/[id]` | Change booking status |
| GET/POST | `/api/services` | List / create services |
| PATCH/DELETE | `/api/services/[id]` | Update / delete a service |
| GET | `/api/clients` | List clients |
| GET | `/api/availability` | Get available slots |
| PUT | `/api/availability` | Replace weekly schedule |
| GET | `/api/analytics` | Revenue + booking stats |
| POST | `/api/dashboard-ai` | Owner AI assistant |

### Webhooks (no auth, validated by signature)

| Method | Path | Description |
|---|---|---|
| POST | `/api/webhooks/stripe` | Stripe checkout events |
| POST | `/api/webhooks/twilio` | Inbound SMS |
| POST | `/api/webhooks/instagram` | Inbound Instagram DM |

---

## 8. AI Prompts

### 8.1 Public Booking Chat — system prompt

Used in `POST /api/chat`. Injected fresh on every request with live service data.

```
You are a friendly booking assistant for {business.name}.
Help the user book an appointment.

Services available:
{servicesList}
-- format: "- {name} (id: {id}): ${price}, {duration_mins} min"

Rules:
- Keep replies short (2-3 sentences max)
- Always call check_availability before suggesting specific times — never invent slots
- Ask for the client's name before creating a booking
- After creating a booking, confirm the details clearly
- Today is {long date string}
```

### 8.2 Owner Dashboard AI — system prompt

Used in `POST /api/dashboard-ai`. Owner-only; can read/mutate bookings, availability, and services.

```
You are a smart dashboard assistant for {business.name}. You help the creator manage their business directly through natural language.

You can:
- Look up, cancel, or confirm bookings for any date
- Update weekly availability/hours
- View and update services
- Summarize analytics

Today is {long date}. Today's date is {YYYY-MM-DD}. Tomorrow is {YYYY-MM-DD}.

Rules:
- Be concise and direct (2-4 sentences max per reply)
- Before cancelling bookings, always call get_bookings first to see what exists, then cancel
- When the user says "today" use date {todayStr}, "tomorrow" use {tomorrowStr}
- Always confirm what actions you performed (e.g. "Cancelled 3 bookings for today")
- For bulk operations (like "cancel all bookings today"), fetch them first then cancel them all
- When updating availability, first get the current schedule, then apply the changes the user requested, preserving days they didn't mention
- Format times in 12-hour format in your replies (e.g. 9:00 AM)
- Keep responses friendly but professional
```

---

## 9. AI Tool Definitions

### 9.1 Public chat tools

```json
[
  {
    "name": "check_availability",
    "description": "Check available time slots for a given service and date range.",
    "parameters": {
      "service_id": "string — the service ID",
      "date_from":  "string — YYYY-MM-DD",
      "date_to":    "string — YYYY-MM-DD"
    },
    "required": ["service_id", "date_from", "date_to"]
  },
  {
    "name": "create_booking",
    "description": "Create a booking. Only call after client has confirmed a specific slot.",
    "parameters": {
      "service_id":   "string",
      "starts_at":    "string — ISO datetime",
      "client_name":  "string",
      "client_phone": "string (optional)"
    },
    "required": ["service_id", "starts_at", "client_name"]
  }
]
```

### 9.2 Dashboard AI tools

```json
[
  {
    "name": "get_bookings",
    "description": "Fetch bookings for a date or date range.",
    "parameters": {
      "date":   "string YYYY-MM-DD (optional)",
      "status": "enum: pending|confirmed|cancelled|no_show|expired (optional)"
    }
  },
  {
    "name": "cancel_bookings",
    "description": "Cancel one or multiple bookings by ID.",
    "parameters": {
      "booking_ids": "string[] — required"
    }
  },
  {
    "name": "confirm_bookings",
    "description": "Confirm one or multiple pending bookings by ID.",
    "parameters": {
      "booking_ids": "string[] — required"
    }
  },
  {
    "name": "get_availability",
    "description": "Get the current weekly availability schedule.",
    "parameters": {}
  },
  {
    "name": "update_availability",
    "description": "Replace the weekly schedule. Each entry: { day_of_week, start_time, end_time, is_active }",
    "parameters": {
      "schedule": "array of { day_of_week: 0-6, start_time: HH:MM, end_time: HH:MM, is_active: bool }"
    }
  },
  {
    "name": "get_services",
    "description": "List all services for this business.",
    "parameters": {}
  },
  {
    "name": "update_service",
    "description": "Update a service (name, price, duration, active status).",
    "parameters": {
      "service_id":    "string — required",
      "name":          "string (optional)",
      "price":         "number (optional)",
      "duration_mins": "number (optional)",
      "is_active":     "boolean (optional)"
    }
  },
  {
    "name": "get_analytics_summary",
    "description": "Get a quick summary of recent bookings and revenue.",
    "parameters": {
      "period": "enum: 7d|30d|90d (optional, default 30d)"
    }
  }
]
```

---

## 10. Guest Booking Flow

```
1. GET  /api/book/[slug]
   → returns { business, services[] }

2. POST /api/book/[slug]/auth
   body: { email, name }
   → sends 6-digit OTP to guest email (expires in 10 min)

3. POST /api/book/[slug]/verify
   body: { email, name, code }
   → returns { token, email, name }
   Client stores token in localStorage as bk_guest_{slug}

4. GET  /api/book/[slug]/slots?service_id=...&date_from=...&date_to=...
   Header: Authorization: Bearer {token}
   → returns { slots: [{ startsAt, endsAt, label }] }

5. POST /api/book/[slug]/booking
   Header: Authorization: Bearer {token}
   body: { service_id, starts_at, add_on_ids? }
   → if Stripe configured: returns { booking_id, checkout_url }
   → if no Stripe (dev):   auto-confirms and returns success URL

6. Stripe webhook POST /api/webhooks/stripe
   checkout.session.completed → set status=confirmed, payment_status=paid
   checkout.session.expired   → set status=expired

7. Redirect to /book/[slug]/success?booking_id=...
```

---

## 11. Notification Messages

All message builders live in `src/lib/server/notification-service.ts`. Copy these exactly.

### Booking confirmation (sent right after booking created via SMS/IG)

```
You're booked for {serviceName}{addOnText} on {dateStr}! Reply YES to confirm your spot. 🗓️
```

### Upsell (sent after confirmation, offers first add-on)

```
You're all set for {timeStr}! ✨ Want to add {addOn.name} (+${addOn.price}, {addOn.duration_mins} mins extra)? Reply ADD to include it.
```

### Reminder (sent 24h and 2h before)

```
Reminder: You have {serviceName} at {businessName} {timeLabel} ({dateStr}). See you soon! 💅
```
- `timeLabel` = `"tomorrow"` for 24h, `"in 2 hours"` for 2h

### Slot filler (sent when a cancellation opens a slot)

```
Hey {firstName}! I had a {timeStr} slot open up {timeLabel} if you want it 👀 — {serviceName}?
```

### Retention (sent to lapsed clients)

```
Hey {firstName}! It's been a while — you're probably due for your next {serviceName}! Want me to get you booked in this week? 💅
```

---

## 12. Stripe Integration

### Checkout creation (in `/api/book/[slug]/booking`)

1. Create booking row with `status='pending'`, `payment_status='unpaid'`
2. Create Stripe Checkout session:
   - `mode: 'payment'`
   - `customer_email`: guest email
   - `line_items`: service + add-ons
   - `metadata`: `{ booking_id, business_id, slug }`
   - `success_url`: `/book/{slug}/success?booking_id={id}&session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url`: `/book/{slug}?cancelled=1`
3. Store `stripe_checkout_session_id` on booking
4. Return `checkout_url` to client → redirect

### Webhook handler (`/api/webhooks/stripe`)

```
checkout.session.completed:
  → bookings.update({ status: 'confirmed', payment_status: 'paid' })
     where id = metadata.booking_id AND status = 'pending'
  → scheduleBookingReminders(booking_id)

checkout.session.expired:
  → bookings.update({ status: 'expired' })
     where id = metadata.booking_id AND status = 'pending'
```

Validate every webhook with `stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)`.

Register the webhook in Stripe Dashboard pointing to `https://yourdomain.com/api/webhooks/stripe`.

---

## 13. Build & Run

```bash
# Install dependencies
npm install

# Dev server
npm run dev

# Redis (required for reminders — run in a separate terminal)
redis-server

# BullMQ worker (run in a separate terminal)
npx ts-node src/workers/notification-worker.ts

# Production build
npm run build
npm start
```

### Supabase local dev

```bash
npx supabase start          # starts local Postgres + Studio
npx supabase db push        # apply migrations
npx supabase gen types typescript --local > src/types/supabase.ts
```

---

## Key design decisions to replicate cleanly

- **Always use `.maybeSingle()`** when a row might not exist. `.single()` returns HTTP 406 from PostgREST when 0 rows are found, polluting logs.
- **Business is always resolved by slug, never by `limit(1)`**. Every API route that needs a business must receive either a slug (public routes) or derive it from the authenticated profile (dashboard routes).
- **Guest sessions are scoped to `(token, business_id)`** — a token from business A cannot access business B's bookings.
- **Double-booking is prevented at the DB level** via the partial unique index on `(business_id, starts_at)` where status is pending/confirmed. The booking engine catches error code `23505` and returns a human-readable conflict message.
- **Reminder scheduling is idempotent** via the `UNIQUE(booking_id, reminder_type)` constraint on `booking_reminders`. Safe to call multiple times.
- **Availability engine uses a 30-minute slot grid**. It reads the business's weekly schedule, subtracts booked ranges, and returns up to 50 future slots.
