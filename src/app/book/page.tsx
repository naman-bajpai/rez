import Link from "next/link";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ slug?: string }>;
};

/** Redirect helper — pass `?slug=` to continue to the guest booking UI. */
export default async function BookRedirectPage({ searchParams }: Props) {
  const { slug } = await searchParams;
  if (slug) {
    redirect(`/book/${encodeURIComponent(slug)}`);
  }
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center gap-4 bg-[#F8F8FC] p-8 text-[#18181B]">
      <h1 className="text-xl font-[400]">Book</h1>
      <p className="text-sm text-[#3F3F46]">
        Add a business slug to the URL, for example{" "}
        <Link className="text-[#7C3AED] underline" href="/book?slug=demo">
          /book?slug=demo
        </Link>
        .
      </p>
    </main>
  );
}
