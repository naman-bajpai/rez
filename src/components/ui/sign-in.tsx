"use client";

import React, { useState } from "react";
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
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  children?: React.ReactNode;
}

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-[var(--dash-border,#E4E4E7)] bg-white/90 transition-colors focus-within:border-[var(--dash-accent,#7C3AED)] focus-within:bg-[var(--dash-accent-soft,#F5F3FF)]">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial; delay: string }) => (
  <div
    className={`animate-testimonial ${delay} flex w-64 items-start gap-3 rounded-3xl border border-[var(--dash-border,#E4E4E7)] bg-white/90 p-5 shadow-[var(--dash-shadow-card,0_1px_3px_rgba(0,0,0,0.06))]`}
  >
    <img src={testimonial.avatarSrc} className="h-10 w-10 rounded-2xl object-cover" alt={testimonial.name} />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-[400] text-[var(--dash-text,#18181B)]">{testimonial.name}</p>
      <p className="text-[var(--dash-muted,#71717A)]">{testimonial.handle}</p>
      <p className="mt-1 text-[var(--dash-text-secondary,#3F3F46)]">{testimonial.text}</p>
    </div>
  </div>
);

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-[400] tracking-tight text-[var(--dash-text,#18181B)]">Welcome</span>,
  description = "",
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  children,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="dash-root flex h-[100dvh] w-full overflow-hidden bg-[var(--dash-page-bg,#F8F8FC)] font-sans md:flex-row">
      <section className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-5 md:p-8">
        <div className="w-full max-w-md py-2">
          <div className="flex flex-col gap-5">
            <h1 className="animate-element animate-delay-100 text-4xl leading-tight md:text-5xl">{title}</h1>
            <p className="animate-element animate-delay-200 text-[var(--dash-muted,#71717A)]">{description}</p>

            {children ? (
              <div className="animate-element animate-delay-300">{children}</div>
            ) : (
              <>
                <form className="space-y-5" onSubmit={onSignIn}>
                  <div className="animate-element animate-delay-300">
                    <label className="text-sm font-[400] text-[var(--dash-muted,#71717A)]">Email Address</label>
                    <GlassInputWrapper>
                      <input
                        name="email"
                        type="email"
                        placeholder="Enter your email address"
                        className="w-full rounded-2xl bg-transparent p-4 text-sm text-[var(--dash-text,#18181B)] focus:outline-none"
                      />
                    </GlassInputWrapper>
                  </div>

                  <div className="animate-element animate-delay-400">
                    <label className="text-sm font-[400] text-[var(--dash-muted,#71717A)]">Password</label>
                    <GlassInputWrapper>
                      <div className="relative">
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="w-full rounded-2xl bg-transparent p-4 pr-12 text-sm text-[var(--dash-text,#18181B)] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-[var(--dash-muted,#71717A)] transition-colors hover:text-[var(--dash-text,#18181B)]" />
                          ) : (
                            <Eye className="h-5 w-5 text-[var(--dash-muted,#71717A)] transition-colors hover:text-[var(--dash-text,#18181B)]" />
                          )}
                        </button>
                      </div>
                    </GlassInputWrapper>
                  </div>

                  <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                      <span className="text-[var(--dash-text-secondary,#3F3F46)]">Keep me signed in</span>
                    </label>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onResetPassword?.();
                      }}
                      className="text-[var(--dash-accent,#7C3AED)] transition-colors hover:underline"
                    >
                      Reset password
                    </a>
                  </div>

                  <button
                    type="submit"
                    className="animate-element animate-delay-600 w-full rounded-2xl bg-[var(--dash-accent,#7C3AED)] py-4 font-[400] text-white transition-colors hover:bg-[var(--dash-accent-hover,#6D28D9)]"
                  >
                    Sign In
                  </button>
                </form>

                <div className="animate-element animate-delay-700 relative flex items-center justify-center">
                  <span className="w-full border-t border-[var(--dash-border,#E4E4E7)]" />
                  <span className="absolute bg-[var(--dash-page-bg,#F8F8FC)] px-4 text-sm text-[var(--dash-muted,#71717A)]">
                    Or continue with
                  </span>
                </div>

                <button
                  onClick={onGoogleSignIn}
                  className="animate-element animate-delay-800 flex w-full items-center justify-center gap-3 rounded-2xl border border-[var(--dash-border,#E4E4E7)] bg-white py-4 transition-colors hover:bg-[var(--dash-surface-muted,#F4F4F5)]"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <p className="animate-element animate-delay-900 text-center text-sm text-[var(--dash-muted,#71717A)]">
                  New to our platform?{" "}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onCreateAccount?.();
                    }}
                    className="text-[var(--dash-accent,#7C3AED)] transition-colors hover:underline"
                  >
                    Create Account
                  </a>
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {heroImageSrc && (
        <section className="relative hidden min-h-0 flex-1 overflow-hidden p-4 md:block">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl border border-[var(--dash-border,#E4E4E7)] bg-cover bg-center shadow-[var(--dash-shadow-card,0_1px_3px_rgba(0,0,0,0.06))]"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          />
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 flex w-full -translate-x-1/2 justify-center gap-4 px-8">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && (
                <div className="hidden xl:flex">
                  <TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" />
                </div>
              )}
              {testimonials[2] && (
                <div className="hidden 2xl:flex">
                  <TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
