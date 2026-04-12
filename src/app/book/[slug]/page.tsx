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
    <main className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <BookingFlow
          slug={slug}
          business={data.business}
          services={data.services}
        />
      </div>
    </main>
  );
}
