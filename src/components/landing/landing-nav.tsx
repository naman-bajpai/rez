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
    <header className="fixed inset-x-0 top-0 z-50 px-6 py-6 transition-all">
      <nav
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between rounded-3xl border border-zinc-100 bg-white/70 px-6 py-3 transition-all duration-500 backdrop-blur-xl",
          scrolled ? "shadow-xl shadow-zinc-200/40 py-2.5" : "py-4"
        )}
      >
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-zinc-950 transition-transform group-hover:scale-105">
            <Image
              src="/images/ReZ.png"
              alt="ReZ Logo"
              width={80}
              height={80}
              className="h-full w-full object-contain invert grayscale"
            />
          </div>
          <span className="text-xl font-bold tracking-tighter text-zinc-950">ReZ.</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-8 md:flex">
          <div className="flex items-center gap-6 text-sm font-bold text-zinc-500">
            <Link href="/book?slug=demo" className="transition-colors hover:text-zinc-950">Live Demo</Link>
            <Link href="/dashboard" className="transition-colors hover:text-zinc-950">Dashboard</Link>
          </div>
          <div className="h-4 w-px bg-zinc-100" />
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-zinc-500 transition-colors hover:text-zinc-950">Sign In</Link>
            <Link
              href="/signup"
              className="flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-5 text-xs font-bold text-white transition-all hover:bg-zinc-800 active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute left-6 right-6 top-full mt-4 rounded-3xl border border-zinc-100 bg-white p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 md:hidden">
          <div className="flex flex-col gap-6">
            <Link href="/book?slug=demo" className="text-lg font-bold text-zinc-950" onClick={() => setMobileMenuOpen(false)}>Live Demo</Link>
            <Link href="/dashboard" className="text-lg font-bold text-zinc-950" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            <div className="h-px bg-zinc-100" />
            <Link href="/login" className="text-lg font-bold text-zinc-950" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            <Link
              href="/signup"
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-8 text-sm font-bold text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
