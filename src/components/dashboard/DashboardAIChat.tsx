"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot,
  Send,
  X,
  Loader2,
  Sparkles,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Message = { role: "user" | "assistant"; content: string };

const QUICK_COMMANDS = [
  "Show today's bookings",
  "Confirm all pending bookings",
  "What's my revenue this month?",
  "Block off next Monday",
  "Show upcoming appointments",
];

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--rez-highlight)", border: "1px solid var(--rez-glow-dim)" }}
        >
          <Bot className="h-3.5 w-3.5" style={{ color: "var(--rez-glow)" }} />
        </div>
      )}
      <div
        className="max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed"
        style={
          isUser
            ? {
                background: "var(--dash-accent)",
                color: "var(--dash-accent-fg)",
                borderBottomRightRadius: "6px",
              }
            : {
                background: "var(--dash-surface-elevated)",
                color: "var(--dash-text)",
                border: "1px solid var(--dash-border)",
                borderBottomLeftRadius: "6px",
              }
        }
      >
        {msg.content.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < msg.content.split("\n").length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex gap-2.5">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ background: "var(--rez-highlight)", border: "1px solid var(--rez-glow-dim)" }}
      >
        <Bot className="h-3.5 w-3.5" style={{ color: "var(--rez-glow)" }} />
      </div>
      <div
        className="flex items-center gap-1 rounded-2xl px-4 py-3"
        style={{
          background: "var(--dash-surface-elevated)",
          border: "1px solid var(--dash-border)",
          borderBottomLeftRadius: "6px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--dash-muted)",
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function DashboardAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const send = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || loading) return;

      const next: Message[] = [...messages, { role: "user", content }];
      setMessages(next);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/dashboard-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next }),
        });
        const data = (await res.json()) as { message?: string; error?: string };
        setMessages([
          ...next,
          {
            role: "assistant",
            content: data.message ?? data.error ?? "Something went wrong.",
          },
        ]);
      } catch {
        setMessages([
          ...next,
          { role: "assistant", content: "Couldn't reach Rez AI. Check your connection." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages]
  );

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* ── Trigger button (rendered in nav) ── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all"
        style={{
          background: "var(--rez-highlight)",
          border: "1px solid var(--rez-glow-dim)",
          color: "var(--dash-text)",
        }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--rez-glow-dim)" }}
        >
          <Sparkles className="h-4 w-4" style={{ color: "var(--rez-glow)" }} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[13px] font-semibold" style={{ color: "var(--dash-text)" }}>
            Ask Rez AI
          </p>
          <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
            Commands &amp; queries
          </p>
        </div>
        <span className="rez-pulse shrink-0" />
      </button>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-50"
          style={{ background: "oklch(0 0 0 / 0.25)", backdropFilter: "blur(2px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Panel ── */}
      <div
        className="fixed bottom-0 right-0 top-0 z-50 flex flex-col"
        style={{
          width: "clamp(320px, 100vw, 460px)",
          background: "var(--dash-page-bg)",
          borderLeft: "1px solid var(--dash-border)",
          boxShadow: "-24px 0 80px -24px oklch(0 0 0 / 0.18)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center gap-3 px-5 py-4"
          style={{
            borderBottom: "1px solid var(--dash-divider)",
            background: "var(--dash-nav-bg)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "var(--rez-highlight)", border: "1px solid var(--rez-glow-dim)" }}
          >
            <Bot className="h-4.5 w-4.5" style={{ color: "var(--rez-glow)" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
              Rez AI
            </p>
            <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
              Your business command center
            </p>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg"
                onClick={() => setMessages([])}
                title="Clear conversation"
              >
                <Trash2 className="h-3.5 w-3.5" style={{ color: "var(--dash-muted)" }} />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" style={{ color: "var(--dash-muted)" }} />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 px-2 text-center">
              <div>
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{
                    background: "var(--rez-highlight)",
                    border: "1px solid var(--rez-glow-dim)",
                  }}
                >
                  <Sparkles className="h-6 w-6" style={{ color: "var(--rez-glow)" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                  What can I help with?
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--dash-muted)" }}>
                  Ask anything about your bookings, schedule,<br />services, or business analytics.
                </p>
              </div>

              <div className="w-full space-y-2">
                {QUICK_COMMANDS.map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    className="group flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left text-[13px] transition-all"
                    style={{
                      background: "var(--dash-surface-elevated)",
                      border: "1px solid var(--dash-border)",
                      color: "var(--dash-text-secondary)",
                    }}
                    onClick={() => send(cmd)}
                  >
                    <ChevronDown
                      className="h-3.5 w-3.5 shrink-0 -rotate-90"
                      style={{ color: "var(--rez-glow)" }}
                    />
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <ChatBubble key={i} msg={msg} />
              ))}
              {loading && <ThinkingBubble />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div
          className="shrink-0 px-4 pb-4 pt-3"
          style={{ borderTop: "1px solid var(--dash-divider)" }}
        >
          <div
            className="flex items-end gap-2 rounded-2xl px-4 py-2"
            style={{
              background: "var(--dash-input-bg)",
              border: "1px solid var(--dash-border-strong)",
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // auto-grow
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKey}
              placeholder="Message Rez AI…"
              disabled={loading}
              className="flex-1 resize-none bg-transparent py-1.5 text-[13px] outline-none placeholder:opacity-50 disabled:opacity-40"
              style={{ color: "var(--dash-text)", minHeight: "28px", maxHeight: "120px" }}
            />
            <Button
              size="icon"
              disabled={!input.trim() || loading}
              onClick={() => send()}
              className="mb-0.5 h-8 w-8 shrink-0 rounded-xl"
              style={{
                background: input.trim() && !loading ? "var(--dash-accent)" : "var(--dash-surface-muted)",
                color: input.trim() && !loading ? "var(--dash-accent-fg)" : "var(--dash-muted)",
              }}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <p className="mt-1.5 text-center text-[10px]" style={{ color: "var(--dash-muted)" }}>
            Shift+Enter for new line · Enter to send
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}
