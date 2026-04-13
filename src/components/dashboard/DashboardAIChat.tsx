"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, X, Loader2, Sparkles, Trash2 } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Show today's bookings",
  "Confirm all pending",
  "What's my revenue this month?",
  "Set hours Mon–Fri 9am–6pm",
];

/* ── Dot loader ── */
function Dots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-[5px] w-[5px] rounded-full"
          style={{
            background: "var(--dash-muted)",
            animation: `rez-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Single message bubble ── */
function Bubble({ msg }: { msg: Message }) {
  const user = msg.role === "user";
  return (
    <div className={`flex w-full ${user ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[78%] rounded-2xl px-3.5 py-2 text-[13px] leading-[1.6]"
        style={
          user
            ? {
                background: "var(--dash-accent)",
                color: "var(--dash-accent-fg)",
                borderBottomRightRadius: 4,
              }
            : {
                background: "var(--dash-surface-elevated)",
                color: "var(--dash-text)",
                border: "1px solid var(--dash-border)",
                borderBottomLeftRadius: 4,
              }
        }
      >
        {msg.content.split("\n").map((l, i, arr) => (
          <span key={i}>
            {l}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ── */
export function DashboardAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* scroll to bottom whenever messages change */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* focus input when panel opens */
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 200);
  }, [open]);

  /* reset textarea height helper */
  function resetHeight(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  }

  const send = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || loading) return;

      const history: Message[] = [...messages, { role: "user", content }];
      setMessages(history);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      setLoading(true);

      try {
        const res = await fetch("/api/dashboard-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        const data = (await res.json()) as { message?: string; error?: string };
        setMessages([
          ...history,
          { role: "assistant", content: data.message ?? data.error ?? "Something went wrong." },
        ]);
      } catch {
        setMessages([...history, { role: "assistant", content: "Connection error. Try again." }]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages]
  );

  return (
    <>
      {/* ── FAB trigger — fixed, never touches layout ── */}
      <button
        type="button"
        aria-label="Open Rez AI"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full py-2.5 pl-4 pr-5 text-[13px] font-semibold shadow-lg transition-transform hover:scale-[1.04] active:scale-[0.97]"
        style={{
          background: "var(--dash-accent)",
          color: "var(--dash-accent-fg)",
          boxShadow: "0 4px 24px -4px oklch(0.38 0.09 180 / 0.45), 0 1px 4px oklch(0 0 0 / 0.12)",
          display: open ? "none" : "flex",
        }}
      >
        <Sparkles className="h-4 w-4 shrink-0" />
        Ask Rez AI
      </button>

      {/* ── Backdrop ── */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-40 transition-opacity duration-200"
        style={{
          background: "oklch(0 0 0 / 0.3)",
          pointerEvents: open ? "auto" : "none",
          opacity: open ? 1 : 0,
        }}
      />

      {/* ── Chat panel ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Rez AI chat"
        className="fixed bottom-0 right-0 top-0 z-50 flex flex-col"
        style={{
          width: "min(440px, 100vw)",
          background: "var(--dash-surface)",
          borderLeft: "1px solid var(--dash-border)",
          backdropFilter: "blur(24px)",
          boxShadow: "-12px 0 48px -12px oklch(0 0 0 / 0.2)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--dash-divider)" }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "var(--rez-highlight)", border: "1px solid var(--rez-glow-dim)" }}
          >
            <Bot className="h-4 w-4" style={{ color: "var(--rez-glow)" }} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-none" style={{ color: "var(--dash-text)" }}>
              Rez AI
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: "var(--dash-muted)" }}>
              Business command assistant
            </p>
          </div>

          <div className="flex items-center gap-0.5">
            {messages.length > 0 && (
              <button
                type="button"
                title="Clear chat"
                onClick={() => setMessages([])}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--dash-surface-muted)]"
              >
                <Trash2 className="h-3.5 w-3.5" style={{ color: "var(--dash-muted)" }} />
              </button>
            )}
            <button
              type="button"
              title="Close"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--dash-surface-muted)]"
            >
              <X className="h-4 w-4" style={{ color: "var(--dash-muted)" }} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            /* Empty state */
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
              <div>
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: "var(--rez-highlight)", border: "1px solid var(--rez-glow-dim)" }}
                >
                  <Sparkles className="h-5 w-5" style={{ color: "var(--rez-glow)" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                  What do you need?
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--dash-muted)" }}>
                  Manage bookings, hours, and services with plain English.
                </p>
              </div>

              <div className="flex w-full flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors hover:opacity-80"
                    style={{
                      background: "var(--dash-surface-elevated)",
                      border: "1px solid var(--dash-border)",
                      color: "var(--dash-text-secondary)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((m, i) => (
                <Bubble key={i} msg={m} />
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div
                    className="rounded-2xl px-3.5 py-2"
                    style={{
                      background: "var(--dash-surface-elevated)",
                      border: "1px solid var(--dash-border)",
                      borderBottomLeftRadius: 4,
                    }}
                  >
                    <Dots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div
          className="shrink-0 p-4"
          style={{ borderTop: "1px solid var(--dash-divider)" }}
        >
          <div
            className="flex items-end gap-2 rounded-xl px-3.5 py-2"
            style={{
              background: "var(--dash-input-bg)",
              border: "1px solid var(--dash-border-strong)",
            }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              disabled={loading}
              placeholder="Message Rez AI…"
              onChange={(e) => {
                setInput(e.target.value);
                resetHeight(e.target);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className="flex-1 resize-none bg-transparent py-1 text-[13px] outline-none disabled:opacity-50"
              style={{
                color: "var(--dash-text)",
                minHeight: 24,
                maxHeight: 128,
                lineHeight: "1.5",
              }}
            />
            <button
              type="button"
              disabled={!input.trim() || loading}
              onClick={() => send()}
              className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-opacity disabled:opacity-30"
              style={{ background: "var(--dash-accent)", color: "var(--dash-accent-fg)" }}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-[10px]" style={{ color: "var(--dash-muted)" }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      <style>{`
        @keyframes rez-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
