import { createServiceRoleClient } from "./supabase";
import crypto from "crypto";

/**
 * OTP helpers, guest session validation, slugify for public booking flows.
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Generate a 6-digit OTP */
export function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

/** Store OTP in DB and send email */
export async function createAndSendOtp(
  email: string,
  businessId: string,
  name: string
): Promise<void> {
  const supabase = createServiceRoleClient();
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  // Clean up old OTPs
  await supabase
    .from("guest_otps")
    .delete()
    .eq("email", email)
    .eq("business_id", businessId);

  const { error } = await supabase.from("guest_otps").insert({
    email,
    business_id: businessId,
    code,
    expires_at: expiresAt,
    used: false,
  });

  if (error) throw new Error(error.message);

  // Send email
  const { sendOtpEmail } = await import("./email");
  await sendOtpEmail(email, code, name);
}

/** Verify OTP code and create a guest session */
export async function verifyOtpAndCreateSession(
  email: string,
  businessId: string,
  code: string,
  name: string
): Promise<string> {
  const supabase = createServiceRoleClient();

  const { data: otp, error } = await supabase
    .from("guest_otps")
    .select("id, expires_at, used")
    .eq("email", email)
    .eq("business_id", businessId)
    .eq("code", code)
    .maybeSingle();

  if (error || !otp) throw new Error("Invalid or expired code.");
  if (otp.used) throw new Error("Code has already been used.");
  if (new Date(otp.expires_at as string) < new Date())
    throw new Error("Code has expired.");

  // Mark used
  await supabase.from("guest_otps").update({ used: true }).eq("id", otp.id);

  // Create guest session
  const { data: session, error: sessErr } = await supabase
    .from("guest_sessions")
    .insert({
      email,
      name,
      business_id: businessId,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("token")
    .single();

  if (sessErr || !session) throw new Error("Failed to create session.");

  return session.token as string;
}

export type GuestSession = {
  token: string;
  email: string;
  name: string;
  businessId: string;
};

/** Validate a guest session token scoped to a business */
export async function verifyGuestSession(
  token: string,
  businessId: string
): Promise<GuestSession> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("guest_sessions")
    .select("token, email, name, business_id, expires_at")
    .eq("token", token)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error || !data) throw new Error("Unauthorized");
  if (new Date(data.expires_at as string) < new Date())
    throw new Error("Session expired");

  return {
    token: data.token as string,
    email: data.email as string,
    name: data.name as string,
    businessId: data.business_id as string,
  };
}
