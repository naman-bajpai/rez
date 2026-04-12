"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Stockholm",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
];

type Props = {
  defaultTimezone: string;
  defaultName?: string | null;
};

export function OnboardingForm({ defaultTimezone, defaultName }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const timezones = useMemo(() => {
    const set = new Set<string>([defaultTimezone, ...COMMON_TIMEZONES]);
    try {
      const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] })
        .supportedValuesOf?.("timeZone");
      supported?.forEach((tz) => set.add(tz));
    } catch {
      /* ignore */
    }
    return Array.from(set).sort();
  }, [defaultTimezone]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    const businessName = String(form.get("businessName") ?? "").trim();
    const timezone = String(form.get("timezone") ?? "").trim();

    const res = await fetch("/api/onboarding/creator", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ businessName, timezone }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setPending(false);
      setError(data.error ?? "Could not save. Try again.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const placeholderName = defaultName ? `${defaultName}’s studio` : "Morgan Hair Studio";

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-5">
      <label className="grid gap-1.5 text-[13px] font-medium text-zinc-800">
        Business name
        <input
          name="businessName"
          type="text"
          required
          minLength={2}
          maxLength={80}
          autoFocus
          className="h-11 rounded-lg border border-zinc-200 bg-white px-3.5 text-[15px] text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5"
          placeholder={placeholderName}
        />
        <span className="text-[11px] font-normal text-zinc-500">
          Shown on your booking page and confirmations.
        </span>
      </label>

      <label className="grid gap-1.5 text-[13px] font-medium text-zinc-800">
        Timezone
        <select
          name="timezone"
          required
          defaultValue={defaultTimezone}
          className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-[15px] text-zinc-950 outline-none transition focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5"
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <span className="text-[11px] font-normal text-zinc-500">
          Used for slots, reminders, and calendar invites.
        </span>
      </label>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] leading-5 text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-[#fbfaf7] shadow-[0_8px_24px_-12px_rgba(39,39,42,0.5)] transition hover:bg-zinc-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Creating workspace…" : "Continue to dashboard"}
      </button>
    </form>
  );
}
