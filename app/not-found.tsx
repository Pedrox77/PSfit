import Link from "next/link";
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center sm:px-5">
      <div>
        <p className="eyebrow">404 · Off route</p>
        <h1 className="mt-5 text-4xl font-semibold sm:text-6xl">
          This path needs adapting.
        </h1>
        <p className="mt-5 text-muted">
          The page moved or never existed. Your progress is safe.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-acid px-5 py-3 font-bold text-ink"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
