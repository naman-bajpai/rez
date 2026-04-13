"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, ArrowRight } from "lucide-react";

export function BetaSignupForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus("loading");
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStatus("success");
    setEmail("");
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in duration-500">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
          <Check className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold tracking-tight text-zinc-900">You&apos;re on the list.</p>
        <p className="text-xs text-zinc-500">We&apos;ll reach out when a spot opens up.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 w-full rounded-xl border-zinc-200 bg-white/50 pl-4 pr-4 text-sm font-medium backdrop-blur-md transition-all focus:bg-white focus:ring-2 focus:ring-zinc-900/10 sm:min-w-[240px]"
          />
        </div>
        <Button
          type="submit"
          disabled={status === "loading"}
          className="h-12 shrink-0 rounded-xl bg-zinc-950 px-6 font-bold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-70"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Join Beta <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
      <p className="mt-4 text-center text-[11px] font-medium text-zinc-400 sm:text-left">
        Limited spots available for early access. No credit card required.
      </p>
    </form>
  );
}
