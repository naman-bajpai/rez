import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { getOpenAI } from "@/lib/server/openai";
import { checkAvailability, createBooking } from "@/lib/server/booking-engine";
import type OpenAI from "openai";

type Message = { role: "user" | "assistant" | "system"; content: string };

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "check_availability",
      description:
        "Check available time slots for a given service and date range. Always call this before suggesting specific times.",
      parameters: {
        type: "object",
        properties: {
          service_id: { type: "string", description: "The service ID" },
          date_from: { type: "string", description: "YYYY-MM-DD start date" },
          date_to: { type: "string", description: "YYYY-MM-DD end date" },
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
        "Create a booking. Only call after the client has confirmed a specific slot and provided their name.",
      parameters: {
        type: "object",
        properties: {
          service_id: { type: "string" },
          starts_at: { type: "string", description: "ISO datetime string" },
          client_name: { type: "string" },
          client_email: { type: "string", description: "Optional guest email" },
        },
        required: ["service_id", "starts_at", "client_name"],
      },
    },
  },
];

/** POST /api/chat — public AI booking assistant */
export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      businessSlug?: string;
      messages?: Message[];
    };

    const { businessSlug, messages = [] } = body;

    if (!businessSlug) {
      return NextResponse.json({ error: "businessSlug is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Resolve business
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, timezone, ai_context")
      .eq("slug", businessSlug)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const businessId = business.id as string;

    // Load active services
    const { data: services } = await supabase
      .from("services")
      .select("id, name, price, duration_mins")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("name");

    const servicesList = (services ?? [])
      .map((s) => `- ${s.name} (id: ${s.id}): $${s.price}, ${s.duration_mins} min`)
      .join("\n");

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const aiContext = (business.ai_context as string | null) ?? null;

    const systemPrompt = `You are a friendly booking assistant for ${business.name as string}.

## BUSINESS KNOWLEDGE (your single source of truth)
${aiContext?.trim() || "No custom business context has been configured yet."}

## SERVICES AVAILABLE (live — always current)
${servicesList || "No services currently available."}

## BOOKING RULES
- Keep replies short (2-3 sentences max)
- Always call check_availability before suggesting specific times — never invent slots
- Ask for the client's name and email before creating a booking
- After creating a booking, confirm the details clearly with date and time
- Today is ${today}

## ANTI-HALLUCINATION RULES (highest priority — never break these)
- You ONLY know what is in BUSINESS KNOWLEDGE and SERVICES AVAILABLE above
- If asked about a service, price, policy, or detail NOT listed above, say: "I don't have that detail — please reach out to ${business.name as string} directly for that one"
- Never invent prices, durations, policies, or availability
- Never describe a service in more detail than what is listed
- If the request is ambiguous, ask a clarifying question rather than guessing`;

    const openai = getOpenAI();

    // Run the agentic loop (max 5 tool call iterations)
    const runMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    let finalText = "";
    let bookingResult: { booking_id?: string; checkout_url?: string; success_url?: string } | null = null;

    for (let iter = 0; iter < 5; iter++) {
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
        finalText = msg.content ?? "";
        break;
      }

      // Process tool calls (only function-type calls)
      for (const tc of msg.tool_calls) {
        if (tc.type !== "function") continue;
        const args = JSON.parse(tc.function.arguments) as Record<string, string>;
        let toolResult = "";

        if (tc.function.name === "check_availability") {
          const slots = await checkAvailability({
            businessId,
            serviceId: args.service_id,
            dateFrom: args.date_from,
            dateTo: args.date_to,
          });

          if (slots.length === 0) {
            toolResult = "No available slots in that range.";
          } else {
            toolResult = slots
              .slice(0, 6)
              .map((s) => {
                const d = new Date(s.startsAt);
                const dayLabel = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
                return `${dayLabel} at ${s.label} (${s.startsAt})`;
              })
              .join("\n");
          }
        } else if (tc.function.name === "create_booking") {
          // We need a service to get duration + price
          const { data: service } = await supabase
            .from("services")
            .select("id, name, price, duration_mins")
            .eq("id", args.service_id)
            .eq("business_id", businessId)
            .maybeSingle();

          if (!service) {
            toolResult = "Service not found.";
          } else {
            try {
              const startsAt = new Date(args.starts_at);
              const endsAt = new Date(startsAt.getTime() + (service.duration_mins as number) * 60000);
              const guestEmail = args.client_email ?? "noreply@rez.app";
              const guestName = args.client_name;

              const booking = await createBooking({
                businessId,
                serviceId: args.service_id,
                startsAt: startsAt.toISOString(),
                endsAt: endsAt.toISOString(),
                totalPrice: service.price as number,
                guestEmail,
                guestName,
                sourceChannel: "web_chat",
              });

              // Try Stripe checkout if configured
              const stripeKey = process.env.STRIPE_SECRET_KEY;
              if (stripeKey?.startsWith("sk_")) {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const Stripe = require("stripe").default ?? require("stripe");
                const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });
                const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

                const session = await stripe.checkout.sessions.create({
                  mode: "payment",
                  customer_email: guestEmail !== "noreply@rez.app" ? guestEmail : undefined,
                  line_items: [
                    {
                      price_data: {
                        currency: "usd",
                        product_data: { name: service.name as string },
                        unit_amount: Math.round((service.price as number) * 100),
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

                bookingResult = { booking_id: booking.id, checkout_url: session.url };
                toolResult = `Booking created (ID: ${booking.id}). Stripe payment link ready.`;
              } else {
                // Dev: auto-confirm
                await supabase
                  .from("bookings")
                  .update({ status: "confirmed", payment_status: "unpaid" })
                  .eq("id", booking.id);

                bookingResult = { booking_id: booking.id };
                toolResult = `Booking confirmed (ID: ${booking.id}).`;
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

    return NextResponse.json({
      message: finalText,
      ...(bookingResult ?? {}),
    });
  } catch (err) {
    console.error("[/api/chat POST]", err);
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
