"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Menu, X } from "lucide-react";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 transition-all md:px-8">
      <nav
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-zinc-200/80 bg-white px-5 py-3 transition-all duration-300",
          scrolled ? "py-2.5 shadow-lg shadow-zinc-200/60" : "py-3.5"
        )}
      >
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 transition-transform group-hover:scale-105">
            <Image
              src="/images/logo_transparent.png"
              alt="ReZ Logo"
              width={80}
              height={80}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-950">ReZ</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <div className="flex items-center gap-6 text-sm font-medium text-zinc-600">
            <Link href="/book?slug=demo" className="transition-colors hover:text-zinc-950">Demo</Link>
            <Link href="/dashboard" className="transition-colors hover:text-zinc-950">Dashboard</Link>
          </div>
          <div className="h-4 w-px bg-zinc-200" />
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950">Sign in</Link>
            <Link
              href="/signup"
              className="flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-5 text-xs font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile navigation"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="absolute left-4 right-4 top-full mt-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 md:left-8 md:right-8 md:hidden">
          <div className="flex flex-col gap-6">
            <Link href="/book?slug=demo" className="text-base font-medium text-zinc-950" onClick={() => setMobileMenuOpen(false)}>Demo</Link>
            <Link href="/dashboard" className="text-base font-medium text-zinc-950" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            <div className="h-px bg-zinc-200" />
            <Link href="/login" className="text-base font-medium text-zinc-950" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
            <Link
              href="/signup"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-6 text-sm font-semibold text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
