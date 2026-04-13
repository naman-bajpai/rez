"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bot,
  Send,
  Lock,
  Unlock,
  Loader2,
  User,
  MessageCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────

type StoredMessage = { role: "user" | "assistant"; content: string };

type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avg_spend?: number;
  last_booked_at?: string;
  instagram_id?: string;
};

type Thread = {
  id: string;
  ig_user_id: string;
  messages: StoredMessage[];
  paused: boolean;
  updated_at: string;
  created_at: string;
  client: Client | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function displayName(t: Thread): string {
  return t.client?.name ?? `IG User …${t.ig_user_id.slice(-4)}`;
}

function lastMessage(t: Thread): string {
  const msgs = t.messages;
  if (!msgs.length) return "No messages yet";
  return msgs[msgs.length - 1].content;
}

// ─── Thread row ───────────────────────────────────────────────────────────────

function ThreadRow({ thread, active, onClick }: { thread: Thread; active: boolean; onClick: () => void }) {
  const name = displayName(thread);
  const preview = lastMessage(thread);
  const lastRole = thread.messages.at(-1)?.role;

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
            {relTime(thread.updated_at)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] font-medium opacity-70" style={{ color: "var(--dash-muted)" }}>
          {lastRole === "assistant" ? (
            <span style={{ color: "var(--rez-glow)", fontWeight: 700 }}>Rez: </span>
          ) : null}
          {preview}
        </p>
        {thread.paused && (
          <span
            className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{ background: "oklch(0.95 0.04 40 / 0.8)", color: "oklch(0.4 0.1 40)", border: "1px solid oklch(0.9 0.05 40 / 0.3)" }}
          >
            <Lock className="h-2.5 w-2.5" /> Paused
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: StoredMessage }) {
  const isAi = msg.role === "assistant";
  return (
    <div className={`flex gap-2.5 ${isAi ? "justify-start" : "justify-end"}`}>
      {isAi && (
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--rez-highlight)", border: "1px solid var(--rez-glow-dim)" }}
        >
          <Bot className="h-3.5 w-3.5" style={{ color: "var(--rez-glow)" }} />
        </div>
      )}
      <div
        className={`max-w-[72%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
          isAi ? "inbox-bubble-ai" : "inbox-bubble-customer"
        }`}
      >
        {msg.content}
      </div>
      {!isAi && (
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

// ─── Main component ───────────────────────────────────────────────────────────

export function BookingInbox() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    const res = await fetch("/api/inbox");
    const data = await res.json() as { threads?: Thread[]; error?: string };
    if (!data.error && data.threads) {
      setThreads(data.threads);
      if (!activeId && data.threads.length > 0) {
        setActiveId(data.threads[0].id);
      }
    }
    setLoading(false);
  }, [activeId]);

  useEffect(() => {
    fetchThreads();
    // Poll every 15s to catch new DMs
    const t = setInterval(fetchThreads, 15_000);
    return () => clearInterval(t);
  }, [fetchThreads]);

  // Scroll to bottom when active thread changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, threads]);

  const active = threads.find((t) => t.id === activeId) ?? null;

  // Toggle paused
  const togglePaused = async () => {
    if (!active) return;
    setToggling(true);
    const res = await fetch(`/api/inbox/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: !active.paused }),
    });
    if (res.ok) {
      setThreads((prev) =>
        prev.map((t) => (t.id === active.id ? { ...t, paused: !t.paused } : t))
      );
    }
    setToggling(false);
  };

  // Send manual message
  const sendMessage = async () => {
    if (!active || !manualText.trim()) return;
    setSending(true);
    const text = manualText.trim();
    setManualText("");

    const res = await fetch(`/api/inbox/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    if (res.ok) {
      const newMsg: StoredMessage = { role: "assistant", content: text };
      setThreads((prev) =>
        prev.map((t) =>
          t.id === active.id
            ? { ...t, messages: [...t.messages, newMsg], updated_at: new Date().toISOString() }
            : t
        )
      );
    }
    setSending(false);
  };

  // ── Empty state — no threads at all ─────────────────────────────────────────
  if (!loading && threads.length === 0) {
    return (
      <div className="rez-bento-card flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "var(--rez-highlight)", border: "1px solid var(--rez-glow-dim)" }}
        >
          <MessageCircle className="h-7 w-7" style={{ color: "var(--rez-glow)" }} />
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: "var(--dash-text)" }}>
            No DM threads yet
          </p>
          <p className="mt-1 max-w-sm text-sm" style={{ color: "var(--dash-muted)" }}>
            Once Rez starts handling Instagram DMs, conversations will appear here.
            Make sure your Instagram page is connected.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="inbox-shell">
      {/* ── Thread list ─────────────────────────────────────────────────────── */}
      <div className="inbox-left">
        <div
          className="flex items-center gap-2.5 px-4 py-3.5"
          style={{ borderBottom: "1px solid var(--dash-divider)" }}
        >
          <div className="dash-icon-circle h-7 w-7">
            <MessageSquare className="h-3 w-3" />
          </div>
          <p className="text-xs font-semibold" style={{ color: "var(--dash-text)" }}>
            Conversations
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
              {threads.length}
            </span>
          )}
        </div>

        <div className="inbox-scroll flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="space-y-2 px-3 py-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 dash-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            threads.map((t) => (
              <ThreadRow
                key={t.id}
                thread={t}
                active={t.id === activeId}
                onClick={() => setActiveId(t.id)}
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
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: "1px solid var(--dash-divider)" }}
            >
              <div className="flex items-center gap-2.5">
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
                  <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
                    {active.messages.length} message{active.messages.length !== 1 ? "s" : ""}
                    {" · "}updated {relTime(active.updated_at)}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="dashOutline"
                className="h-8 rounded-lg px-3 text-xs font-semibold"
                onClick={togglePaused}
                disabled={toggling}
              >
                {toggling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : active.paused ? (
                  <>
                    <Unlock className="h-3.5 w-3.5" />
                    Resume Rez
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    Take over
                  </>
                )}
              </Button>
            </div>

            {/* Paused banner */}
            {active.paused && (
              <div className="inbox-override-banner px-5 py-2.5 text-xs font-semibold">
                Rez is paused for this conversation — you&apos;re typing manually.
              </div>
            )}

            {/* Messages */}
            <div className="inbox-scroll flex-1 overflow-y-auto px-5 py-4">
              {active.messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm" style={{ color: "var(--dash-muted)" }}>
                    No messages in this thread yet.
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

            {/* Input — only when paused */}
            {active.paused && (
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ borderTop: "1px solid var(--dash-divider)" }}
              >
                <Input
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Type a message…"
                  className="dash-input h-10 flex-1 rounded-lg text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={sending}
                />
                <Button
                  size="icon"
                  variant="dash"
                  className="h-10 w-10 shrink-0 rounded-lg"
                  onClick={sendMessage}
                  disabled={sending || !manualText.trim()}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Client info ─────────────────────────────────────────────────────── */}
      <div className="inbox-right">
        {active?.client ? (
          <>
            <div
              className="px-5 py-4"
              style={{ borderBottom: "1px solid var(--dash-divider)" }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--dash-muted)" }}>
                Client
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                  style={{ background: "var(--dash-icon-tile)", color: "var(--dash-icon-fg)" }}
                >
                  {active.client.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                    {active.client.name}
                  </p>
                  {active.client.email && (
                    <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
                      {active.client.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4">
              <div className="space-y-4">
                {active.client.phone && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--dash-muted)" }}>
                      Phone
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--dash-text-secondary)" }}>
                      {active.client.phone}
                    </p>
                  </div>
                )}

                {active.client.avg_spend != null && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--dash-muted)" }}>
                      Avg. spend
                    </p>
                    <p className="mt-1 text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                      ${Number(active.client.avg_spend).toFixed(0)}
                    </p>
                  </div>
                )}

                {active.client.last_booked_at && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--dash-muted)" }}>
                      Last booking
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--dash-text-secondary)" }}>
                      {new Date(active.client.last_booked_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--dash-muted)" }}>
                    Instagram ID
                  </p>
                  <p className="mt-1 font-mono text-[11px]" style={{ color: "var(--dash-muted)" }}>
                    {active.ig_user_id}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-8 text-center">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "var(--dash-icon-tile)" }}
            >
              <User className="h-4 w-4" style={{ color: "var(--dash-icon-fg)" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                Unknown client
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--dash-muted)" }}>
                Client profile will appear once they complete a booking.
              </p>
            </div>
            <p className="font-mono text-[11px]" style={{ color: "var(--dash-muted)" }}>
              {active.ig_user_id}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
