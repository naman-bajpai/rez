"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Send } from "lucide-react";

type ConvMessage = { role: "guest" | "provider"; content: string; created_at: string };

const STYLES = `
  .pbc-shell {
    border-radius: 18px;
    border: 1px solid #E4DDD4;
    background: white;
    box-shadow: 0 2px 20px -6px rgba(26,22,20,0.08);
    overflow: hidden;
    font-family: 'DM Sans', -apple-system, sans-serif;
    --c-text: #1A1614;
    --c-sub: #7C736D;
    --c-muted: #ABA39D;
    --c-border: #E4DDD4;
    --c-accent: #B86332;
    --c-accent-soft: #FBF0E9;
    --c-accent-ring: rgba(184,99,50,0.14);
  }

  .pbc-bubble-p {
    max-width: 78%;
    padding: 10px 14px;
    border-radius: 16px 16px 16px 3px;
    background: #F5F1EA;
    border: 1px solid #E4DDD4;
    font-size: 13.5px; line-height: 1.55;
    color: var(--c-text);
  }

  .pbc-bubble-g {
    max-width: 78%;
    padding: 10px 14px;
    border-radius: 16px 16px 3px 16px;
    background: #1A1614;
    color: white;
    font-size: 13.5px; line-height: 1.55;
  }

  .pbc-input {
    flex: 1; height: 42px; padding: 0 14px;
    border-radius: 11px; border: 1.5px solid #E4DDD4;
    background: #FAFAF7;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #1A1614;
    outline: none; transition: all 0.15s;
  }
  .pbc-input:focus {
    border-color: var(--c-accent, #B86332);
    box-shadow: 0 0 0 3px rgba(184,99,50,0.13);
    background: white;
  }
  .pbc-input::placeholder { color: #ABA39D; }

  .pbc-send {
    width: 42px; height: 42px; border-radius: 11px;
    background: #1A1614; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.15s;
  }
  .pbc-send:hover:not(:disabled) { background: #26201C; transform: translateY(-1px); }
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

export function PostBookingChat({ slug, bookingId }: { slug: string; bookingId: string }) {
  const [messages, setMessages] = useState<ConvMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`bk_guest_${slug}`);
      if (stored) setToken((JSON.parse(stored) as { token: string }).token);
    } catch { /* ignore */ }
  }, [slug]);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`/api/book/${slug}/conversations?booking_id=${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then((d: { messages?: ConvMessage[] }) => { setMessages(d.messages ?? []); setLoading(false); })
      .catch(() => setLoading(false));
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
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4DDD4", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "#F5F1EA", border: "1px solid #E4DDD4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C736D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1A1614" }}>Have a question?</p>
            <p style={{ fontSize: 11.5, color: "#ABA39D" }}>Chat about your booking</p>
          </div>
        </div>

        {/* Messages */}
        <div style={{ height: 220, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, background: "#FAFAF7" }}>
          {loading ? (
            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: 6, color: "#ABA39D" }}>
              <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 12 }}>Loading…</span>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 13, color: "#ABA39D" }}>No messages yet. Say hi!</p>
            </div>
          ) : messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "12px 14px", borderTop: "1px solid #E4DDD4", display: "flex", gap: 8, background: "white" }}>
          <input
            className="pbc-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything about your booking…"
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
