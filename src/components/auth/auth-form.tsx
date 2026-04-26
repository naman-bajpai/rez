"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createAuthClient } from "better-auth/react";

type AuthMode = "login" | "signup";

const authClient = createAuthClient();

const signupRedirect = "/onboarding";
const loginRedirect = "/dashboard";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = mode === "signup";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const result = isSignup
      ? await authClient.signUp.email({
          name: String(form.get("name") ?? "").trim(),
          email,
          password,
        })
      : await authClient.signIn.email({ email, password });

    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Something went wrong. Try again.");
      return;
    }

    router.push(isSignup ? signupRedirect : loginRedirect);
    router.refresh();
  }

  async function continueWithGoogle() {
    setError("");
    setGooglePending(true);

    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: loginRedirect,
      newUserCallbackURL: signupRedirect,
      errorCallbackURL: isSignup ? "/signup" : "/login",
      requestSignUp: isSignup,
      disableRedirect: true,
    });

    if (result.error) {
      setGooglePending(false);
      setError(result.error.message ?? "Google sign-in failed. Try again.");
      return;
    }

    const redirectUrl = result.data?.url;
    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }
    setGooglePending(false);
  }

  const busy = pending || googlePending;

  return (
    <div className="mt-7 grid gap-5">
      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={busy}
        className="group flex h-12 items-center justify-center gap-3 rounded-lg border border-[#d9dfdb] bg-white px-5 text-sm font-medium text-[#17211d] shadow-[0_1px_0_rgba(18,32,27,0.04)] transition hover:border-[#b9c5bf] hover:bg-[#f6f9f7] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f61]"
      >
        {googlePending ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#66716c]" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.84.86-3.05.86-2.35 0-4.33-1.58-5.04-3.71H.95v2.33A9 9 0 0 0 9 18Z"
            />
            <path
              fill="#FBBC05"
              d="M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.95a9 9 0 0 0 0 8.08l3.01-2.33Z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58A8.66 8.66 0 0 0 9 0 9 9 0 0 0 .95 4.96l3.01 2.33C4.67 5.16 6.65 3.58 9 3.58Z"
            />
          </svg>
        )}
        {googlePending ? "Opening Google..." : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3 text-xs font-medium text-[#7b8781]">
        <span className="h-px flex-1 bg-[#d9dfdb]" />
        Continue with email
        <span className="h-px flex-1 bg-[#d9dfdb]" />
      </div>

      <form onSubmit={onSubmit} method="post" className="grid gap-4">
        {isSignup ? (
          <label className="grid gap-1.5 text-[13px] font-medium text-[#3e4944]">
            Name
            <input
              name="name"
              type="text"
              autoComplete="name"
              required
              className="h-12 rounded-lg border border-[#d9dfdb] bg-white px-3.5 text-[15px] text-[#17211d] outline-none transition placeholder:text-[#9aa49f] focus:border-[#2f6f61] focus:ring-4 focus:ring-[#2f6f61]/10"
              placeholder="Alex Morgan"
            />
          </label>
        ) : null}

        <label className="grid gap-1.5 text-[13px] font-medium text-[#3e4944]">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-12 rounded-lg border border-[#d9dfdb] bg-white px-3.5 text-[15px] text-[#17211d] outline-none transition placeholder:text-[#9aa49f] focus:border-[#2f6f61] focus:ring-4 focus:ring-[#2f6f61]/10"
            placeholder="you@business.com"
          />
        </label>

        <label className="grid gap-1.5 text-[13px] font-medium text-[#3e4944]">
          <span className="flex items-center justify-between">
            Password
            {isSignup ? (
              <span className="text-xs font-normal text-[#66716c]">8+ characters</span>
            ) : null}
          </span>
          <span className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={8}
              className="h-12 w-full rounded-lg border border-[#d9dfdb] bg-white px-3.5 pr-11 text-[15px] text-[#17211d] outline-none transition placeholder:text-[#9aa49f] focus:border-[#2f6f61] focus:ring-4 focus:ring-[#2f6f61]/10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-md text-[#66716c] transition hover:bg-[#eef3f0] hover:text-[#17211d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f61]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>

        {error ? (
          <p className="rounded-lg border border-[#f3b4ad] bg-[#fff1ef] px-3.5 py-2.5 text-[13px] leading-5 text-[#a33a2f]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 flex h-12 items-center justify-center gap-2 rounded-lg bg-[#17211d] px-5 text-sm font-medium text-white shadow-[0_16px_36px_-24px_rgba(8,28,22,0.7)] transition hover:bg-[#244f47] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f61]"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {pending ? "Working..." : isSignup ? "Create account" : "Log in"}
        </button>

        <p className="text-center text-[13px] text-[#66716c]">
          {isSignup ? "Already have an account?" : "New to ReZ?"}{" "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-medium text-[#17211d] underline-offset-4 transition hover:text-[#2f6f61] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f61]"
          >
            {isSignup ? "Log in" : "Create an account"}
          </Link>
        </p>
      </form>
    </div>
  );
}
