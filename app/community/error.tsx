"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PSFIT COMMUNITY ERROR]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="px-6 py-24 text-center">
      <h2 className="text-xl font-semibold">
        Community could not load.
      </h2>
      <p className="mt-2 text-sm text-muted">
        Your connection or the Community database may be unavailable.
      </p>
      <button
        onClick={reset}
        className="mt-5 rounded-full bg-acid px-5 py-2 text-sm font-bold text-ink"
      >
        Try again
      </button>
    </div>
  );
}
