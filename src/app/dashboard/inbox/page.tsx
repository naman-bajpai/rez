"use client";

import { useState } from "react";
import { BookingInbox } from "@/components/dashboard/BookingInbox";
import { BookingConversations } from "@/components/dashboard/BookingConversations";
import { AtSign, CalendarDays } from "lucide-react";

const tabs = [
  { id: "instagram", label: "Instagram DMs", icon: AtSign },
  { id: "bookings", label: "Booking chats", icon: CalendarDays },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<TabId>("instagram");

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "var(--dash-surface-muted)", border: "1px solid var(--dash-border)", width: "fit-content" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
              style={{
                background: active ? "var(--dash-surface)" : "transparent",
                color: active ? "var(--dash-text)" : "var(--dash-muted)",
                boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                border: active ? "1px solid var(--dash-border)" : "1px solid transparent",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "instagram" ? <BookingInbox /> : <BookingConversations />}
    </div>
  );
}
