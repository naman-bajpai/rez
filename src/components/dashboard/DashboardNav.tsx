"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Users,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/dashboard/services", label: "Services", icon: Scissors },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
];

export function DashboardNav() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-[oklch(0.985_0.008_95)]/86 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-[#fbfaf7] shadow-[0_16px_40px_-24px_rgba(39,39,42,0.8)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-semibold tracking-tight text-zinc-950">
                ReZ
              </span>
              <span className="block truncate text-xs text-zinc-500">
                Booking operations
              </span>
            </span>
          </Link>

          <Link
            href="/book"
            target="_blank"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-zinc-200 bg-white/80 px-3 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-white hover:text-zinc-950 active:scale-[0.98]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Booking page
          </Link>
        </div>

        <nav aria-label="Dashboard" className="flex gap-2 overflow-x-auto pb-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard" ? path === href : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition",
                  isActive
                    ? "bg-zinc-950 text-[#fbfaf7] shadow-[0_16px_40px_-28px_rgba(39,39,42,0.9)]"
                    : "text-zinc-600 hover:bg-white/80 hover:text-zinc-950"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
