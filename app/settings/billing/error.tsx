"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function BillingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PSFIT BILLING ERROR]", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-ink p-5 text-paper">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-surface p-7">
        <p className="text-sm font-bold text-red-300">
          BILLING ERROR
        </p>

        <h1 className="mt-3 text-2xl font-semibold">
          Plans could not be loaded
        </h1>

        <p className="mt-3 text-sm text-muted">
          Check the terminal for the detailed error and try loading the page
          again.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-acid px-5 py-3 font-bold text-ink"
          >
            Try again
          </button>

          <Link
            href="/dashboard"
            className="rounded-full border border-white/10 px-5 py-3 font-semibold"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}