/**
 * Send OTP email via Resend (falls back to console in dev if key not set).
 */
export async function sendOtpEmail(
  to: string,
  code: string,
  name?: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "noreply@rezapp.com";

  const subject = "Your booking verification code";
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #7c3aed;">Your verification code</h2>
      <p>Hi${name ? ` ${name}` : ""},</p>
      <p>Use the code below to verify your booking. It expires in 10 minutes.</p>
      <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #7c3aed;">${code}</span>
      </div>
      <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  if (!apiKey) {
    // Dev fallback — log to console
    console.log(`[EMAIL DEV] To: ${to} | OTP Code: ${code}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[EMAIL ERROR]", err);
    throw new Error("Failed to send verification email.");
  }
}
