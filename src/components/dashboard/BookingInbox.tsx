"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  Lock,
  Unlock,
  Loader2,
  User,
  MessageCircle,
  MessageSquare,
  Check,
  Clock,
  Scissors,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────

type StoredMessage =
  | { role: "user" | "assistant"; content: string; type?: "text" }
  | { role: "user"; type: "image"; content: string; imageUrl: string }
  | { role: "assistant"; type: "quote"; content: string; quote: QuoteCard };

type QuoteCard = {
  service: string;
  duration: string;
  price: number;
  note: string;
  date: string;
  time: string;
};

type Client = {
  id: string;
  name: string;
  avatar: string; // initials color seed
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

// A complete booking confirmation conversation — Maya sends a nail photo,
// the bot reads it, quotes her, and she confirms.
const DUMMY_THREADS: Thread[] = [
  {
    id: "demo-thread-1",
    ig_user_id: "17841452000124567",
    paused: false,
    created_at: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    client: {
      id: "demo-client-1",
      name: "Maya Carter",
      avatar: "purple",
      email: "maya@example.com",
      phone: "+1 (323) 555-0148",
      avg_spend: 145,
      last_booked_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      instagram_id: "maya.nails.la",
    },
    messages: [
      {
        role: "user",
        type: "text",
        content: "Hey! Do you have anything open this Friday evening? 🙏",
      },
      {
        role: "assistant",
        type: "text",
        content: "Hi Maya! Yes — Friday has 5:30 PM and 7:00 PM still open. Which works better for you?",
      },
      {
        role: "user",
        type: "text",
        content: "7 PM works. I want to recreate this set, can you do it?",
      },
      {
        role: "user",
        type: "image",
        content: "Sent a photo",
        imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?fm=jpg&q=80&w=640&auto=format&fit=crop",
      },
      {
        role: "assistant",
        type: "text",
        content: "Cute set! Based on what I see — almond shape, gel color with chrome powder and two accent nails with foil — here's what I'd quote you:",
      },
      {
        role: "assistant",
        type: "quote",
        content: "Quote based on your photo",
        quote: {
          service: "Full Set · Gel + Chrome + Foil accents",
          duration: "1 hr 45 min",
          price: 83,
          note: "Price may adjust ±$5 in person depending on nail length.",
          date: "Friday, Apr 18",
          time: "7:00 PM",
        },
      },
      {
        role: "user",
        type: "text",
        content: "That works for me! Let's do it 🤩",
      },
      {
        role: "assistant",
        type: "text",
        content: "Booked! You're confirmed for Friday Apr 18 at 7:00 PM. I'll send a reminder 24 hrs before. See you then 💜",
      },
    ],
  },
  {
    id: "demo-thread-2",
    ig_user_id: "17841452000998888",
    paused: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    client: {
      id: "demo-client-2",
      name: "Sofia Nguyen",
      avatar: "rose",
      email: "sofia@example.com",
      avg_spend: 98,
      last_booked_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 42).toISOString(),
      instagram_id: "sofia.vibes",
    },
    messages: [
      {
        role: "user",
        type: "text",
        content: "Hi! Can I get a refill next week? My nails are growing out bad 😭",
      },
      {
        role: "assistant",
        type: "text",
        content: "Of course! When's best for you — weekday or weekend?",
      },
      {
        role: "user",
        type: "text",
        content: "Weekday, preferably Tuesday or Wednesday afternoon",
      },
      {
        role: "assistant",
        type: "quote",
        content: "Quote for your refill",
        quote: {
          service: "Gel Refill · Standard",
          duration: "1 hr 15 min",
          price: 58,
          note: "Includes shape correction and cuticle care.",
          date: "Tuesday, Apr 22",
          time: "2:30 PM",
        },
      },
      {
        role: "assistant",
        type: "text",
        content: "I've paused here — confirm this quote and I'll lock it in for you.",
      },
    ],
  },
  {
    id: "demo-thread-3",
    ig_user_id: "17841452000777777",
    paused: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    client: null,
    messages: [
      {
        role: "user",
        type: "text",
        content: "Hey do you do nail removal only? Like no new set after",
      },
      {
        role: "assistant",
        type: "text",
        content: "Yes, removal only is available — takes about 30 min. Want me to find you a slot this week?",
      },
      {
        role: "user",
        type: "text",
        content: "Yes please, anytime Thursday or Friday morning",
      },
      {
        role: "assistant",
        type: "text",
        content: "Thursday 10:00 AM or Friday 9:30 AM — both are open. Which one works?",
      },
    ],
  },
];

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

// Avatar seed → soft color pair
const AVATAR_COLORS: Record<string, { bg: string; fg: string }> = {
  purple: { bg: "#EDE9FE", fg: "#6D28D9" },
  rose:   { bg: "#FFE4E6", fg: "#BE123C" },
  blue:   { bg: "#DBEAFE", fg: "#1D4ED8" },
  green:  { bg: "#D1FAE5", fg: "#065F46" },
};
function avatarColor(seed?: string) {
  return AVATAR_COLORS[seed ?? "purple"] ?? AVATAR_COLORS.purple;
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

// ─── Quote card (sent by bot after reading a photo) ──────────────────────────

function QuoteCardBubble({ q }: { q: QuoteCard }) {
  return (
    <div
      className="w-full max-w-[78%] overflow-hidden rounded-2xl rounded-tl-sm"
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        boxShadow: "0 2px 8px -2px rgba(0,0,0,0.08)",
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ background: "var(--dash-accent-soft)", borderBottom: "1px solid var(--dash-border)" }}
      >
        <Scissors className="h-3.5 w-3.5" style={{ color: "var(--dash-accent)" }} />
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--dash-accent)" }}>
          Booking quote
        </p>
      </div>

      <div className="px-4 py-3 space-y-2.5">
        {/* Service name */}
        <p className="text-[13px] font-semibold leading-snug" style={{ color: "var(--dash-text)" }}>
          {q.service}
        </p>

        {/* Date + time row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" style={{ color: "var(--dash-muted)" }} />
            <span className="text-[12px]" style={{ color: "var(--dash-text-secondary)" }}>
              {q.date} · {q.time}
            </span>
          </div>
          <span className="text-[11px]" style={{ color: "var(--dash-muted)" }}>{q.duration}</span>
        </div>

        {/* Price */}
        <div className="flex items-end justify-between">
          <p className="text-[22px] font-bold leading-none" style={{ color: "var(--dash-text)", letterSpacing: "-0.03em" }}>
            ${q.price}
          </p>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: "#DCFCE7", color: "#166534" }}
          >
            Estimated
          </span>
        </div>

        {/* Note */}
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--dash-muted)" }}>
          {q.note}
        </p>
      </div>
    </div>
  );
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────

function Bubble({ msg, client }: { msg: StoredMessage; client: Client | null }) {
  const isCustomer = msg.role === "user";
  const colors = avatarColor(client?.avatar);
  const initials = (client?.name ?? "?")[0].toUpperCase();

  // Customer on LEFT, bot on RIGHT
  return (
    <div className={`flex gap-2.5 ${isCustomer ? "justify-start" : "justify-end"}`}>
      {/* Customer avatar — left side */}
      {isCustomer && (
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
          style={{ background: colors.bg, color: colors.fg, border: `1.5px solid ${colors.fg}22` }}
        >
          {client ? initials : <User className="h-3.5 w-3.5" />}
        </div>
      )}

      {/* Message content */}
      {msg.type === "image" ? (
        // Image message from customer
        <div className="max-w-[64%] overflow-hidden rounded-2xl rounded-tl-sm border" style={{ borderColor: "var(--dash-border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={(msg as { imageUrl: string }).imageUrl}
            alt="Sent photo"
            className="block w-full object-cover"
            style={{ maxHeight: 200 }}
          />
          <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: "var(--dash-surface-muted)" }}>
            <ImageIcon className="h-3 w-3" style={{ color: "var(--dash-muted)" }} />
            <span className="text-[11px]" style={{ color: "var(--dash-muted)" }}>Photo sent</span>
          </div>
        </div>
      ) : msg.type === "quote" ? (
        <QuoteCardBubble q={(msg as { quote: QuoteCard }).quote} />
      ) : (
        <div
          className={`max-w-[72%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
            isCustomer ? "inbox-bubble-customer" : "inbox-bubble-ai"
          }`}
        >
          {msg.content}
        </div>
      )}

      {/* Bot avatar — right side */}
      {!isCustomer && (
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--rez-highlight)", border: "1px solid var(--rez-glow-dim)" }}
        >
          <Bot className="h-3.5 w-3.5" style={{ color: "var(--rez-glow)" }} />
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BookingInbox() {
  const [threads, setThreads] = useState<Thread[]>(DUMMY_THREADS);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId && DUMMY_THREADS.length > 0) {
      setActiveId(DUMMY_THREADS[0].id);
    }
  }, [activeId]);

  // Scroll to bottom when active thread changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, threads]);

  const active = threads.find((t) => t.id === activeId) ?? null;

  // Toggle paused locally for dummy data
  const togglePaused = async () => {
    if (!active) return;
    setToggling(true);
    setThreads((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, paused: !t.paused } : t))
    );
    setToggling(false);
  };

  // Send manual message locally for dummy data
  const sendMessage = async () => {
    if (!active || !manualText.trim()) return;
    setSending(true);
    const text = manualText.trim();
    setManualText("");
    const newMsg: StoredMessage = { role: "assistant", content: text };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? { ...t, messages: [...t.messages, newMsg], updated_at: new Date().toISOString() }
          : t
      )
    );
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
                      <Bubble msg={msg} client={active.client} />
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
