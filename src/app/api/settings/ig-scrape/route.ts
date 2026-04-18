/**
 * POST /api/settings/ig-scrape
 *
 * Uses the business's connected IG page access token to:
 *   1. Resolve the IG Business Account ID from the linked Page
 *   2. Fetch profile bio + last 30 post captions via Meta Graph API
 *   3. Run GPT-4o extraction to produce a structured BUSINESS KNOWLEDGE block
 *   4. Save the result to businesses.ai_context
 */

import { NextResponse } from "next/server";
import { withBusiness, authRoute } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { getOpenAI } from "@/lib/server/openai";

type GraphError = { message: string };

type PageResponse = {
  instagram_business_account?: { id: string };
  error?: GraphError;
};

type ProfileResponse = {
  biography?: string;
  name?: string;
  username?: string;
  followers_count?: number;
  website?: string;
  error?: GraphError;
};

type MediaItem = {
  caption?: string;
  media_type?: string;
  timestamp?: string;
};

type MediaResponse = {
  data?: MediaItem[];
  error?: GraphError;
};

const GRAPH = "https://graph.facebook.com/v21.0";

export async function POST(request: Request) {
  return authRoute(() =>
    withBusiness(request, async ({ businessId }) => {
      const supabase = createServiceRoleClient();

      const { data: biz } = await supabase
        .from("businesses")
        .select("name, ig_page_id, ig_page_access_token")
        .eq("id", businessId)
        .maybeSingle();

      const row = biz as {
        name?: string;
        ig_page_id?: string | null;
        ig_page_access_token?: string | null;
      } | null;

      const pageId = row?.ig_page_id ?? null;
      const pageToken = row?.ig_page_access_token ?? null;

      if (!pageId || !pageToken) {
        return NextResponse.json(
          { error: "Connect your Instagram page in Settings → Integrations first." },
          { status: 422 }
        );
      }

      // Step 1 — resolve IG Business Account ID from the Facebook Page
      const pageRes = await fetch(
        `${GRAPH}/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
      );
      const pageData = (await pageRes.json()) as PageResponse;

      if (!pageRes.ok || !pageData.instagram_business_account?.id) {
        return NextResponse.json(
          {
            error:
              pageData.error?.message ??
              "Could not find an Instagram Business account linked to this page. Make sure your IG is set to a Business or Creator account.",
          },
          { status: 422 }
        );
      }

      const igAccountId = pageData.instagram_business_account.id;

      // Step 2 — fetch profile + recent media captions in parallel
      const [profileRes, mediaRes] = await Promise.all([
        fetch(
          `${GRAPH}/${igAccountId}?fields=biography,name,username,followers_count,website&access_token=${pageToken}`
        ),
        fetch(
          `${GRAPH}/${igAccountId}/media?fields=caption,media_type,timestamp&limit=30&access_token=${pageToken}`
        ),
      ]);

      const profile = (await profileRes.json()) as ProfileResponse;
      const media = (await mediaRes.json()) as MediaResponse;

      if (!profileRes.ok) {
        return NextResponse.json(
          { error: profile.error?.message ?? "Failed to fetch Instagram profile." },
          { status: 502 }
        );
      }

      const captions = (media.data ?? [])
        .filter((m) => m.caption)
        .map((m) => m.caption!.trim())
        .join("\n\n---\n\n");

      const rawInput = `
Instagram handle: @${profile.username ?? "unknown"}
Business name: ${profile.name ?? row?.name ?? ""}
Bio: ${profile.biography ?? "(none)"}
Website: ${profile.website ?? "(none)"}
Followers: ${profile.followers_count ?? "unknown"}

Recent post captions:
${captions || "(no captions found)"}
      `.trim();

      // Step 3 — GPT-4o structured extraction
      const openai = getOpenAI();
      const extraction = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 1400,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `You are a business intelligence extractor. Given raw Instagram data for a service business, extract a concise, factual knowledge base that an AI booking assistant will use as its ONLY source of truth.

CRITICAL: Only include information that is clearly stated or strongly implied in the input. Do not invent, estimate, or infer beyond what is explicitly present.

Output plain text using the following section headers (omit any section with no evidence):

## SERVICES & PRICING
List each service name and price if mentioned. Be specific.

## BOOKING POLICIES
Cancellation rules, deposit requirements, no-show policy, advance booking requirements.

## BUSINESS HOURS
Days and hours if mentioned.

## SPECIALTIES & STYLE
What this business is known for. Aesthetic, techniques, client types, vibe.

## LOCATION
Address or area if mentioned.

## COMMON CLIENT QUESTIONS
Any FAQs apparent from the content (e.g. "Do you do nail extensions?" → yes/no based on evidence).

## COMMUNICATION TONE
How the owner communicates (e.g. casual/warm, professional, emoji-heavy, brief).

If a section has zero evidence, skip it entirely. This knowledge base will be read verbatim by an AI — precision matters more than completeness.`,
          },
          {
            role: "user",
            content: rawInput,
          },
        ],
      });

      const aiContext = extraction.choices[0].message.content ?? "";

      // Step 4 — persist
      await supabase
        .from("businesses")
        .update({
          ai_context: aiContext,
          ig_username: profile.username ?? null,
          ai_context_synced_at: new Date().toISOString(),
        })
        .eq("id", businessId);

      return NextResponse.json({
        ai_context: aiContext,
        ig_username: profile.username ?? null,
      });
    })
  );
}
