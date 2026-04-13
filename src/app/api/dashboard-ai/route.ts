import { NextResponse } from "next/server";
import { withBusiness } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { getOpenAI } from "@/lib/server/openai";
import type OpenAI from "openai";

type Message = { role: "user" | "assistant" | "system"; content: string };

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_bookings",
      description: "Fetch bookings for a specific date or date range.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "YYYY-MM-DD (optional)" },
          date_from: { type: "string", description: "YYYY-MM-DD start (optional)" },
          date_to: { type: "string", description: "YYYY-MM-DD end (optional)" },
          status: {
            type: "string",
            enum: ["pending", "confirmed", "cancelled", "no_show", "expired"],
            description: "Filter by status (optional)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_bookings",
      description: "Cancel one or multiple bookings by ID.",
      parameters: {
        type: "object",
        properties: {
          booking_ids: {
            type: "array",
            items: { type: "string" },
            description: "Array of booking IDs to cancel",
          },
        },
        required: ["booking_ids"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "confirm_bookings",
      description: "Confirm one or multiple pending bookings by ID.",
      parameters: {
        type: "object",
        properties: {
          booking_ids: {
            type: "array",
            items: { type: "string" },
            description: "Array of booking IDs to confirm",
          },
        },
        required: ["booking_ids"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_availability",
      description: "Get the current weekly availability schedule.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "update_availability",
      description:
        "Replace the weekly schedule. Each entry: { day_of_week (0=Sun…6=Sat), start_time (HH:MM), end_time (HH:MM), is_active }",
      parameters: {
        type: "object",
        properties: {
          schedule: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day_of_week: { type: "number" },
                start_time: { type: "string" },
                end_time: { type: "string" },
                is_active: { type: "boolean" },
              },
              required: ["day_of_week", "start_time", "end_time", "is_active"],
            },
          },
        },
        required: ["schedule"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_services",
      description: "List all services for this business.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "update_service",
      description: "Update a service (name, price, duration, active status).",
      parameters: {
        type: "object",
        properties: {
          service_id: { type: "string" },
          name: { type: "string" },
          price: { type: "number" },
          duration_mins: { type: "number" },
          is_active: { type: "boolean" },
        },
        required: ["service_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_analytics_summary",
      description: "Get a summary of recent bookings and revenue.",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", enum: ["7d", "30d", "90d"], description: "Default: 30d" },
        },
      },
    },
  },
];

/** POST /api/dashboard-ai — owner AI assistant */
export async function POST(request: Request) {
  try {
    return await withBusiness(request, async ({ businessId }) => {
      const body = await request.json() as { messages?: Message[] };
      const { messages = [] } = body;

      const supabase = createServiceRoleClient();

      const { data: business } = await supabase
        .from("businesses")
        .select("name, timezone")
        .eq("id", businessId)
        .maybeSingle();

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      const longDate = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const systemPrompt = `You are a smart dashboard assistant for ${business?.name ?? "this business"}. You help the owner manage their business directly through natural language.

You can:
- Look up, cancel, or confirm bookings for any date
- Update weekly availability/hours
- View and update services
- Summarize analytics

Today is ${longDate}. Today's date is ${todayStr}. Tomorrow is ${tomorrowStr}.

Rules:
- Be concise and direct (2-4 sentences max per reply)
- Before cancelling bookings, always call get_bookings first to see what exists
- When the user says "today" use date ${todayStr}, "tomorrow" use ${tomorrowStr}
- Always confirm what actions you performed (e.g. "Cancelled 3 bookings for today")
- For bulk operations, fetch first then act
- When updating availability, get the current schedule first, then apply the requested changes while preserving unmentioned days
- Format times in 12-hour format in your replies (e.g. 9:00 AM)
- Keep responses friendly but professional`;

      const openai = getOpenAI();

      const runMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...messages,
      ];

      let finalText = "";

      for (let iter = 0; iter < 8; iter++) {
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
          const args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
          let toolResult = "";

          if (tc.function.name === "get_bookings") {
            let query = supabase
              .from("bookings")
              .select("id, starts_at, ends_at, status, payment_status, total_price, guest_name, guest_email, services(name)")
              .eq("business_id", businessId)
              .order("starts_at");

            if (args.status) query = query.eq("status", args.status as string);

            if (args.date) {
              query = query
                .gte("starts_at", `${args.date}T00:00:00.000Z`)
                .lte("starts_at", `${args.date}T23:59:59.999Z`);
            } else if (args.date_from || args.date_to) {
              if (args.date_from) query = query.gte("starts_at", `${args.date_from}T00:00:00.000Z`);
              if (args.date_to) query = query.lte("starts_at", `${args.date_to}T23:59:59.999Z`);
            }

            const { data: bookings } = await query.limit(30);
            if (!bookings?.length) {
              toolResult = "No bookings found.";
            } else {
              toolResult = JSON.stringify(
                bookings.map((b) => ({
                  id: b.id,
                  starts_at: b.starts_at,
                  status: b.status,
                  payment_status: b.payment_status,
                  total_price: b.total_price,
                  guest_name: b.guest_name,
                  service: (b.services as unknown as { name: string } | null)?.name ?? "Unknown",
                }))
              );
            }
          } else if (tc.function.name === "cancel_bookings") {
            const ids = args.booking_ids as string[];
            const { error } = await supabase
              .from("bookings")
              .update({ status: "cancelled" })
              .in("id", ids)
              .eq("business_id", businessId);
            toolResult = error ? `Error: ${error.message}` : `Cancelled ${ids.length} booking(s).`;
          } else if (tc.function.name === "confirm_bookings") {
            const ids = args.booking_ids as string[];
            const { error } = await supabase
              .from("bookings")
              .update({ status: "confirmed" })
              .in("id", ids)
              .eq("business_id", businessId);
            toolResult = error ? `Error: ${error.message}` : `Confirmed ${ids.length} booking(s).`;
          } else if (tc.function.name === "get_availability") {
            const { data: schedule } = await supabase
              .from("availability")
              .select("day_of_week, start_time, end_time, is_active")
              .eq("business_id", businessId)
              .order("day_of_week");
            toolResult = JSON.stringify(schedule ?? []);
          } else if (tc.function.name === "update_availability") {
            const schedule = args.schedule as {
              day_of_week: number;
              start_time: string;
              end_time: string;
              is_active: boolean;
            }[];

            // Upsert each day
            const rows = schedule.map((s) => ({
              business_id: businessId,
              day_of_week: s.day_of_week,
              start_time: s.start_time,
              end_time: s.end_time,
              is_active: s.is_active,
            }));

            const { error } = await supabase
              .from("availability")
              .upsert(rows, { onConflict: "business_id,day_of_week" });
            toolResult = error ? `Error: ${error.message}` : `Updated ${rows.length} day(s) of availability.`;
          } else if (tc.function.name === "get_services") {
            const { data: services } = await supabase
              .from("services")
              .select("id, name, price, duration_mins, is_active")
              .eq("business_id", businessId)
              .order("name");
            toolResult = JSON.stringify(services ?? []);
          } else if (tc.function.name === "update_service") {
            const { service_id, ...updates } = args as Record<string, unknown> & { service_id: string };
            const validUpdates: Record<string, unknown> = {};
            if (updates.name !== undefined) validUpdates.name = updates.name;
            if (updates.price !== undefined) validUpdates.price = updates.price;
            if (updates.duration_mins !== undefined) validUpdates.duration_mins = updates.duration_mins;
            if (updates.is_active !== undefined) validUpdates.is_active = updates.is_active;

            const { error } = await supabase
              .from("services")
              .update(validUpdates)
              .eq("id", service_id)
              .eq("business_id", businessId);
            toolResult = error ? `Error: ${error.message}` : "Service updated.";
          } else if (tc.function.name === "get_analytics_summary") {
            const period = (args.period as string) ?? "30d";
            const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
            const since = new Date();
            since.setDate(since.getDate() - days);

            const { data: bookings } = await supabase
              .from("bookings")
              .select("status, total_price, payment_status")
              .eq("business_id", businessId)
              .gte("starts_at", since.toISOString());

            const all = bookings ?? [];
            const confirmed = all.filter((b) => b.status === "confirmed");
            const revenue = confirmed
              .filter((b) => b.payment_status === "paid")
              .reduce((sum, b) => sum + Number(b.total_price), 0);

            toolResult = JSON.stringify({
              period,
              total_bookings: all.length,
              confirmed: confirmed.length,
              pending: all.filter((b) => b.status === "pending").length,
              cancelled: all.filter((b) => b.status === "cancelled").length,
              revenue_usd: revenue.toFixed(2),
            });
          }

          runMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: toolResult,
          } as OpenAI.Chat.Completions.ChatCompletionToolMessageParam);
        }
      }

      return NextResponse.json({ message: finalText });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
