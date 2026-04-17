import { BookingFlow } from "@/components/booking/BookingFlow";
import { AIChatBooking } from "@/components/booking/AIChatBooking";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
};

async function getBusinessData(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/book/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function GuestBookingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { view } = await searchParams;
  const data = await getBusinessData(slug);

  if (!data || !data.business) notFound();

  const isAiChat = data.business.booking_mode === "ai_chat";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        html, body { margin: 0; padding: 0; }

        .bk-page {
          min-height: 100dvh;
          background-color: #F8F8FC;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 48px 16px 80px;
        }

        @media (max-width: 640px) {
          .bk-page { padding: 24px 12px 60px; }
        }
      `}</style>
      <main className="bk-page">
        <div style={{ width: "100%", maxWidth: isAiChat ? 480 : 760 }}>
          {isAiChat ? (
            <AIChatBooking slug={slug} business={data.business} services={data.services} />
          ) : (
            <BookingFlow
              slug={slug}
              business={data.business}
              services={data.services}
              initialView={view === "upcoming" ? "upcoming" : undefined}
            />
          )}
        </div>
      </main>
    </>
  );
}
