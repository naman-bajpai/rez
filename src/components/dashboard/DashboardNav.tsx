"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Scissors,
  Users,
  Sparkles,
  ExternalLink,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/dashboard/availability", label: "Availability", icon: Clock },
  { href: "/dashboard/services", label: "Services", icon: Scissors },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
];

export function DashboardNav() {
  const path = usePathname();

  return (
    <aside className="sticky top-0 z-40 border-b border-zinc-200/80 bg-[oklch(0.985_0.008_95)]/92 px-4 py-4 backdrop-blur-2xl sm:px-6 lg:h-[100dvh] lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-center justify-between gap-4 lg:block">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-[#fbfaf7] shadow-[0_16px_40px_-24px_rgba(39,39,42,0.8)]">
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

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 shrink-0 rounded-lg border-zinc-200 bg-white/85 px-3 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-white hover:text-zinc-950 lg:mt-5 lg:w-full"
          >
            <Link href="/book" target="_blank">
              <ExternalLink className="h-3.5 w-3.5" />
              Booking page
            </Link>
          </Button>
        </div>

        <Separator className="hidden bg-zinc-200 lg:block" />

        <nav
          aria-label="Dashboard"
          className="grid grid-flow-col auto-cols-max gap-2 overflow-x-auto pb-1 lg:grid-flow-row lg:auto-cols-auto lg:overflow-visible lg:pb-0"
        >
          {nav.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard" ? path === href : path.startsWith(href);
            return (
              <Button
                key={href}
                asChild
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "h-11 justify-start rounded-lg px-3 text-sm font-semibold transition active:scale-[0.98]",
                  isActive
                    ? "bg-zinc-950 text-[#fbfaf7] shadow-[0_18px_50px_-30px_rgba(39,39,42,0.9)] hover:bg-zinc-900"
                    : "text-zinc-600 hover:bg-white/80 hover:text-zinc-950"
                )}
              >
                <Link href={href}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </Button>
            );
          })}
        </nav>

        <Card className="mt-auto hidden border-zinc-200 bg-white/78 shadow-[0_24px_80px_-64px_rgba(39,39,42,0.8)] lg:block">
          <CardContent className="p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
              <PanelLeft className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold tracking-tight text-zinc-950">
              Work from one queue
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Use bookings, services, and clients from the vertical menu.
            </p>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
