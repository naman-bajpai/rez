"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bot,
  Send,
  Phone,
  Mail,
  DollarSign,
  CalendarDays,
  Lock,
  Unlock,
  AlertTriangle,
  Search,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────

type ConvoStatus = "negotiating" | "payment-pending" | "confirmed";

type ChatMessage = {
  id: string;
  role: "ai" | "customer" | "override";
  text: string;
  time: string;
};

type InspoPhoto = {
  id: string;
  label: string;
  gradient: string;
};

type InboxClient = {
  id: string;
  name: string;
  initial: string;
  email: string;
  phone: string;
  service: string;
  status: ConvoStatus;
  lastMessage: string;
  lastTime: string;
  avgSpend: number;
  totalBookings: number;
  messages: ChatMessage[];
  inspoPhotos: InspoPhoto[];
};

// ─── Mock seed data ───────────────────────────────────────────────

const MOCK_CLIENTS: InboxClient[] = [
  {
    id: "c1",
    name: "Jasmine Torres",
    initial: "J",
    email: "jasmine.t@example.com",
    phone: "+1 (555) 021-8843",
    service: "Silk Press",
    status: "negotiating",
    lastMessage: "Hmm, let me check my schedule...",
    lastTime: "just now",
    avgSpend: 95,
    totalBookings: 4,
    inspoPhotos: [
      { id: "p1", label: "Sleek look",    gradient: "linear-gradient(140deg,#c084fc 0%,#e879f9 100%)" },
      { id: "p2", label: "Volume ref",    gradient: "linear-gradient(140deg,#818cf8 0%,#6366f1 100%)" },
    ],
    messages: [
      { id: "m1", role: "customer", text: "Hi! I'd love to get a silk press done this week if possible.", time: "2:04 PM" },
      { id: "m2", role: "ai",       text: "Hey Jasmine! Absolutely — I have Thursday at 11 AM or Friday at 2 PM open for a silk press. It's $95 and takes about 2 hours. Which works better?", time: "2:04 PM" },
      { id: "m3", role: "customer", text: "Friday sounds good but can you do 12 instead of 2?", time: "2:07 PM" },
      { id: "m4", role: "ai",       text: "Friday at noon isn't open yet, but I can put you on the waitlist and notify you if it comes up. Otherwise Friday at 2 PM is confirmed available — want me to hold that for you?", time: "2:07 PM" },
      { id: "m5", role: "customer", text: "Hmm, let me check my schedule...", time: "2:11 PM" },
    ],
  },
  {
    id: "c2",
    name: "Marcus Webb",
    initial: "M",
    email: "mwebb@example.com",
    phone: "+1 (555) 334-7720",
    service: "Beard Trim",
    status: "payment-pending",
    lastMessage: "Ok checking the payment link now",
    lastTime: "4m ago",
    avgSpend: 45,
    totalBookings: 11,
    inspoPhotos: [
      { id: "p3", label: "Sharp fade",   gradient: "linear-gradient(140deg,#34d399 0%,#059669 100%)" },
      { id: "p4", label: "Line up ref",  gradient: "linear-gradient(140deg,#64748b 0%,#1e293b 100%)" },
    ],
    messages: [
      { id: "m1", role: "customer", text: "Need a beard trim this week, what's available?", time: "1:30 PM" },
      { id: "m2", role: "ai",       text: "Marcus! Thursday at 2 PM is open for a beard trim — $35, about 30 mins. Want to lock it in?", time: "1:30 PM" },
      { id: "m3", role: "customer", text: "Yeah Thursday works, let's do it", time: "1:33 PM" },
      { id: "m4", role: "ai",       text: "Perfect! I've reserved Thursday at 2 PM. Here's your payment link to confirm — total is $35. Once paid, you're all set! 🔒", time: "1:34 PM" },
      { id: "m5", role: "customer", text: "Ok checking the payment link now", time: "1:48 PM" },
    ],
  },
  {
    id: "c3",
    name: "Aisha Kamara",
    initial: "A",
    email: "aisha.k@example.com",
    phone: "+1 (555) 882-0034",
    service: "Full Color",
    status: "confirmed",
    lastMessage: "Confirmed! See you Saturday 🎉",
    lastTime: "22m ago",
    avgSpend: 180,
    totalBookings: 7,
    inspoPhotos: [
      { id: "p5", label: "Copper tones", gradient: "linear-gradient(140deg,#fb923c 0%,#dc2626 100%)" },
      { id: "p6", label: "Ombre ref",    gradient: "linear-gradient(140deg,#fbbf24 0%,#f97316 100%)" },
      { id: "p7", label: "Highlights",   gradient: "linear-gradient(140deg,#fde68a 0%,#fb923c 100%)" },
    ],
    messages: [
      { id: "m1", role: "customer", text: "Can I get a full color + treatment this Saturday?", time: "11:00 AM" },
      { id: "m2", role: "ai",       text: "Hi Aisha! Saturday at 10 AM is available for a full color and deep treatment — about 3 hours, $180 total. Does that work?", time: "11:01 AM" },
      { id: "m3", role: "customer", text: "Yes that's perfect, book it!", time: "11:03 AM" },
      { id: "m4", role: "ai",       text: "Amazing! I've sent your confirmation to aisha.k@example.com. Payment processed. See you Saturday at 10 AM — feel free to bring any inspo pics! ✨", time: "11:03 AM" },
      { id: "m5", role: "customer", text: "Confirmed! See you Saturday 🎉", time: "11:05 AM" },
    ],
  },
  {
    id: "c4",
    name: "Devon Reyes",
    initial: "D",
    email: "devon.r@example.com",
    phone: "+1 (555) 449-1198",
    service: "Cut & Style",
    status: "negotiating",
    lastMessage: "What about walk-ins?",
    lastTime: "35m ago",
    avgSpend: 70,
    totalBookings: 2,
    inspoPhotos: [
      { id: "p8", label: "Textured cut", gradient: "linear-gradient(140deg,#0ea5e9 0%,#0284c7 100%)" },
    ],
    messages: [
      { id: "m1", role: "customer", text: "Hey, do you guys have anything open this weekend?", time: "10:15 AM" },
      { id: "m2", role: "ai",       text: "Hey Devon! Saturday at 3 PM and Sunday at 1 PM are both open for a cut & style — $70, about an hour. Either of those work?", time: "10:15 AM" },
      { id: "m3", role: "customer", text: "What about walk-ins?", time: "10:51 AM" },
    ],
  },
  {
    id: "c5",
    name: "Priya Mehta",
    initial: "P",
    email: "priya.m@example.com",
    phone: "+1 (555) 603-7712",
    service: "Blowout",
    status: "confirmed",
    lastMessage: "Can't wait, see you there!",
    lastTime: "1h ago",
    avgSpend: 60,
    totalBookings: 14,
    inspoPhotos: [
      { id: "p9",  label: "Big waves",      gradient: "linear-gradient(140deg,#f472b6 0%,#db2777 100%)" },
      { id: "p10", label: "Bouncy blowout", gradient: "linear-gradient(140deg,#e879f9 0%,#a855f7 100%)" },
    ],
    messages: [
      { id: "m1", role: "customer", text: "I need a blowout before my event on Friday evening", time: "9:00 AM" },
      { id: "m2", role: "ai",       text: "Priya! Friday at 4 PM is open — perfect timing before an evening event. Blowout is $60 and takes about 45 mins. Shall I book it?", time: "9:01 AM" },
      { id: "m3", role: "customer", text: "Yes please! Book it", time: "9:02 AM" },
      { id: "m4", role: "ai",       text: "Done! Friday at 4 PM is yours. Confirmation sent to priya.m@example.com. 💇‍♀️", time: "9:02 AM" },
      { id: "m5", role: "customer", text: "Can't wait, see you there!", time: "9:04 AM" },
    ],
  },
  {
    id: "c6",
    name: "Tyler Brooks",
    initial: "T",
    email: "tyler.b@example.com",
    phone: "+1 (555) 271-9945",
    service: "Trim",
    status: "payment-pending",
    lastMessage: "The link isn't loading for me",
    lastTime: "2h ago",
    avgSpend: 30,
    totalBookings: 3,
    inspoPhotos: [],
    messages: [
      { id: "m1", role: "customer", text: "Need a quick trim, what do you have tomorrow?", time: "8:15 AM" },
      { id: "m2", role: "ai",       text: "Tyler! Tomorrow I have 10 AM or 3 PM for a trim — $30, 20 mins. Which do you prefer?", time: "8:16 AM" },
      { id: "m3", role: "customer", text: "10 AM works", time: "8:18 AM" },
      { id: "m4", role: "ai",       text: "10 AM is locked in! Sending the payment link now — quick $30 checkout and you're confirmed. See you tomorrow!", time: "8:18 AM" },
      { id: "m5", role: "customer", text: "The link isn't loading for me", time: "10:12 AM" },
    ],
  },
];

// ─── Status helpers ───────────────────────────────────────────────

const STATUS_META: Record<ConvoStatus, { label: string }> = {
  "negotiating":     { label: "Negotiating"     },
  "payment-pending": { label: "Payment Pending" },
  "confirmed":       { label: "Confirmed"       },
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function now() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

// ─── Sub-components ───────────────────────────────────────────────

function StatusBadge({ status }: { status: ConvoStatus }) {
  return (
    <span className="inbox-badge" data-status={status}>
      {STATUS_META[status].label}
    </span>
  );
}

function Avatar({
  initial,
  size = "md",
}: {
  initial: string;
  size?: "sm" | "md" | "lg";
}) {
  const sz = size === "sm" ? "h-7 w-7 text-[11px]" : size === "lg" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg font-bold ${sz}`}
      style={{
        background: "var(--dash-icon-tile)",
        color: "var(--dash-icon-fg)",
        border: "1px solid var(--dash-border)",
      }}
    >
      {initial}
    </div>
  );
}

// ─── Left Panel ───────────────────────────────────────────────────

function LeftPanel({
  clients,
  selectedId,
  onSelect,
  search,
  onSearch,
}: {
  clients: InboxClient[];
  selectedId: string;
  onSelect: (id: string) => void;
  search: string;
  onSearch: (v: string) => void;
}) {
  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.service.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="inbox-left">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5"
        style={{ borderBottom: "1px solid var(--dash-divider)" }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" style={{ color: "var(--rez-glow)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
            Inbox
          </span>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
          style={{
            background: "var(--rez-highlight)",
            color: "var(--dash-text-secondary)",
            border: "1px solid var(--rez-glow-dim)",
          }}
        >
          {clients.length}
        </span>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--dash-divider)" }}>
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
            style={{ color: "var(--dash-muted)" }}
          />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search clients…"
            className="h-8 pl-8 text-xs"
            style={{
              background: "var(--dash-surface-muted)",
              border: "1px solid var(--dash-border)",
              color: "var(--dash-text)",
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="inbox-scroll flex-1 overflow-y-auto py-1.5">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs" style={{ color: "var(--dash-muted)" }}>
            No conversations found
          </p>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              className="inbox-client-row"
              data-active={c.id === selectedId ? "true" : "false"}
              onClick={() => onSelect(c.id)}
            >
              <Avatar initial={c.initial} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-1.5">
                  <p className="truncate text-xs font-semibold" style={{ color: "var(--dash-text)" }}>
                    {c.name}
                  </p>
                  <span className="shrink-0 text-[10px]" style={{ color: "var(--dash-muted)" }}>
                    {c.lastTime}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px]" style={{ color: "var(--dash-muted)" }}>
                  {c.lastMessage}
                </p>
                <div className="mt-1.5">
                  <StatusBadge status={c.status} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Center Panel ─────────────────────────────────────────────────

function CenterPanel({
  client,
  overrideActive,
}: {
  client: InboxClient;
  overrideActive: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(client.messages);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevClientId = useRef(client.id);

  // Reset messages when client changes
  useEffect(() => {
    if (prevClientId.current !== client.id) {
      setMessages(client.messages);
      setDraft("");
      prevClientId.current = client.id;
    }
  }, [client]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendOverride = useCallback(() => {
    if (!draft.trim()) return;
    const msg: ChatMessage = {
      id: uid(),
      role: "override",
      text: draft.trim(),
      time: now(),
    };
    setMessages((prev) => [...prev, msg]);
    setDraft("");
  }, [draft]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendOverride();
      }
    },
    [sendOverride]
  );

  return (
    <div className="inbox-center">
      {/* Chat header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--dash-divider)" }}
      >
        <div className="flex items-center gap-3">
          <Avatar initial={client.initial} size="md" />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
              {client.name}
            </p>
            <div className="flex items-center gap-2">
              <StatusBadge status={client.status} />
              <span className="text-[10px]" style={{ color: "var(--dash-muted)" }}>
                {client.service}
              </span>
            </div>
          </div>
        </div>

        {/* AI / manual mode indicator */}
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
          style={
            overrideActive
              ? {
                  background: "oklch(0.92 0.07 38 / 0.85)",
                  border: "1px solid oklch(0.8 0.1 38 / 0.5)",
                  color: "oklch(0.42 0.15 38)",
                }
              : {
                  background: "var(--rez-highlight)",
                  border: "1px solid var(--rez-glow-dim)",
                  color: "var(--dash-text-secondary)",
                }
          }
        >
          {overrideActive ? (
            <>
              <User className="h-3 w-3" />
              Manual Mode
            </>
          ) : (
            <>
              <span className="rez-pulse" style={{ width: 6, height: 6 }} />
              <Bot className="h-3 w-3" style={{ color: "var(--rez-glow)" }} />
              Rez is managing
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="inbox-scroll flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {messages.map((msg) => {
            const isAI       = msg.role === "ai";
            const isOverride = msg.role === "override";
            const isCustomer = msg.role === "customer";
            const isLeft     = isAI || isOverride;

            return (
              <div
                key={msg.id}
                className={`inbox-msg-in flex flex-col gap-1 ${isLeft ? "items-start" : "items-end"}`}
              >
                {/* Sender label */}
                <div
                  className={`flex items-center gap-1.5 ${isLeft ? "" : "flex-row-reverse"}`}
                >
                  {isAI && (
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-md"
                      style={{
                        background: "var(--rez-highlight)",
                        border: "1px solid var(--rez-glow-dim)",
                      }}
                    >
                      <Bot className="h-3 w-3" style={{ color: "var(--rez-glow)" }} />
                    </div>
                  )}
                  {isOverride && (
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-md"
                      style={{
                        background: "oklch(0.92 0.07 38 / 0.8)",
                        border: "1px solid oklch(0.8 0.1 38 / 0.45)",
                      }}
                    >
                      <User className="h-3 w-3" style={{ color: "oklch(0.4 0.15 38)" }} />
                    </div>
                  )}
                  {isCustomer && <Avatar initial={client.initial} size="sm" />}
                  <span className="text-[10px] font-semibold" style={{ color: "var(--dash-muted)" }}>
                    {isAI ? "Rez" : isOverride ? "You" : client.name.split(" ")[0]}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--dash-muted)" }}>
                    {msg.time}
                  </span>
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    isAI
                      ? "inbox-bubble-ai"
                      : isOverride
                      ? "inbox-bubble-override"
                      : "inbox-bubble-customer"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      {overrideActive ? (
        <div className="flex items-center gap-2 border-t p-3" style={{ borderColor: "var(--dash-divider)" }}>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your message…"
            className="flex-1 text-sm"
            autoFocus
            style={{
              background: "var(--dash-surface-muted)",
              border: "1px solid oklch(0.8 0.1 38 / 0.45)",
              color: "var(--dash-text)",
            }}
          />
          <Button
            size="icon"
            onClick={sendOverride}
            disabled={!draft.trim()}
            className="h-9 w-9 shrink-0 rounded-lg"
            style={{
              background: "var(--dash-accent)",
              color: "var(--dash-accent-fg)",
            }}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div
          className="flex items-center gap-2.5 px-4 py-3"
          style={{ borderTop: "1px solid var(--dash-divider)" }}
        >
          <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--dash-muted)" }} />
          <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
            <span className="font-semibold" style={{ color: "var(--dash-text-secondary)" }}>Rez</span>
            {" "}is managing this conversation — use Manual Override to take control.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Right Panel ──────────────────────────────────────────────────

function RightPanel({
  client,
  overrideActive,
  onToggleOverride,
}: {
  client: InboxClient;
  overrideActive: boolean;
  onToggleOverride: () => void;
}) {
  return (
    <div className="inbox-right">
      <div className="inbox-scroll flex-1 overflow-y-auto">

        {/* Profile card */}
        <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--dash-divider)" }}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold"
              style={{
                background: "var(--dash-icon-tile)",
                color: "var(--dash-icon-fg)",
                border: "1px solid var(--dash-border)",
              }}
            >
              {client.initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                {client.name}
              </p>
              <StatusBadge status={client.status} />
            </div>
          </div>

          {/* Contact */}
          <div className="mt-3.5 space-y-1.5">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--dash-muted)" }} />
              <span className="truncate text-[11px]" style={{ color: "var(--dash-text-secondary)" }}>
                {client.email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--dash-muted)" }} />
              <span className="text-[11px]" style={{ color: "var(--dash-text-secondary)" }}>
                {client.phone}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-2 gap-px"
          style={{ borderBottom: "1px solid var(--dash-divider)", background: "var(--dash-divider)" }}
        >
          {[
            { icon: DollarSign, label: "Avg spend",      value: `$${client.avgSpend}` },
            { icon: CalendarDays, label: "Total visits",  value: client.totalBookings  },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-1 px-4 py-3"
              style={{ background: "var(--dash-surface)" }}
            >
              <s.icon className="h-3.5 w-3.5" style={{ color: "var(--dash-muted)" }} />
              <p className="text-base font-bold tabular-nums" style={{ color: "var(--dash-text)" }}>
                {s.value}
              </p>
              <p className="text-[10px]" style={{ color: "var(--dash-muted)" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Inspo photos */}
        <div className="px-4 py-3.5" style={{ borderBottom: "1px solid var(--dash-divider)" }}>
          <p
            className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--dash-muted)" }}
          >
            Inspo Photos
          </p>
          {client.inspoPhotos.length === 0 ? (
            <div
              className="flex flex-col items-center gap-1.5 rounded-lg py-5"
              style={{ background: "var(--dash-surface-muted)", border: "1px dashed var(--dash-border)" }}
            >
              <ImageIcon className="h-5 w-5 opacity-30" style={{ color: "var(--dash-muted)" }} />
              <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
                No photos yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {client.inspoPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square overflow-hidden rounded-lg"
                  style={{ background: photo.gradient }}
                >
                  {/* Label overlay */}
                  <div
                    className="absolute inset-x-0 bottom-0 px-2 py-1.5"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }}
                  >
                    <p className="truncate text-[10px] font-semibold text-white/90">
                      {photo.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Override */}
        <div className="px-4 py-3.5">
          <p
            className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--dash-muted)" }}
          >
            Quick Actions
          </p>

          {overrideActive ? (
            /* Override is ON */
            <div
              className="rounded-lg p-3"
              style={{
                background: "oklch(0.92 0.06 38 / 0.75)",
                border: "1px solid oklch(0.8 0.09 38 / 0.5)",
              }}
            >
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle
                  className="h-4 w-4 mt-0.5 shrink-0"
                  style={{ color: "oklch(0.5 0.18 38)" }}
                />
                <div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "oklch(0.38 0.15 38)" }}
                  >
                    You&apos;re in control
                  </p>
                  <p
                    className="mt-0.5 text-[10px] leading-snug"
                    style={{ color: "oklch(0.48 0.12 38)" }}
                  >
                    Rez is paused for this conversation. Messages you send appear as you.
                  </p>
                </div>
              </div>
              <button
                onClick={onToggleOverride}
                className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-semibold transition-opacity hover:opacity-80"
                style={{
                  background: "oklch(0.38 0.15 38 / 0.15)",
                  border: "1px solid oklch(0.5 0.14 38 / 0.4)",
                  color: "oklch(0.4 0.15 38)",
                }}
              >
                <Bot className="h-3.5 w-3.5" />
                Hand back to Rez
              </button>
            </div>
          ) : (
            /* Override is OFF */
            <div>
              <button
                onClick={onToggleOverride}
                className="inbox-override-btn"
              >
                <Unlock className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">Manual Override</span>
              </button>
              <p
                className="mt-2 text-[10px] leading-snug"
                style={{ color: "var(--dash-muted)" }}
              >
                Pause Rez and reply directly. You can hand back at any time.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────

export function BookingInbox() {
  const [clients, setClients]         = useState<InboxClient[]>(MOCK_CLIENTS);
  const [selectedId, setSelectedId]   = useState<string>(MOCK_CLIENTS[0].id);
  const [search, setSearch]           = useState("");
  const [overrides, setOverrides]     = useState<Record<string, boolean>>({});
  const [loading, setLoading]         = useState(true);

  // Hydrate with real clients from the API, merging metadata onto mock conversations
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/clients", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.clients && d.clients.length > 0) {
          // Merge real names/contact onto mock conversations
          const merged = d.clients.slice(0, MOCK_CLIENTS.length).map(
            (real: { id: string; name: string; email?: string; phone?: string; avg_spend?: number }, i: number) => ({
              ...MOCK_CLIENTS[i],
              id:           real.id ?? MOCK_CLIENTS[i].id,
              name:         real.name ?? MOCK_CLIENTS[i].name,
              initial:      (real.name ?? MOCK_CLIENTS[i].name)[0].toUpperCase(),
              email:        real.email ?? MOCK_CLIENTS[i].email,
              phone:        real.phone ?? MOCK_CLIENTS[i].phone,
              avgSpend:     real.avg_spend ?? MOCK_CLIENTS[i].avgSpend,
            })
          );
          // Pad with remaining mock clients if real list is shorter
          const rest = MOCK_CLIENTS.slice(merged.length);
          setClients([...merged, ...rest]);
          setSelectedId(merged[0]?.id ?? MOCK_CLIENTS[0].id);
        }
      })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, []);

  // Faster initial render — don't block on API
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const selected = clients.find((c) => c.id === selectedId) ?? clients[0];
  const overrideActive = !!overrides[selected?.id];

  const toggleOverride = useCallback(() => {
    setOverrides((prev) => ({ ...prev, [selected.id]: !prev[selected.id] }));
  }, [selected?.id]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          height: "calc(100svh - 6rem)",
          background: "var(--dash-surface-elevated)",
          border: "1px solid var(--dash-border)",
          borderTopColor: "var(--rez-glow)",
          boxShadow: "0 -1px 10px -1px var(--rez-glow-dim), inset 0 1px 0 var(--rez-glow-inner)",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--rez-glow)" }} />
          <p className="text-sm" style={{ color: "var(--dash-muted)" }}>Loading inbox…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inbox-shell">
      <LeftPanel
        clients={clients}
        selectedId={selectedId}
        onSelect={setSelectedId}
        search={search}
        onSearch={setSearch}
      />
      {selected && (
        <CenterPanel
          client={selected}
          overrideActive={overrideActive}
        />
      )}
      {selected && (
        <RightPanel
          client={selected}
          overrideActive={overrideActive}
          onToggleOverride={toggleOverride}
        />
      )}
    </div>
  );
}
