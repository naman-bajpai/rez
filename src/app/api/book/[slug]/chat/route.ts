import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { getOpenAI } from "@/lib/server/openai";
import {
  createAndSendOtp,
  verifyGuestSession,
} from "@/lib/server/guest-auth";
import { getAvailableSlots, createBooking } from "@/lib/server/booking-engine";

type ChatMessage = { role: "user" | "assistant"; content: string };

function getTwoWeeksRange() {
  const today = new Date();
  const out = new Date(today);
  out.setDate(out.getDate() + 14);
  return {
    dateFrom: today.toISOString().slice(0, 10),
    dateTo: out.toISOString().slice(0, 10),
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json() as {
      messages: ChatMessage[];
      guest_token?: string;
    };

    const { messages, guest_token } = body;

    if (!messages?.length) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, owner_name, timezone")
      .eq("slug", slug)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const { data: services } = await supabase
      .from("services")
      .select("id, name, duration_mins, price")
      .eq("business_id", business.id as string)
      .eq("is_active", true)
      .order("name");

    const businessId = business.id as string;

    // Verify guest session if token provided
    let guestSession: { name: string; email: string } | null = null;
    if (guest_token) {
      try {
        guestSession = await verifyGuestSession(guest_token, businessId);
      } catch {
        // treat as unauthenticated
      }
    }

    const openai = getOpenAI();

    const serviceList = (services ?? [])
      .map((s) => `- ${s.name}: $${Number(s.price).toFixed(2)}, ${s.duration_mins} min (id:${s.id})`)
      .join("\n");

    const systemPrompt = `You are a friendly, concise booking assistant for ${business.name}${business.owner_name ? ` with ${business.owner_name}` : ""}.

Available services:
${serviceList || "No services listed yet."}

${guestSession ? `Customer verified: ${guestSession.name} (${guestSession.email}).` : "Customer is not yet verified. You need their name + email to send a verification code."}

Your role:
1. Answer questions about the business and services warmly
2. When the customer wants to book: collect name + email (if not verified), then call request_otp
3. After they verify, call get_available_slots then present a few clear options
4. Once customer confirms a specific slot, call create_booking immediately
5. Never reveal internal IDs to customers
6. Keep responses short — 1-3 sentences maximum`;

    const apiMessages: Parameters<typeof openai.chat.completions.create>[0]["messages"] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const tools: NonNullable<Parameters<typeof openai.chat.completions.create>[0]["tools"]> = [
      {
        type: "function",
        function: {
          name: "get_available_slots",
          description: "Fetch available appointment slots for a service over the next 2 weeks",
          parameters: {
            type: "object",
            properties: {
              service_id: { type: "string", description: "Service ID to check" },
            },
            required: ["service_id"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "request_otp",
          description: "Send a 6-digit verification code to the customer's email",
          parameters: {
            type: "object",
            properties: {
              email: { type: "string" },
              name: { type: "string" },
            },
            required: ["email", "name"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_booking",
          description: "Create a confirmed booking. Only call after customer explicitly confirms the slot.",
          parameters: {
            type: "object",
            properties: {
              service_id: { type: "string" },
              starts_at: { type: "string", description: "ISO datetime of the slot start" },
            },
            required: ["service_id", "starts_at"],
          },
        },
      },
    ];

    let otpRequested = false;
    let otpEmail: string | null = null;
    let otpName: string | null = null;
    let bookingCreated = false;
    let bookingId: string | null = null;
    let successUrl: string | null = null;
    let finalMessage = "";

    for (let i = 0; i < 6; i++) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: apiMessages,
        tools,
        tool_choice: "auto",
        temperature: 0.7,
      });

      const choice = completion.choices[0];

      if (choice.finish_reason === "stop" || !choice.message.tool_calls?.length) {
        finalMessage = choice.message.content ?? "";
        break;
      }

      // Push assistant message with tool calls
      apiMessages.push(choice.message as (typeof apiMessages)[number]);

      for (const tc of choice.message.tool_calls ?? []) {
        if (tc.type !== "function") continue;
        let toolResult: string;

        try {
          const args = JSON.parse(tc.function.arguments) as Record<string, string>;

          if (tc.function.name === "get_available_slots") {
            const { dateFrom, dateTo } = getTwoWeeksRange();
            const slots = await getAvailableSlots({
              businessId,
              serviceId: args.service_id,
              dateFrom,
              dateTo,
            });

            // Return the first 15 slots in a human-friendly format
            const formatted = slots.slice(0, 15).map((s) => ({
              starts_at: s.startsAt,
              label: new Date(s.startsAt).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }),
            }));
            toolResult = JSON.stringify({ slots: formatted });
          } else if (tc.function.name === "request_otp") {
            if (guestSession) {
              toolResult = JSON.stringify({ already_verified: true });
            } else {
              await createAndSendOtp(args.email, businessId, args.name);
              otpRequested = true;
              otpEmail = args.email;
              otpName = args.name;
              toolResult = JSON.stringify({ otp_sent: true });
            }
          } else if (tc.function.name === "create_booking") {
            if (!guestSession) {
              toolResult = JSON.stringify({ error: "Customer must verify email first." });
            } else {
              const service = (services ?? []).find((s) => s.id === args.service_id);
              if (!service) {
                toolResult = JSON.stringify({ error: "Service not found." });
              } else {
                const startsAt = new Date(args.starts_at);
                const endsAt = new Date(
                  startsAt.getTime() + (service.duration_mins as number) * 60000
                );

                const booking = await createBooking({
                  businessId,
                  serviceId: args.service_id,
                  startsAt: startsAt.toISOString(),
                  endsAt: endsAt.toISOString(),
                  totalPrice: service.price as number,
                  guestEmail: guestSession.email,
                  guestName: guestSession.name,
                  sourceChannel: "web",
                });

                // Auto-confirm
                await supabase
                  .from("bookings")
                  .update({ status: "confirmed", payment_status: "unpaid" })
                  .eq("id", booking.id);

                bookingCreated = true;
                bookingId = booking.id;
                const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
                successUrl = `${appUrl}/book/${slug}/success?booking_id=${booking.id}`;

                toolResult = JSON.stringify({
                  booking_created: true,
                  booking_id: booking.id,
                  service: service.name,
                  starts_at: args.starts_at,
                });
              }
            }
          } else {
            toolResult = JSON.stringify({ error: "Unknown tool" });
          }
        } catch (err) {
          toolResult = JSON.stringify({ error: err instanceof Error ? err.message : "Tool error" });
        }

        apiMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: toolResult,
        });
      }
    }

    return NextResponse.json({
      message: finalMessage,
      action: otpRequested ? "otp_requested" : bookingCreated ? "booking_created" : null,
      otp_email: otpEmail,
      otp_name: otpName,
      booking_id: bookingId,
      success_url: successUrl,
    });
  } catch (err) {
    console.error("[/api/book/[slug]/chat POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
