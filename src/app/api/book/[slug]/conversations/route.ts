import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { verifyGuestSession } from "@/lib/server/guest-auth";
import { getOpenAI } from "@/lib/server/openai";

type ConvMessage = { role: "guest" | "provider"; content: string; created_at: string };

/** GET ?booking_id=xxx — fetch conversation messages */
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const url = new URL(request.url);
    const bookingId = url.searchParams.get("booking_id");

    if (!bookingId) {
      return NextResponse.json({ error: "booking_id required" }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const businessId = business.id as string;
    await verifyGuestSession(token, businessId);

    const { data: conv } = await supabase
      .from("booking_conversations")
      .select("id, messages, created_at, updated_at")
      .eq("booking_id", bookingId)
      .eq("business_id", businessId)
      .maybeSingle();

    return NextResponse.json({ messages: (conv?.messages as ConvMessage[]) ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "Unauthorized" || msg === "Session expired") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error("[conversations GET]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** POST { booking_id, message } — guest sends a message, gets AI acknowledgement */
export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json() as { booking_id?: string; message?: string };

    if (!body.booking_id || !body.message?.trim()) {
      return NextResponse.json({ error: "booking_id and message required" }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, owner_name")
      .eq("slug", slug)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const businessId = business.id as string;
    const guest = await verifyGuestSession(token, businessId);

    // Fetch current conversation
    const { data: conv } = await supabase
      .from("booking_conversations")
      .select("id, messages")
      .eq("booking_id", body.booking_id)
      .eq("business_id", businessId)
      .maybeSingle();

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const existing = (conv.messages as ConvMessage[]) ?? [];

    // Append guest message
    const guestMsg: ConvMessage = {
      role: "guest",
      content: body.message.trim(),
      created_at: new Date().toISOString(),
    };

    // Generate AI auto-reply
    const openai = getOpenAI();
    const recentHistory = existing.slice(-8).map((m) => ({
      role: m.role === "guest" ? "user" as const : "assistant" as const,
      content: m.content,
    }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant for ${business.name}${business.owner_name ? ` with ${business.owner_name}` : ""}. A customer named ${guest.name} has a booking and is messaging post-booking. Respond warmly and helpfully. Keep replies brief (1-3 sentences). If they have questions you can't answer (e.g. specific pricing changes, rescheduling), tell them to contact the business directly.`,
        },
        ...recentHistory,
        { role: "user", content: body.message.trim() },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const aiReply = completion.choices[0].message.content ?? "Thanks for your message! We'll be in touch.";

    const aiMsg: ConvMessage = {
      role: "provider",
      content: aiReply,
      created_at: new Date().toISOString(),
    };

    const updatedMessages = [...existing, guestMsg, aiMsg];

    await supabase
      .from("booking_conversations")
      .update({ messages: updatedMessages })
      .eq("id", conv.id as string);

    return NextResponse.json({ guest_message: guestMsg, ai_reply: aiMsg });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "Unauthorized" || msg === "Session expired") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error("[conversations POST]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
