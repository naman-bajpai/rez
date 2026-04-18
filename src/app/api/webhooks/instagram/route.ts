/**
 * Instagram DM webhook — the Rez "Autonomous DM Receptionist".
 *
 * GET  — Meta webhook verification (hub.challenge echo)
 * POST — Inbound DM processing:
 *          1. Load/create client thread state from Supabase
 *          2. VIP: if message contains an image, analyse it with GPT-4o vision
 *          3. Run AI booking loop (check_availability → create_booking → Stripe link)
 *          4. Reply via Meta Graph API
 */

import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { getOpenAI } from "@/lib/server/openai";
import { checkAvailability, createBooking } from "@/lib/server/booking-engine";
import { sendInstagramDm, fetchInstagramMediaUrl } from "@/lib/server/notification-service";
import type OpenAI from "openai";

// ─── Types ────────────────────────────────────────────────────────────────────

type IgMessage = {
  mid: string;
  text?: string;
  attachments?: { type: string; payload: { url?: string; sticker_id?: number } }[];
};

type IgMessaging = {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: IgMessage;
};

type IgWebhookBody = {
  object?: string;
  entry?: {
    id: string;
    messaging?: IgMessaging[];
  }[];
};

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "check_availability",
      description:
        "Check available time slots for a given service and date range. Always call before suggesting specific times.",
      parameters: {
        type: "object",
        properties: {
          service_id: { type: "string" },
          date_from: { type: "string", description: "YYYY-MM-DD" },
          date_to: { type: "string", description: "YYYY-MM-DD" },
        },
        required: ["service_id", "date_from", "date_to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_booking",
      description:
        "Create a booking and return a payment link. Only call after client has confirmed a specific slot and provided their name.",
      parameters: {
        type: "object",
        properties: {
          service_id: { type: "string" },
          starts_at: { type: "string", description: "ISO datetime" },
          client_name: { type: "string" },
        },
        required: ["service_id", "starts_at", "client_name"],
      },
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayPlusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * VIP — Visual Intelligence Pricing.
 * Given an image URL, ask GPT-4o to identify the service and estimate price/duration
 * against the provider's menu.
 */
async function analyseInspoPhoto(
  imageUrl: string,
  services: { id: string; name: string; price: number; duration_mins: number }[]
): Promise<{ text: string; matchedServiceId: string | null }> {
  const openai = getOpenAI();

  const serviceMenu = services
    .map((s) => `- ${s.name} (id: ${s.id}): $${s.price}, ${s.duration_mins} min`)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "low" },
          },
          {
            type: "text",
            text: `You are a pricing assistant for a beauty service provider.
Look at this inspiration photo and identify which service from the menu below it most closely matches.

Menu:
${serviceMenu}

Respond in 1-2 sentences with:
1. What you see in the photo (e.g. "That looks like a full set with stiletto nails and intricate nail art.")
2. The matching service name, price, and duration.

If no service matches well, pick the closest one. End with: "Want me to find you a slot for this? 💅"

Return ONLY the conversational response plus the matched service id in JSON on the last line like:
{"matched_service_id": "<id or null>"}`,
          },
        ],
      },
    ],
  });

  const raw = completion.choices[0].message.content ?? "";
  // Extract JSON from last line
  const lines = raw.trim().split("\n");
  let matchedServiceId: string | null = null;
  let textLines = lines;

  const lastLine = lines[lines.length - 1].trim();
  if (lastLine.startsWith("{")) {
    try {
      const parsed = JSON.parse(lastLine) as { matched_service_id?: string | null };
      matchedServiceId = parsed.matched_service_id ?? null;
      textLines = lines.slice(0, -1);
    } catch {
      // ignore parse errors
    }
  }

  return { text: textLines.join("\n").trim(), matchedServiceId };
}

// ─── Conversation state via Supabase (ig_threads table, created on demand) ────

/**
 * We store conversation history in a Supabase table `ig_threads`.
 * Schema (create if not exists):
 *
 *   create table ig_threads (
 *     id            uuid primary key default gen_random_uuid(),
 *     business_id   uuid not null references businesses(id) on delete cascade,
 *     ig_user_id    text not null,
 *     messages      jsonb not null default '[]',
 *     paused        boolean not null default false,
 *     created_at    timestamptz not null default now(),
 *     updated_at    timestamptz not null default now(),
 *     unique (business_id, ig_user_id)
 *   );
 */

type StoredMessage = { role: "user" | "assistant"; content: string };

async function loadThread(
  businessId: string,
  igUserId: string
): Promise<{ messages: StoredMessage[]; paused: boolean }> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("ig_threads")
    .select("messages, paused")
    .eq("business_id", businessId)
    .eq("ig_user_id", igUserId)
    .maybeSingle();

  return {
    messages: (data?.messages as StoredMessage[]) ?? [],
    paused: (data?.paused as boolean) ?? false,
  };
}

async function saveThread(
  businessId: string,
  igUserId: string,
  messages: StoredMessage[]
): Promise<void> {
  const supabase = createServiceRoleClient();
  await supabase.from("ig_threads").upsert(
    { business_id: businessId, ig_user_id: igUserId, messages, updated_at: new Date().toISOString() },
    { onConflict: "business_id,ig_user_id" }
  );
}

// ─── Main AI loop ─────────────────────────────────────────────────────────────

async function runIgAiLoop(params: {
  businessId: string;
  businessSlug: string;
  services: { id: string; name: string; price: number; duration_mins: number }[];
  businessName: string;
  igUserId: string;
  inboundText: string;
  history: StoredMessage[];
  aiContext: string | null;
}): Promise<string> {
  const { businessId, businessSlug, services, businessName, igUserId, inboundText, history, aiContext } = params;
  const supabase = createServiceRoleClient();
  const openai = getOpenAI();

  const servicesList = services
    .map((s) => `- ${s.name} (id: ${s.id}): $${s.price}, ${s.duration_mins} min`)
    .join("\n");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const systemPrompt = `You are Rez, the autonomous booking assistant for ${businessName}. You live inside Instagram DMs.

## BUSINESS KNOWLEDGE (your single source of truth)
${aiContext?.trim() || "No custom business context has been configured yet."}

## SERVICES MENU (live — always current)
${servicesList || "No services listed."}

## BOOKING RULES
- Keep replies SHORT — 1-3 sentences, conversational, like a real DM
- Always call check_availability before suggesting specific times
- Ask for the client's name before creating a booking
- After booking, give them the Stripe payment link to secure the slot
- If a slot is taken, suggest the next 3 closest openings
- Distinguish "just asking" from "ready to book" — for ready clients, prioritise getting them booked fast
- Today is ${today}

## ANTI-HALLUCINATION RULES (highest priority — never break these)
- You ONLY know what is in BUSINESS KNOWLEDGE and SERVICES MENU above
- If asked about a service, price, policy, or detail NOT listed above, say: "I don't have that info on hand — I'll have ${businessName} follow up with you directly 🙏"
- Never invent prices, durations, policies, or availability
- Never describe a service in more detail than what is listed
- If a client's request is unclear or doesn't match a listed service, ask a clarifying question rather than guessing`;

  const runMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: inboundText },
  ];

  let finalReply = "Hey! Let me help you get booked in. What service are you looking for? 💅";

  for (let iter = 0; iter < 6; iter++) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: runMessages,
      tools: TOOLS,
      tool_choice: "auto",
    });

    const choice = completion.choices[0];
    const msg = choice.message;
    runMessages.push(msg as OpenAI.Chat.Completions.ChatCompletionMessageParam);

    if (choice.finish_reason === "stop" || !msg.tool_calls?.length) {
      finalReply = msg.content ?? finalReply;
      break;
    }

    for (const tc of msg.tool_calls) {
      if (tc.type !== "function") continue;
      const args = JSON.parse(tc.function.arguments) as Record<string, string>;
      let toolResult = "";

      if (tc.function.name === "check_availability") {
        const slots = await checkAvailability({
          businessId,
          serviceId: args.service_id,
          dateFrom: args.date_from ?? todayPlusDays(0),
          dateTo: args.date_to ?? todayPlusDays(7),
        });

        if (!slots.length) {
          toolResult = "No available slots in that range.";
        } else {
          toolResult = slots
            .slice(0, 6)
            .map((s) => {
              const d = new Date(s.startsAt);
              const label = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
              return `${label} at ${s.label} (${s.startsAt})`;
            })
            .join("\n");
        }
      } else if (tc.function.name === "create_booking") {
        const service = services.find((s) => s.id === args.service_id);
        if (!service) {
          toolResult = "Service not found.";
        } else {
          try {
            const startsAt = new Date(args.starts_at);
            const endsAt = new Date(startsAt.getTime() + service.duration_mins * 60000);

            // Upsert/find client record
            const { data: client } = await supabase
              .from("clients")
              .upsert(
                { business_id: businessId, name: args.client_name, instagram_id: igUserId },
                { onConflict: "business_id,instagram_id" }
              )
              .select("id")
              .maybeSingle();

            const booking = await createBooking({
              businessId,
              clientId: client?.id as string | undefined,
              serviceId: args.service_id,
              startsAt: startsAt.toISOString(),
              endsAt: endsAt.toISOString(),
              totalPrice: service.price,
              guestEmail: `ig-${igUserId}@rez.app`,
              guestName: args.client_name,
              sourceChannel: "instagram",
            });

            // Stripe deposit link
            const stripeKey = process.env.STRIPE_SECRET_KEY;
            if (stripeKey?.startsWith("sk_")) {
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              const Stripe = require("stripe").default ?? require("stripe");
              const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });
              const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

              const session = await stripe.checkout.sessions.create({
                mode: "payment",
                line_items: [
                  {
                    price_data: {
                      currency: "usd",
                      product_data: { name: service.name },
                      unit_amount: Math.round(service.price * 100),
                    },
                    quantity: 1,
                  },
                ],
                metadata: { booking_id: booking.id, business_id: businessId, slug: businessSlug },
                success_url: `${appUrl}/book/${businessSlug}/success?booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${appUrl}/book/${businessSlug}`,
              });

              await supabase
                .from("bookings")
                .update({ stripe_checkout_session_id: session.id })
                .eq("id", booking.id);

              toolResult = `Booking created. Stripe link: ${session.url}`;
            } else {
              await supabase
                .from("bookings")
                .update({ status: "confirmed", payment_status: "unpaid" })
                .eq("id", booking.id);
              toolResult = `Booking confirmed (ID: ${booking.id}). No payment required.`;
            }
          } catch (err) {
            toolResult = err instanceof Error ? err.message : "Booking failed.";
          }
        }
      }

      runMessages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: toolResult,
      } as OpenAI.Chat.Completions.ChatCompletionToolMessageParam);
    }
  }

  return finalReply;
}

// ─── Route handlers ───────────────────────────────────────────────────────────

/** GET — Meta webhook verification */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

/** POST — inbound DM */
export async function POST(request: Request) {
  try {
    const body = await request.json() as IgWebhookBody;

    if (body.object !== "instagram") {
      return NextResponse.json({ status: "ignored" });
    }

    const supabase = createServiceRoleClient();

    for (const entry of body.entry ?? []) {
      const pageId = entry.id; // the business's IG page ID

      for (const event of entry.messaging ?? []) {
        const { sender, message } = event;
        if (!message) continue;

        // Ignore echo (messages sent by the page itself)
        if (sender.id === pageId) continue;

        const igUserId = sender.id;

        // Look up which Rez business owns this page (include page token for sending)
        const { data: business } = await supabase
          .from("businesses")
          .select("id, name, slug, ig_page_access_token, ai_context")
          .eq("ig_page_id", pageId)
          .maybeSingle();

        if (!business) {
          console.warn(`[IG Webhook] No business found for page ${pageId}`);
          continue;
        }

        const businessId = business.id as string;

        // Load thread + check if paused
        const thread = await loadThread(businessId, igUserId);
        if (thread.paused) continue; // provider has taken over — don't respond

        // Load services
        const { data: services } = await supabase
          .from("services")
          .select("id, name, price, duration_mins")
          .eq("business_id", businessId)
          .eq("is_active", true)
          .order("name");

        const svcList = (services ?? []) as { id: string; name: string; price: number; duration_mins: number }[];

        let userContent = message.text ?? "";

        // ── VIP: image attachment handling ────────────────────────────────
        const imageAttachment = message.attachments?.find((a) => a.type === "image");
        if (imageAttachment?.payload?.url) {
          const imageUrl = imageAttachment.payload.url;
          try {
            const vip = await analyseInspoPhoto(imageUrl, svcList);
            // Prepend VIP analysis to user content so the main loop has context
            userContent = vip.text
              ? `[Client sent an inspo photo — Rez analysis: ${vip.text}] ${userContent}`.trim()
              : userContent;
          } catch (vipErr) {
            console.error("[VIP analysis failed]", vipErr);
          }
        } else if (!userContent) {
          // Sticker or unsupported attachment — skip
          continue;
        }

        // ── Run AI loop ───────────────────────────────────────────────────
        const reply = await runIgAiLoop({
          businessId,
          businessSlug: business.slug as string,
          services: svcList,
          businessName: business.name as string,
          igUserId,
          inboundText: userContent,
          history: thread.messages,
          aiContext: (business.ai_context as string | null) ?? null,
        });

        // Save updated history (keep last 20 turns to avoid token bloat)
        const newHistory: StoredMessage[] = [
          ...thread.messages,
          { role: "user" as const, content: userContent },
          { role: "assistant" as const, content: reply },
        ].slice(-20);

        await saveThread(businessId, igUserId, newHistory);

        // Send reply using the business's own page access token
        const pageToken = (business.ig_page_access_token as string | null) ?? undefined;
        await sendInstagramDm(igUserId, reply, pageToken);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[IG Webhook POST]", err);
    // Always return 200 to Meta so it doesn't retry
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
