"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bot,
  Send,
  Loader2,
  User,
  CalendarDays,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ConvMessage = { role: "guest" | "provider"; content: string; created_at: string };

type Booking = {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  starts_at: string;
  status: string;
  services?: { name: string } | null;
};

type Conversation = {
  id: string;
  booking_id: string;
  messages: ConvMessage[];
  created_at: string;
  updated_at: string;
  bookings: Booking | null;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function displayName(conv: Conversation): string {
  return conv.bookings?.guest_name ?? conv.bookings?.guest_email ?? "Guest";
}

function lastPreview(conv: Conversation): string {
  const msgs = conv.messages;
  if (!msgs.length) return "No messages yet";
  return msgs[msgs.length - 1].content;
}

// ─── Conversation row ──────────────────────────────────────────────────────────

function ConvRow({
  conv,
  active,
  onClick,
}: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const name = displayName(conv);
  const preview = lastPreview(conv);
  const lastRole = conv.messages.at(-1)?.role;

  return (
    <button
      type="button"
      className="inbox-client-row w-full text-left transition-all active:scale-[0.98]"
      data-active={active}
      onClick={onClick}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm"
        style={{
          background: "var(--dash-icon-tile)",
          color: "var(--dash-icon-fg)",
          border: "1px solid var(--dash-border)",
        }}
      >
        {name[0].toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-[13px] font-bold tracking-tight" style={{ color: "var(--dash-text)" }}>
            {name}
          </p>
          <span className="shrink-0 text-[10px] font-medium opacity-60" style={{ color: "var(--dash-muted)" }}>
            {relTime(conv.updated_at)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px]" style={{ color: "var(--dash-muted)" }}>
          {lastRole === "provider" ? (
            <span style={{ color: "var(--rez-glow)", fontWeight: 700 }}>Rez: </span>
          ) : null}
          {preview}
        </p>
        {conv.bookings?.services?.name && (
          <span
            className="mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold"
            style={{ background: "var(--rez-highlight)", color: "var(--dash-text-secondary)", border: "1px solid var(--rez-glow-dim)" }}
          >
            {conv.bookings.services.name}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Chat bubble ───────────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: ConvMessage }) {
  const isProvider = msg.role === "provider";
  return (
    <div className={`flex gap-2.5 ${isProvider ? "justify-start" : "justify-end"}`}>
      {isProvider && (
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--rez-highlight)", border: "1px solid var(--rez-glow-dim)" }}
        >
          <Bot className="h-3.5 w-3.5" style={{ color: "var(--rez-glow)" }} />
        </div>
      )}
      <div
        className={`max-w-[72%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
          isProvider ? "inbox-bubble-ai" : "inbox-bubble-customer"
        }`}
      >
        {msg.content}
      </div>
      {!isProvider && (
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--dash-surface-muted)", border: "1px solid var(--dash-border)" }}
        >
          <User className="h-3.5 w-3.5" style={{ color: "var(--dash-muted)" }} />
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function BookingConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/inbox/conversations");
    const data = await res.json() as { conversations?: Conversation[]; error?: string };
    if (!data.error && data.conversations) {
      setConversations(data.conversations);
      if (!activeId && data.conversations.length > 0) {
        setActiveId(data.conversations[0].id);
      }
    }
    setLoading(false);
  }, [activeId]);

  useEffect(() => {
    fetchConversations();
    const t = setInterval(fetchConversations, 20_000);
    return () => clearInterval(t);
  }, [fetchConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, conversations]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const sendReply = async () => {
    if (!active || !replyText.trim()) return;
    setSending(true);
    const text = replyText.trim();
    setReplyText("");

    const res = await fetch(`/api/inbox/conversations/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    if (res.ok) {
      const newMsg: ConvMessage = {
        role: "provider",
        content: text,
        created_at: new Date().toISOString(),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === active.id
            ? { ...c, messages: [...c.messages, newMsg], updated_at: new Date().toISOString() }
            : c
        )
      );
    }
    setSending(false);
  };

  if (!loading && conversations.length === 0) {
    return (
      <div className="rez-bento-card flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "var(--rez-highlight)", border: "1px solid var(--rez-glow-dim)" }}
        >
          <CalendarDays className="h-7 w-7" style={{ color: "var(--rez-glow)" }} />
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: "var(--dash-text)" }}>
            No booking conversations yet
          </p>
          <p className="mt-1 max-w-sm text-sm" style={{ color: "var(--dash-muted)" }}>
            When customers message after booking, conversations will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="inbox-shell">
      {/* ── Conversation list ─────────────────────────────────────────────────── */}
      <div className="inbox-left">
        <div
          className="flex items-center gap-2.5 px-4 py-3.5"
          style={{ borderBottom: "1px solid var(--dash-divider)" }}
        >
          <div className="dash-icon-circle h-7 w-7">
            <MessageSquare className="h-3 w-3" />
          </div>
          <p className="text-xs font-semibold" style={{ color: "var(--dash-text)" }}>
            Booking chats
          </p>
          {!loading && (
            <span
              className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
              style={{
                background: "var(--rez-highlight)",
                color: "var(--dash-text-secondary)",
                border: "1px solid var(--rez-glow-dim)",
              }}
            >
              {conversations.length}
            </span>
          )}
        </div>

        <div className="inbox-scroll flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="space-y-2 px-3 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 dash-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            conversations.map((c) => (
              <ConvRow
                key={c.id}
                conv={c}
                active={c.id === activeId}
                onClick={() => setActiveId(c.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Chat view ───────────────────────────────────────────────────────── */}
      <div className="inbox-center">
        {!active ? (
          <div className="flex flex-1 items-center justify-center" style={{ color: "var(--dash-muted)" }}>
            <p className="text-sm">Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div
              className="flex items-center gap-2.5 px-5 py-3.5"
              style={{ borderBottom: "1px solid var(--dash-divider)" }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold"
                style={{ background: "var(--dash-icon-tile)", color: "var(--dash-icon-fg)" }}
              >
                {displayName(active)[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                  {displayName(active)}
                </p>
                {active.bookings?.starts_at && (
                  <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
                    {active.bookings.services?.name ?? "Booking"} ·{" "}
                    {new Date(active.bookings.starts_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="inbox-scroll flex-1 overflow-y-auto px-5 py-4">
              {active.messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm" style={{ color: "var(--dash-muted)" }}>
                    No messages yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {active.messages.map((msg, i) => (
                    <div key={i} className="inbox-msg-in">
                      <Bubble msg={msg} />
                    </div>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply input — always available for owner */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderTop: "1px solid var(--dash-divider)" }}
            >
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply to customer…"
                className="dash-input h-10 flex-1 rounded-lg text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
                disabled={sending}
              />
              <Button
                size="icon"
                variant="dash"
                className="h-10 w-10 shrink-0 rounded-lg"
                onClick={sendReply}
                disabled={sending || !replyText.trim()}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* ── Booking info panel ────────────────────────────────────────────── */}
      <div className="inbox-right">
        {active?.bookings ? (
          <div className="flex-1 overflow-auto px-5 py-4">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--dash-muted)" }}>
              Booking
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--dash-muted)" }}>
                  Guest
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                  {active.bookings.guest_name ?? "—"}
                </p>
                {active.bookings.guest_email && (
                  <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
                    {active.bookings.guest_email}
                  </p>
                )}
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--dash-muted)" }}>
                  Service
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--dash-text-secondary)" }}>
                  {active.bookings.services?.name ?? "—"}
                </p>
              </div>

              {active.bookings.starts_at && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--dash-muted)" }}>
                    Date & time
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--dash-text-secondary)" }}>
                    {new Date(active.bookings.starts_at).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
                    {new Date(active.bookings.starts_at).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
              )}

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--dash-muted)" }}>
                  Status
                </p>
                <span
                  className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                  style={{
                    background: active.bookings.status === "confirmed"
                      ? "oklch(0.95 0.08 160 / 0.5)"
                      : "var(--dash-surface-muted)",
                    color: active.bookings.status === "confirmed"
                      ? "oklch(0.4 0.15 160)"
                      : "var(--dash-muted)",
                  }}
                >
                  {active.bookings.status}
                </span>
              </div>
            </div>
          </div>
        ) : active ? (
          <div className="flex flex-1 items-center justify-center px-5 py-8 text-center">
            <p className="text-sm" style={{ color: "var(--dash-muted)" }}>No booking details</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
