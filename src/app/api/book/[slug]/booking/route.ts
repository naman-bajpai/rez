import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { verifyGuestSession } from "@/lib/server/guest-auth";
import { createBooking } from "@/lib/server/booking-engine";
import { getOpenAI } from "@/lib/server/openai";

async function createBookingConversation(params: {
  bookingId: string;
  businessId: string;
  businessName: string;
  guestName: string;
  serviceName: string;
  startsAt: string;
}) {
  const supabase = createServiceRoleClient();
  try {
    const openai = getOpenAI();
    const dateLabel = new Date(params.startsAt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a warm, friendly assistant for ${params.businessName}. Write a brief (2-3 sentence) welcome message to a customer who just booked an appointment. Be enthusiastic but professional. Mention the service and date. End by inviting them to ask any questions.`,
        },
        {
          role: "user",
          content: `Customer: ${params.guestName}, Service: ${params.serviceName}, Date: ${dateLabel}`,
        },
      ],
      max_tokens: 120,
      temperature: 0.8,
    });

    const welcome = completion.choices[0].message.content ??
      `Hi ${params.guestName}! Your ${params.serviceName} appointment on ${dateLabel} is confirmed. Feel free to message us here if you have any questions!`;

    await supabase.from("booking_conversations").insert({
      booking_id: params.bookingId,
      business_id: params.businessId,
      messages: [
        {
          role: "provider",
          content: welcome,
          created_at: new Date().toISOString(),
        },
      ],
    });
  } catch (err) {
    // Non-fatal — booking was already created successfully
    console.error("[createBookingConversation]", err);
  }
}

/** POST — create booking (auto-confirm in dev if no Stripe) */
export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const { service_id, starts_at } = body as {
      service_id?: string;
      starts_at?: string;
    };

    if (!service_id || !starts_at) {
      return NextResponse.json(
        { error: "service_id and starts_at are required" },
        { status: 400 }
      );
    }

    // Verify guest session
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("slug", slug)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const businessId = business.id as string;
    const guest = await verifyGuestSession(token, businessId);

    // Get service details for pricing + duration
    const { data: service } = await supabase
      .from("services")
      .select("id, name, price, duration_mins")
      .eq("id", service_id)
      .eq("business_id", businessId)
      .eq("is_active", true)
      .maybeSingle();

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const startsAt = new Date(starts_at);
    const endsAt = new Date(startsAt.getTime() + (service.duration_mins as number) * 60000);

    const booking = await createBooking({
      businessId,
      serviceId: service_id,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      totalPrice: service.price as number,
      guestEmail: guest.email,
      guestName: guest.name,
      sourceChannel: "web",
    });

    // Stripe integration (optional — only runs if stripe package is installed)
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && stripeKey.startsWith("sk_")) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Stripe = require("stripe").default ?? require("stripe");
        const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: guest.email,
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
          metadata: {
            booking_id: booking.id,
            business_id: businessId,
            slug,
          },
          success_url: `${appUrl}/book/${slug}/success?booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/book/${slug}?cancelled=1`,
        });

        await supabase
          .from("bookings")
          .update({ stripe_checkout_session_id: session.id })
          .eq("id", booking.id);

        return NextResponse.json({
          booking_id: booking.id,
          checkout_url: session.url,
        });
      } catch (stripeErr) {
        console.error("[STRIPE ERROR]", stripeErr);
        // Fall through to auto-confirm
      }
    }

    // Dev / no-Stripe: auto-confirm
    await supabase
      .from("bookings")
      .update({ status: "confirmed", payment_status: "unpaid" })
      .eq("id", booking.id);

    // Kick off post-booking conversation (fire-and-forget)
    void createBookingConversation({
      bookingId: booking.id,
      businessId,
      businessName: business.name as string,
      guestName: guest.name,
      serviceName: service.name as string,
      startsAt: startsAt.toISOString(),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.json({
      booking_id: booking.id,
      success_url: `${appUrl}/book/${slug}/success?booking_id=${booking.id}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    if (msg === "Unauthorized" || msg === "Session expired") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    if (msg.includes("just taken")) {
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    console.error("[/api/book/[slug]/booking POST]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
