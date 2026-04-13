import { BookingFlow } from "@/components/booking/BookingFlow";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getBusinessData(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/book/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function GuestBookingPage({ params }: Props) {
  const { slug } = await params;
  const data = await getBusinessData(slug);

  if (!data || !data.business) {
    notFound();
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[oklch(0.975_0.018_185)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,oklch(0.88_0.07_182/0.62),transparent_30rem),radial-gradient(circle_at_90%_20%,oklch(0.92_0.045_145/0.52),transparent_34rem)]" />
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <BookingFlow
          slug={slug}
          business={data.business}
          services={data.services}
        />
      </div>
    </main>
  );
}
