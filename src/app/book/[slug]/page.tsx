import { BookingFlow } from "@/components/booking/BookingFlow";
import { AIChatBooking } from "@/components/booking/AIChatBooking";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
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

export default async function GuestBookingPage({ params }: Props) {
  const { slug } = await params;
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
          background-color: #F5F1EA;
          background-image:
            radial-gradient(ellipse 80% 50% at 15% 0%, rgba(184,99,50,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 85% 100%, rgba(120,88,60,0.07) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          background-size: auto, auto, 256px 256px;
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
            <BookingFlow slug={slug} business={data.business} services={data.services} />
          )}
        </div>
      </main>
    </>
  );
}
