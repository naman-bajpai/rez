"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z"
    />
  </svg>
);

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  heroImageSrc?: string;
  heroImageAlt?: string;
  testimonials?: Testimonial[];
  highlights?: Array<{ label: string; value: string }>;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  children?: React.ReactNode;
}

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-[#d9dfdb] bg-white transition-colors focus-within:border-[#2f6f61] focus-within:ring-4 focus-within:ring-[#2f6f61]/10">
    {children}
  </div>
);

const defaultHighlights = [
  { label: "DMs handled", value: "184" },
  { label: "Deposits held", value: "$3.8k" },
  { label: "Open slots", value: "17" },
];

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-[400] text-[#17211d]">Welcome</span>,
  description = "",
  eyebrow = "ReZ booking desk",
  highlights = defaultHighlights,
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  children,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="dash-root min-h-[100dvh] bg-[#f5f7f6] text-[#17211d]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <section className="flex min-h-[100dvh] flex-col">
          <nav className="flex items-center justify-between gap-4">
            <Link href="/" className="text-base font-medium text-[#17211d] transition hover:text-[#2f6f61]">
              ReZ
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-[#d9dfdb] bg-white px-3 py-2 text-sm text-[#53615b] shadow-[0_1px_0_rgba(18,32,27,0.04)] transition hover:border-[#b9c5bf] hover:text-[#17211d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f61]"
            >
              Back home
            </Link>
          </nav>

          <div className="flex flex-1 items-center justify-center py-10 lg:py-14">
            <div className="w-full max-w-[38rem]">
              <div className="space-y-4 text-center">
                {eyebrow ? (
                  <p className="animate-element animate-delay-100 text-sm font-medium text-[#2f6f61]">{eyebrow}</p>
                ) : null}
                {title ? (
                  <h1 className="animate-element animate-delay-200 mx-auto max-w-[16ch] text-4xl font-[400] leading-[1.05] text-[#17211d] text-balance sm:text-5xl lg:text-6xl">
                    {title}
                  </h1>
                ) : null}
                {description ? (
                  <p className="animate-element animate-delay-300 mx-auto max-w-[34rem] text-base leading-7 text-[#5c6862]">
                    {description}
                  </p>
                ) : null}
              </div>

              {children ? (
                <div className="animate-element animate-delay-400 mx-auto mt-8 w-full max-w-[31rem]">{children}</div>
              ) : (
                <div className="animate-element animate-delay-400 mx-auto mt-8 w-full max-w-[31rem] rounded-lg border border-[#d9dfdb] bg-white p-5 shadow-[0_24px_80px_-52px_rgba(8,28,22,0.48)] sm:p-6">
                  <form className="space-y-5" onSubmit={onSignIn}>
                    <div>
                      <label className="text-sm font-[400] text-[#53615b]">Email address</label>
                      <GlassInputWrapper>
                        <input
                          name="email"
                          type="email"
                          placeholder="you@business.com"
                          className="w-full rounded-lg bg-transparent p-4 text-sm text-[#17211d] outline-none placeholder:text-[#9aa49f]"
                        />
                      </GlassInputWrapper>
                    </div>

                    <div>
                      <label className="text-sm font-[400] text-[#53615b]">Password</label>
                      <GlassInputWrapper>
                        <div className="relative">
                          <input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="w-full rounded-lg bg-transparent p-4 pr-12 text-sm text-[#17211d] outline-none placeholder:text-[#9aa49f]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-2 grid w-9 place-items-center rounded-md text-[#66716c] transition hover:bg-[#eef3f0] hover:text-[#17211d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f61]"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </GlassInputWrapper>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <label className="flex cursor-pointer items-center gap-3">
                        <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                        <span className="text-[#3e4944]">Keep me signed in</span>
                      </label>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onResetPassword?.();
                        }}
                        className="font-medium text-[#2f6f61] transition hover:text-[#244f47] hover:underline"
                      >
                        Reset password
                      </a>
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-[#17211d] py-4 font-medium text-white shadow-[0_16px_36px_-24px_rgba(8,28,22,0.7)] transition hover:bg-[#244f47] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f61]"
                    >
                      Sign in
                    </button>
                  </form>

                  <button
                    onClick={onGoogleSignIn}
                    className="mt-5 flex w-full items-center justify-center gap-3 rounded-lg border border-[#d9dfdb] bg-white py-4 transition hover:border-[#b9c5bf] hover:bg-[#f6f9f7] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6f61]"
                  >
                    <GoogleIcon />
                    Continue with Google
                  </button>

                  <p className="mt-5 text-center text-sm text-[#66716c]">
                    New to ReZ?{" "}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onCreateAccount?.();
                      }}
                      className="font-medium text-[#17211d] underline-offset-4 transition hover:text-[#2f6f61] hover:underline"
                    >
                      Create account
                    </a>
                  </p>
                </div>
              )}

              {highlights.length > 0 ? (
                <dl className="animate-element animate-delay-500 mx-auto mt-8 grid w-full max-w-[31rem] grid-cols-3 gap-2">
                  {highlights.map((item) => (
                    <div key={item.label} className="rounded-lg border border-[#d9dfdb] bg-white/70 px-3 py-3">
                      <dt className="text-xs leading-4 text-[#66716c]">{item.label}</dt>
                      <dd className="mt-1 font-medium tabular-nums text-[#17211d]">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
