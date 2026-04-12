"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createAuthClient } from "better-auth/react";

type AuthMode = "login" | "signup";

const authClient = createAuthClient();

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isSignup = mode === "signup";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const result = isSignup
      ? await authClient.signUp.email({
          name: String(form.get("name") ?? ""),
          email,
          password,
        })
      : await authClient.signIn.email({
          email,
          password,
        });

    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Something went wrong. Try again.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-4">
      {isSignup ? (
        <label className="grid gap-2 text-sm font-medium text-zinc-800">
          Name
          <input
            name="name"
            type="text"
            autoComplete="name"
            required
            className="h-12 rounded-lg border border-zinc-200 bg-white px-4 text-base text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-violet-100"
            placeholder="Alex Morgan"
          />
        </label>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-zinc-800">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 rounded-lg border border-zinc-200 bg-white px-4 text-base text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-violet-100"
          placeholder="you@business.com"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-zinc-800">
        Password
        <input
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
          minLength={8}
          className="h-12 rounded-lg border border-zinc-200 bg-white px-4 text-base text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-violet-100"
          placeholder="Minimum 8 characters"
        />
      </label>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-12 rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-[#fbfaf7] transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Working..." : isSignup ? "Create account" : "Log in"}
      </button>

      <p className="text-center text-sm text-zinc-600">
        {isSignup ? "Already have an account?" : "New to ReZ?"}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-semibold text-violet-700 hover:text-violet-900"
        >
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
