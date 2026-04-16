import Link from "next/link";
import { createServiceRoleClient } from "@/lib/server/supabase";
import { PostBookingChat } from "@/components/booking/PostBookingChat";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ booking_id?: string }>;
};

async function getBookingDetails(bookingId: string) {
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("bookings")
      .select("id, starts_at, ends_at, status, guest_name, guest_email, services(name, duration_mins, price)")
      .eq("id", bookingId)
      .maybeSingle();
    return data;
  } catch { return null; }
}

function fmt(dateStr: string) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
  };
}

export default async function BookingSuccessPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { booking_id } = await searchParams;
  const booking = booking_id ? await getBookingDetails(booking_id) : null;

  const startInfo = booking?.starts_at ? fmt(booking.starts_at) : null;
  const endTime = booking?.ends_at
    ? new Date(booking.ends_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : null;

  const svc = booking?.services
    ? (Array.isArray(booking.services) ? booking.services[0] as { name: string; duration_mins: number; price: number } | undefined : booking.services as { name: string; duration_mins: number; price: number } | null)
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        html, body { margin: 0; padding: 0; }

        .suc-page {
          min-height: 100dvh;
          background-color: #F5F1EA;
          background-image:
            radial-gradient(ellipse 70% 40% at 50% 0%, rgba(184,99,50,0.09) 0%, transparent 55%),
            radial-gradient(ellipse 50% 60% at 100% 100%, rgba(120,88,60,0.06) 0%, transparent 50%);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 60px 16px 80px;
          font-family: 'DM Sans', -apple-system, sans-serif;
        }

        @media (max-width: 640px) {
          .suc-page { padding: 36px 14px 60px; }
        }

        .suc-card {
          background: white;
          border: 1px solid #E4DDD4;
          border-radius: 22px;
          box-shadow: 0 2px 32px -8px rgba(26,22,20,0.10);
          overflow: hidden;
          margin-bottom: 12px;
        }

        .suc-serif { font-family: 'Fraunces', Georgia, serif; }

        .suc-btn-primary {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; height: 50px; border-radius: 14px;
          background: #1A1614; color: white; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
          text-decoration: none; transition: all 0.18s ease;
        }
        .suc-btn-primary:hover {
          background: #26201C;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px -4px rgba(26,22,20,0.22);
        }

        .suc-btn-ghost {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          width: 100%; height: 44px; border-radius: 12px;
          background: transparent; color: #7C736D; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500;
          text-decoration: none; transition: color 0.15s;
        }
        .suc-btn-ghost:hover { color: #1A1614; }

        @keyframes sucIn {
          from { opacity: 0; transform: translateY(14px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .suc-in { animation: sucIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .suc-in-2 { animation: sucIn 0.5s 80ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .suc-in-3 { animation: sucIn 0.5s 160ms cubic-bezier(0.16, 1, 0.3, 1) both; }

        @keyframes checkPop {
          0% { transform: scale(0.4); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .suc-check { animation: checkPop 0.55s 100ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      `}</style>

      <main className="suc-page">
        <div style={{ width: "100%", maxWidth: 440 }}>

          {/* Check icon + heading */}
          <div className="suc-in" style={{ textAlign: "center", marginBottom: 28 }}>
            <div className="suc-check" style={{
              width: 68, height: 68, borderRadius: "50%",
              background: "#EDFAF3",
              border: "1.5px solid #A7F0C4",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginBottom: 20,
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1A7A4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="suc-serif" style={{ fontSize: 32, fontWeight: 400, color: "#1A1614", marginBottom: 6, lineHeight: 1.15 }}>
              {booking?.guest_name ? `See you soon, ${booking.guest_name.split(" ")[0]}!` : "You're booked!"}
            </h1>
            <p style={{ fontSize: 14, color: "#7C736D" }}>
              Your appointment has been confirmed.
            </p>
          </div>

          {/* Booking details card */}
          {booking && (
            <div className="suc-card suc-in-2">
              {/* Service row */}
              <div style={{ padding: "20px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1614" }}>{svc?.name ?? "Appointment"}</p>
                  {svc?.duration_mins && (
                    <p style={{ fontSize: 13, color: "#7C736D", marginTop: 2 }}>{svc.duration_mins} min</p>
                  )}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
                  background: "#EDFAF3", color: "#1A7A4A", textTransform: "capitalize",
                }}>
                  {booking.status}
                </span>
              </div>

              {/* Date/time */}
              {startInfo && (
                <>
                  <div style={{ height: 1, background: "#EDE8E2" }} />
                  <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, background: "#F5F1EA",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C736D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div>
                        <p style={{ fontSize: 13.5, fontWeight: 500, color: "#1A1614" }}>{startInfo.date}</p>
                        <p style={{ fontSize: 13, color: "#7C736D" }}>
                          {startInfo.time}{endTime && ` – ${endTime}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Email + ref */}
              {(booking.guest_email || booking_id) && (
                <>
                  <div style={{ height: 1, background: "#EDE8E2" }} />
                  <div style={{ padding: "12px 22px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                    {booking.guest_email && (
                      <p style={{ fontSize: 12, color: "#ABA39D" }}>
                        Confirmation → <strong style={{ color: "#7C736D" }}>{booking.guest_email}</strong>
                      </p>
                    )}
                    {booking_id && (
                      <p style={{ fontSize: 11.5, color: "#ABA39D", fontFamily: "monospace" }}>
                        #{booking_id.slice(0, 8).toUpperCase()}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Post-booking chat */}
          {booking_id && (
            <div className="suc-in-3">
              <PostBookingChat slug={slug} bookingId={booking_id} />
            </div>
          )}

          {/* Actions */}
          <div className="suc-in-3" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
            <Link href={`/book/${slug}`} className="suc-btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Book another appointment
            </Link>
            <Link href="/" className="suc-btn-ghost">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              Back to home
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
