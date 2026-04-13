import Link from "next/link";
import { Hero3DMock } from "@/components/landing/hero-3d-mock";
import { LandingNav } from "@/components/landing/landing-nav";
import { BetaSignupForm } from "@/components/landing/BetaSignupForm";
import { ArrowRight, Check, Zap, Shield, Sparkles, Globe, MessageSquare, ExternalLink } from "lucide-react"; 

export default function HomePage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-white selection:bg-zinc-900 selection:text-white">
      {/* Background elements — Ultra-minimalist */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      
      <div className="pointer-events-none absolute left-0 top-0 h-[800px] w-full bg-gradient-to-b from-zinc-50/50 to-transparent" aria-hidden />

      <LandingNav />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="mx-auto max-w-[1400px] px-6 pt-32 pb-24 md:pt-44 md:pb-32">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col items-start text-left">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-100 bg-zinc-50/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
                <Sparkles className="h-3 w-3 text-zinc-400" />
                Infrastructure for Creators
              </div>
              
              <h1 className="text-5xl font-bold leading-[0.95] tracking-tighter text-zinc-950 sm:text-7xl lg:text-8xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
                Booking<br />
                <span className="text-zinc-400">Simplified.</span>
              </h1>
              
              <p className="mt-8 max-w-[42ch] text-lg font-medium leading-relaxed text-zinc-500 sm:text-xl animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                ReZ provides a high-end, automated guest experience for independent service providers. Secure slots, handle payments, and manage your business from a single link.
              </p>
              
              <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                <Link
                  href="/signup"
                  className="group flex h-14 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-8 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] shadow-xl shadow-zinc-200/50"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/book?slug=demo"
                  className="flex h-14 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-8 text-sm font-bold text-zinc-900 transition-all hover:bg-zinc-50 active:scale-[0.98]"
                >
                  View Live Demo
                </Link>
              </div>
              
              <div className="mt-12 flex items-center gap-6 opacity-40 grayscale animate-in fade-in duration-1000 delay-500">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
                  <MessageSquare className="h-4 w-4" /> Instagram Direct
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
                  <Shield className="h-4 w-4" /> Secure Checkout
                </div>
              </div>
            </div>
            
            <div className="relative lg:ml-auto">
              <Hero3DMock />
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="bg-zinc-50/50 py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tighter text-zinc-950 sm:text-5xl">
                Engineered for speed.<br />
                Designed for work.
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-12">
              <div className="group md:col-span-8">
                <div className="h-full rounded-[2.5rem] border border-zinc-200 bg-white p-8 transition-all hover:shadow-2xl hover:shadow-zinc-200/50">
                  <div className="flex h-full flex-col justify-between gap-12">
                    <div className="max-w-md">
                      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100">
                        <Globe className="h-6 w-6 text-zinc-900" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight text-zinc-950">Professional Booking Engine</h3>
                      <p className="mt-4 text-base font-medium leading-relaxed text-zinc-500">
                        A seamless guest flow that verifies emails, searches live availability, and processes payments without requiring your clients to create yet another account.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {["Email OTP", "Live Slot Search", "Stripe Connect", "Calendar Sync"].map((t) => (
                        <span key={t} className="rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-2 text-xs font-bold text-zinc-600">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 space-y-4">
                <div className="rounded-[2.5rem] border border-zinc-200 bg-white p-8 transition-all hover:shadow-2xl hover:shadow-zinc-200/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 mb-6">
                    <Zap className="h-6 w-6 text-zinc-900" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-950">AI Agent Support</h3>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-500">
                    Rez intercepts Instagram DMs and handles the booking conversation for you, automatically.
                  </p>
                </div>
                
                <div className="rounded-[2.5rem] border border-zinc-200 bg-zinc-950 p-8 text-white transition-all hover:shadow-2xl hover:shadow-zinc-900/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 mb-6">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Zero Commissions</h3>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-400">
                    Keep 100% of what you earn. We don&apos;t take a cut from your bookings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Beta Signup Section */}
        <section className="py-24 md:py-44 border-t border-zinc-100">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-zinc-100 bg-zinc-50/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Limited Access
            </div>
            <h2 className="text-4xl font-bold tracking-tighter text-zinc-950 sm:text-6xl lg:text-7xl">
              Join the future of<br />
              independent work.
            </h2>
            <p className="mx-auto mt-8 max-w-[42ch] text-lg font-medium leading-relaxed text-zinc-500">
              We&apos;re currently onboarding a select group of operators. Sign up for early access to the ReZ beta.
            </p>
            
            <div className="mt-16 flex justify-center">
              <BetaSignupForm />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-100 bg-white py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-12 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <span className="text-xl font-bold tracking-tighter text-zinc-950">ReZ.</span>
                <p className="mt-4 max-w-xs text-sm font-medium text-zinc-500 leading-relaxed">
                  The infrastructure for independent service providers. Branded booking, secure payments, and AI automation.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">Product</h4>
                <div className="flex flex-col gap-4 text-sm font-bold text-zinc-900">
                  <Link href="/book?slug=demo" className="transition-colors hover:text-zinc-500">Live Demo</Link>
                  <Link href="/dashboard" className="transition-colors hover:text-zinc-500">Dashboard</Link>
                  <Link href="/signup" className="transition-colors hover:text-zinc-500">Get Started</Link>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">Company</h4>
                <div className="flex flex-col gap-4 text-sm font-bold text-zinc-900">
                  <a href="#" className="transition-colors hover:text-zinc-500">Twitter</a>
                  <a href="#" className="transition-colors hover:text-zinc-500">Instagram</a>
                  <a href="mailto:hello@rez.app" className="transition-colors hover:text-zinc-500">Contact</a>
                </div>
              </div>
            </div>
            <div className="mt-20 border-t border-zinc-100 pt-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
              <p>© 2026 ReZ Infrastructure Inc.</p>
              <div className="flex gap-8">
                <a href="#" className="hover:text-zinc-900">Privacy</a>
                <a href="#" className="hover:text-zinc-900">Terms</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
