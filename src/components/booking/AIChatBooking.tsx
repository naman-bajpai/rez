"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Send, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ChatMessage = { role: "user" | "assistant"; content: string };

type Business = { id: string; name: string; slug: string; owner_name?: string };
type Service = { id: string; name: string; duration_mins: number; price: number };
type GuestSession = { token: string; email: string; name: string };
type BookingStage = "Service" | "Verify" | "Slot" | "Confirm";

// ─── Styles ────────────────────────────────────────────────────────────────────

const CHAT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .bk-chat {
    font-family: 'DM Sans', -apple-system, sans-serif;
    --c-bg: #F8F8FC;
    --c-surface: #FFFFFF;
    --c-text: #18181B;
    --c-sub: #3F3F46;
    --c-muted: #71717A;
    --c-border: #E4E4E7;
    --c-accent: #7C3AED;
    --c-accent-soft: #F5F3FF;
    --c-accent-ring: rgba(124,58,237,0.14);
    color: var(--c-text);
  }

  .bk-chat-serif { font-family: 'Fraunces', Georgia, serif; }

  .bk-stage-wrap {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .bk-stage-pill {
    padding: 4px 9px;
    border-radius: 999px;
    border: 1px solid var(--c-border);
    background: white;
    color: var(--c-muted);
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .bk-stage-pill.active {
    border-color: var(--c-accent);
    background: var(--c-accent-soft);
    color: var(--c-accent);
  }

  /* Shell */
  .bk-chat-shell {
    border-radius: 22px;
    border: 1px solid var(--c-border);
    background: var(--c-surface);
    box-shadow: 0 2px 32px -8px rgba(26,22,20,0.10);
    display: flex;
    flex-direction: column;
    min-height: 560px;
    overflow: hidden;
  }

  /* Bubbles */
  .bk-bubble-ai {
    max-width: 82%;
    padding: 11px 15px;
    border-radius: 18px 18px 18px 4px;
    background: var(--c-accent-soft);
    border: 1px solid var(--c-border);
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--c-text);
  }

  .bk-bubble-user {
    max-width: 82%;
    padding: 11px 15px;
    border-radius: 18px 18px 4px 18px;
    background: var(--c-accent);
    color: white;
    font-size: 13.5px;
    line-height: 1.6;
  }

  /* Typing dots */
  @keyframes bkDot {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
    40% { transform: translateY(-5px); opacity: 1; }
  }

  /* Chat input */
  .bk-chat-input {
    flex: 1; height: 44px; padding: 0 16px;
    border-radius: 12px; border: 1.5px solid var(--c-border);
    background: #FFFFFF;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--c-text);
    outline: none; transition: all 0.15s ease;
  }
  .bk-chat-input:focus {
    border-color: var(--c-accent);
    box-shadow: 0 0 0 3px var(--c-accent-ring);
    background: white;
  }
  .bk-chat-input::placeholder { color: var(--c-muted); }

  /* Send button */
  .bk-send {
    width: 44px; height: 44px; border-radius: 12px;
    background: var(--c-text); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.18s ease;
  }
  .bk-send:hover:not(:disabled) {
    background: #6D28D9;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px -4px rgba(26,22,20,0.22);
  }
  .bk-send:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }

  /* OTP inline */
  .bk-otp-card {
    border-radius: 16px;
    border: 1.5px solid var(--c-border);
    background: white;
    padding: 18px;
    box-shadow: 0 2px 12px -4px rgba(26,22,20,0.06);
    max-width: 280px;
  }

  .bk-otp-input {
    width: 100%; height: 56px; border-radius: 12px;
    border: 1.5px solid var(--c-border); background: #FFFFFF;
    font-family: 'DM Sans', monospace; font-size: 22px; font-weight: 600;
    letter-spacing: 0.3em; text-align: center; color: var(--c-text);
    outline: none; transition: all 0.15s;
    -webkit-appearance: none;
  }
  .bk-otp-input:focus {
    border-color: var(--c-accent);
    box-shadow: 0 0 0 3px var(--c-accent-ring);
    background: white;
  }

  .bk-otp-btn {
    width: 100%; height: 42px; border-radius: 10px;
    background: var(--c-text); color: white; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    transition: all 0.15s;
  }
  .bk-otp-btn:hover:not(:disabled) { background: #6D28D9; }
  .bk-otp-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes bkIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .bk-in { animation: bkIn 0.3s cubic-bezier(0.16,1,0.3,1) both; }
`;

// ─── Bubble ────────────────────────────────────────────────────────────────────

function Bubble({ msg, delay = 0 }: { msg: ChatMessage; delay?: number }) {
  const isAi = msg.role === "assistant";
  return (
    <div
      className="bk-in"
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        justifyContent: isAi ? "flex-start" : "flex-end",
        animationDelay: `${delay}ms`,
      }}
    >
      {isAi && (
        <div style={{
          width: 28, height: 28, borderRadius: 10,
          background: "var(--c-text)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginBottom: 2,
        }}>
          <Sparkles style={{ width: 13, height: 13, color: "white" }} />
        </div>
      )}
      <div className={isAi ? "bk-bubble-ai" : "bk-bubble-user"}>
        {msg.content}
      </div>
    </div>
  );
}

// ─── Typing indicator ──────────────────────────────────────────────────────────

function Typing() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 10,
        background: "var(--c-text)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginBottom: 2,
      }}>
        <Sparkles style={{ width: 13, height: 13, color: "white" }} />
      </div>
      <div style={{
        padding: "12px 16px",
        borderRadius: "18px 18px 18px 4px",
        background: "var(--c-accent-soft)",
        border: "1px solid var(--c-border)",
        display: "flex", gap: 5, alignItems: "center",
      }}>
        {[0, 160, 320].map(d => (
          <span key={d} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--c-muted)",
            animation: `bkDot 1.1s ${d}ms ease-in-out infinite`,
            display: "block",
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── OTP Form ──────────────────────────────────────────────────────────────────

function OtpForm({ email, name, slug, onVerified }: {
  email: string; name: string; slug: string;
  onVerified: (session: GuestSession) => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verify = async () => {
    if (code.length !== 6) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/book/${slug}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, code }),
      });
      const data = await res.json() as { token?: string; email?: string; name?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      const session: GuestSession = { token: data.token!, email: data.email!, name: data.name! };
      localStorage.setItem(`bk_guest_${slug}`, JSON.stringify(session));
      onVerified(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="bk-otp-card bk-in" style={{ animationDelay: "100ms" }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--c-sub)", marginBottom: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        Code sent to {email}
      </p>
      <input
        className="bk-otp-input"
        placeholder="——————"
        maxLength={6}
        value={code}
        onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
        onKeyDown={e => { if (e.key === "Enter") verify(); }}
        autoFocus
        style={{ marginBottom: 10 }}
      />
      {error && <p style={{ fontSize: 12, color: "#BE3A2C", marginBottom: 8, textAlign: "center" }}>{error}</p>}
      <button type="button" className="bk-otp-btn" onClick={verify} disabled={code.length !== 6 || loading}>
        {loading ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : "Verify email"}
      </button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function AIChatBooking({
  slug,
  business,
}: {
  slug: string;
  business: Business;
  services: Service[];
}) {
  const storageKey = `bk_guest_${slug}`;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
  const [pendingOtp, setPendingOtp] = useState<{ email: string; name: string } | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stageOrder: BookingStage[] = useMemo(() => ["Service", "Verify", "Slot", "Confirm"], []);
  const currentStage: BookingStage = useMemo(() => {
    if (successUrl) return "Confirm";
    if (pendingOtp) return "Verify";
    if (guestSession) return "Slot";
    return "Service";
  }, [successUrl, pendingOtp, guestSession]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setGuestSession(JSON.parse(stored) as GuestSession);
    } catch { /* ignore */ }
  }, [storageKey]);

  useEffect(() => {
    const greet = async () => {
      setLoading(true);
      await sendToAI([], null, true);
      setLoading(false);
    };
    greet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendToAI = useCallback(async (
    msgHistory: ChatMessage[],
    session: GuestSession | null,
    isGreeting = false
  ) => {
    try {
      const res = await fetch(`/api/book/${slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: isGreeting
            ? [{ role: "user", content: `Hello! I'm on ${business.name}'s booking page.` }]
            : msgHistory,
          guest_token: session?.token,
        }),
      });
      const data = await res.json() as {
        message: string; action: string | null;
        otp_email: string | null; otp_name: string | null;
        booking_id: string | null; success_url: string | null;
      };
      if (!res.ok) return;

      const aiMsg: ChatMessage = { role: "assistant", content: data.message };
      if (isGreeting) setMessages([aiMsg]);
      else setMessages(prev => [...prev, aiMsg]);

      if (data.action === "otp_requested" && data.otp_email) {
        setPendingOtp({ email: data.otp_email, name: data.otp_name ?? "" });
      }
      if (data.action === "booking_created" && data.success_url) {
        setSuccessUrl(data.success_url);
        setTimeout(() => { window.location.href = data.success_url!; }, 2000);
      }
    } catch { /* ignore */ }
  }, [slug, business.name]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || !!pendingOtp) return;
    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    await sendToAI(newMessages, guestSession);
    setLoading(false);
  };

  const handleOtpVerified = async (session: GuestSession) => {
    setGuestSession(session); setPendingOtp(null);
    const verifiedMsg: ChatMessage = { role: "user", content: "I verified my email!" };
    const newMessages = [...messages, verifiedMsg];
    setMessages(newMessages);
    setLoading(true);
    await sendToAI(newMessages, session);
    setLoading(false);
  };

  return (
    <div className="bk-chat">
      <style>{CHAT_STYLES}</style>

      {/* Wordmark */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span className="bk-chat-serif" style={{ fontStyle: "italic", fontWeight: 300, fontSize: 17, color: "var(--c-muted)" }}>rez</span>
        {guestSession ? (
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--c-sub)", background: "white", border: "1px solid var(--c-border)", borderRadius: 20, padding: "4px 10px" }}>
            <CheckCircle2 style={{ width: 11, height: 11, color: "var(--c-accent)" }} />
            {guestSession.name}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "var(--c-sub)" }}>Guided booking chat</span>
        )}
      </div>

      {/* Chat shell */}
      <div className="bk-chat-shell">
        {/* Header */}
        <div style={{
          padding: "18px 20px 16px",
          borderBottom: "1px solid var(--c-border)",
          display: "flex", alignItems: "center", gap: 12,
          background: "white",
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "var(--c-text)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Sparkles style={{ width: 16, height: 16, color: "white" }} />
          </div>
          <div>
            <p className="bk-chat-serif" style={{ fontSize: 16, fontWeight: 400, color: "var(--c-text)", lineHeight: 1.2 }}>
              {business.name}
            </p>
            <p style={{ fontSize: 11.5, color: "var(--c-muted)", marginTop: 1 }}>
              {business.owner_name ? `with ${business.owner_name} · ` : ""}AI booking assistant
            </p>
            <div className="bk-stage-wrap" style={{ marginTop: 8 }}>
              {stageOrder.map((stage) => (
                <span key={stage} className={`bk-stage-pill${stage === currentStage ? " active" : ""}`}>
                  {stage}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: "20px 18px",
          display: "flex", flexDirection: "column", gap: 12,
          background: "#FFFFFF",
        }}>
          {messages.map((msg, i) => (
            <Bubble key={i} msg={msg} delay={0} />
          ))}

          {loading && <Typing />}

          {pendingOtp && !loading && (
            <OtpForm
              email={pendingOtp.email}
              name={pendingOtp.name}
              slug={slug}
              onVerified={handleOtpVerified}
            />
          )}

          {successUrl && (
            <div className="bk-in" style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 16px", borderRadius: 14,
              background: "#EDFAF3", border: "1px solid #A7F0C4",
              fontSize: 13.5, fontWeight: 500, color: "#1A7A4A",
              maxWidth: 280,
            }}>
              <CheckCircle2 style={{ width: 16, height: 16 }} />
              Booked! Redirecting…
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "14px 16px",
          borderTop: "1px solid var(--c-border)",
          background: "white",
          display: "flex", gap: 10,
        }}>
          <input
            className="bk-chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message…"
            disabled={loading || !!successUrl || !!pendingOtp}
          />
          <button
            type="button"
            className="bk-send"
            onClick={handleSend}
            disabled={!input.trim() || loading || !!successUrl || !!pendingOtp}
          >
            {loading
              ? <Loader2 style={{ width: 16, height: 16, color: "white", animation: "spin 1s linear infinite" }} />
              : <Send style={{ width: 15, height: 15, color: "white" }} />
            }
          </button>
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: 11, color: "var(--c-border)", marginTop: 16 }}>
        Powered by Rez
      </p>
    </div>
  );
}
