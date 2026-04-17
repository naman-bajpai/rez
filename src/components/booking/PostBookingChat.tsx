"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { Loader2, Send } from "lucide-react";

type ConvMessage = { role: "guest" | "provider"; content: string; created_at: string };

const STYLES = `
  .pbc-shell {
    border-radius: 18px;
    border: 1px solid #E4E4E7;
    background: white;
    box-shadow: 0 2px 20px -6px rgba(24,24,27,0.08);
    overflow: hidden;
    font-family: 'DM Sans', -apple-system, sans-serif;
    --c-text: #18181B;
    --c-sub: #3F3F46;
    --c-muted: #71717A;
    --c-border: #E4E4E7;
    --c-accent: #7C3AED;
    --c-accent-soft: #F5F3FF;
    --c-accent-ring: rgba(124,58,237,0.14);
  }

  .pbc-bubble-p {
    max-width: 78%;
    padding: 10px 14px;
    border-radius: 16px 16px 16px 3px;
    background: var(--c-accent-soft);
    border: 1px solid var(--c-border);
    font-size: 13.5px; line-height: 1.55;
    color: var(--c-text);
  }

  .pbc-bubble-g {
    max-width: 78%;
    padding: 10px 14px;
    border-radius: 16px 16px 3px 16px;
    background: var(--c-accent);
    color: white;
    font-size: 13.5px; line-height: 1.55;
  }

  .pbc-input {
    flex: 1; height: 42px; padding: 0 14px;
    border-radius: 11px; border: 1.5px solid var(--c-border);
    background: white;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: var(--c-text);
    outline: none; transition: all 0.15s;
  }
  .pbc-input:focus {
    border-color: var(--c-accent, #7C3AED);
    box-shadow: 0 0 0 3px var(--c-accent-ring);
    background: white;
  }
  .pbc-input::placeholder { color: var(--c-muted); }

  .pbc-send {
    width: 42px; height: 42px; border-radius: 11px;
    background: var(--c-accent); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.15s;
  }
  .pbc-send:hover:not(:disabled) { background: #6D28D9; transform: translateY(-1px); }
  .pbc-send:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pbcIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  .pbc-in { animation: pbcIn 0.28s cubic-bezier(0.16,1,0.3,1) both; }
`;

function Bubble({ msg }: { msg: ConvMessage }) {
  const isProvider = msg.role === "provider";
  return (
    <div className="pbc-in" style={{ display: "flex", justifyContent: isProvider ? "flex-start" : "flex-end" }}>
      <div className={isProvider ? "pbc-bubble-p" : "pbc-bubble-g"}>
        {msg.content}
      </div>
    </div>
  );
}

function readGuestToken(slug: string) {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(`bk_guest_${slug}`);
    return stored ? (JSON.parse(stored) as { token: string }).token : null;
  } catch {
    return null;
  }
}

export function PostBookingChat({ slug, bookingId }: { slug: string; bookingId: string }) {
  const [messages, setMessages] = useState<ConvMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const token = useSyncExternalStore(
    useCallback((onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const handler = (event: StorageEvent) => {
        if (!event.key || event.key === `bk_guest_${slug}`) onStoreChange();
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    }, [slug]),
    useCallback(() => readGuestToken(slug), [slug]),
    () => null
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`/api/book/${slug}/conversations?booking_id=${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then((d: { messages?: ConvMessage[] }) => {
        if (cancelled) return;
        setMessages(d.messages ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token, slug, bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !token) return;
    setInput(""); setSending(true);

    const optimistic: ConvMessage = { role: "guest", content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/book/${slug}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ booking_id: bookingId, message: text }),
      });
      const data = await res.json() as { ai_reply?: ConvMessage };
      if (res.ok && data.ai_reply) setMessages(prev => [...prev, data.ai_reply!]);
    } catch { /* ignore */ }

    setSending(false);
  };

  if (!token) return null;

  return (
    <>
      <style>{STYLES}</style>
      <div className="pbc-shell">
        {/* Header */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--c-border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--c-accent-soft)", border: "1px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-sub)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>Booking assistant</p>
            <p style={{ fontSize: 11.5, color: "var(--c-muted)" }}>Ask about changes to this booking</p>
          </div>
        </div>

        {/* Messages */}
        <div style={{ height: 220, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, background: "var(--c-accent-soft)" }}>
          {loading ? (
            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: 6, color: "var(--c-muted)" }}>
              <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 12 }}>Loading…</span>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 13, color: "var(--c-muted)" }}>No messages yet. Ask about your booking.</p>
            </div>
          ) : messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "12px 14px", borderTop: "1px solid var(--c-border)", display: "flex", gap: 8, background: "white" }}>
          <input
            className="pbc-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about this booking..."
            disabled={sending || loading}
          />
          <button type="button" className="pbc-send" onClick={send} disabled={!input.trim() || sending || loading}>
            {sending
              ? <Loader2 style={{ width: 14, height: 14, color: "white", animation: "spin 1s linear infinite" }} />
              : <Send style={{ width: 14, height: 14, color: "white" }} />
            }
          </button>
        </div>
      </div>
    </>
  );
}
