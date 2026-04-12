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
    <main className="mx-auto flex max-w-md flex-col gap-4 p-8">
      <h1 className="text-xl font-semibold">Book</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Add a business slug to the URL, for example{" "}
        <Link className="underline" href="/book?slug=demo">
          /book?slug=demo
        </Link>
        .
      </p>
    </main>
  );
}
