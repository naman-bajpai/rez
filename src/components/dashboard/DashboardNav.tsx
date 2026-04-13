"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Scissors,
  Users,
  LogOut,
  Loader2,
  ExternalLink,
  Inbox,
} from "lucide-react";
import { createAuthClient } from "better-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DashboardSkinSwitcher } from "@/components/dashboard/DashboardSkinSwitcher";
import { DashboardAIChat } from "@/components/dashboard/DashboardAIChat";

const authClient = createAuthClient();

const nav = [
  { href: "/dashboard",           label: "Overview",     icon: LayoutDashboard },
  { href: "/dashboard/inbox",     label: "Inbox",        icon: Inbox           },
  { href: "/dashboard/bookings",  label: "Bookings",     icon: CalendarDays    },
  { href: "/dashboard/availability", label: "Availability", icon: Clock        },
  { href: "/dashboard/services",  label: "Services",     icon: Scissors        },
  { href: "/dashboard/clients",   label: "Clients",      icon: Users           },
];

export function DashboardNav() {
  const path = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className="sticky top-0 z-40 border-b px-4 py-4 backdrop-blur-2xl sm:px-6 lg:h-[100dvh] lg:border-b-0 lg:border-r lg:px-5 lg:py-6"
      style={{
        borderColor: "var(--dash-nav-border)",
        backgroundColor: "var(--dash-nav-bg)",
        boxShadow: "var(--dash-shadow-nav)",
      }}
    >
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-center justify-between gap-4 lg:block">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-[var(--dash-border-strong)]">
              <Image
                src="/images/ReZ.png"
                alt=""
                width={80}
                height={80}
                className="h-10 w-10 object-contain"
                priority
              />
            </span>
            <span className="min-w-0">
              <span
                className="block text-base font-semibold tracking-tight"
                style={{ color: "var(--dash-text)" }}
              >
                ReZ
              </span>
              <span className="block truncate text-xs" style={{ color: "var(--dash-muted)" }}>
                Booking operations
              </span>
            </span>
          </Link>
        </div>

        <Button
          asChild
          variant="dashOutline"
          size="sm"
          className="h-9 shrink-0 rounded-lg px-3 text-xs font-semibold lg:mt-0 lg:w-full"
        >
          <Link href="/book" target="_blank">
            <ExternalLink className="h-3.5 w-3.5" />
            Booking page
          </Link>
        </Button>

        <Separator className="hidden lg:block" style={{ backgroundColor: "var(--dash-divider)" }} />

        <nav
          aria-label="Dashboard"
          className="grid grid-flow-col auto-cols-max gap-2 overflow-x-auto pb-1 lg:grid-flow-row lg:auto-cols-auto lg:overflow-visible lg:pb-0"
        >
          {nav.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/dashboard" ? path === href : path.startsWith(href);
            return (
              <Button
                key={href}
                asChild
                variant={isActive ? "dash" : "dashGhost"}
                className={cn(
                  "h-11 justify-start rounded-lg px-3 text-sm font-semibold transition active:scale-[0.98]",
                  isActive && "shadow-[0_18px_50px_-30px_oklch(0.35_0.1_200/0.4)]"
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

        <DashboardAIChat />

        <Button
          type="button"
          variant="dashOutline"
          onClick={handleLogout}
          disabled={signingOut}
          className="h-11 justify-start rounded-lg px-3 text-sm font-semibold"
        >
          {signingOut ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4 shrink-0" />
          )}
          {signingOut ? "Logging out" : "Log out"}
        </Button>

        <div className="mt-auto">
          <DashboardSkinSwitcher />
        </div>
      </div>
    </aside>
  );
}
