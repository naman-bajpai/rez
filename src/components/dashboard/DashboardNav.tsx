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
  Share2,
  Settings,
  ChevronUp,
} from "lucide-react";
import { createAuthClient } from "better-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardSkinSwitcher } from "@/components/dashboard/DashboardSkinSwitcher";
import { DashboardAIChat } from "@/components/dashboard/DashboardAIChat";

const authClient = createAuthClient();

function initials(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "?";
}

const nav = [
  { href: "/dashboard",           label: "Overview",     icon: LayoutDashboard },
  { href: "/dashboard/inbox",     label: "Inbox",        icon: Inbox           },
  { href: "/dashboard/bookings",  label: "Bookings",     icon: CalendarDays    },
  { href: "/dashboard/availability", label: "Availability", icon: Clock        },
  { href: "/dashboard/services",  label: "Services",     icon: Scissors        },
  { href: "/dashboard/clients",   label: "Clients",      icon: Users           },
  { href: "/dashboard/share",     label: "Share link",   icon: Share2          },
];

export function DashboardNav() {
  const path = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const { data: session } = authClient.useSession();

  const userName = session?.user?.name;
  const userEmail = session?.user?.email;
  const userInitials = initials(userName, userEmail);

  async function handleLogout() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
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
                src="/images/logo.png"
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
                  isActive && "shadow-[var(--dash-shadow-active)]"
                )}
              >
                <Link href={href}>
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "opacity-100" : "opacity-60")} />
                  {label}
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <DashboardSkinSwitcher />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-[var(--dash-hover)] focus:outline-none"
                style={{ borderColor: "var(--dash-border)" }}
              >
                <Avatar className="h-8 w-8 shrink-0 rounded-lg text-xs">
                  <AvatarFallback
                    className="rounded-lg text-xs font-semibold"
                    style={{ backgroundColor: "var(--dash-accent)", color: "var(--dash-accent-fg)" }}
                  >
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden min-w-0 flex-1 lg:block">
                  <span className="block truncate text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                    {userName ?? "Account"}
                  </span>
                  <span className="block truncate text-xs" style={{ color: "var(--dash-muted)" }}>
                    {userEmail ?? ""}
                  </span>
                </span>
                <ChevronUp className="hidden h-3.5 w-3.5 shrink-0 opacity-40 lg:block" style={{ color: "var(--dash-muted)" }} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="end" className="w-52">
              <DropdownMenuLabel className="pb-1">
                {userName ?? userEmail ?? "Account"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="h-4 w-4 opacity-60" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleLogout}
                disabled={signingOut}
                className="text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                {signingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin opacity-60" />
                ) : (
                  <LogOut className="h-4 w-4 opacity-60" />
                )}
                {signingOut ? "Logging out…" : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
    <DashboardAIChat />
    </>
  );
}
