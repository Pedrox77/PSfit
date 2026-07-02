import { Dumbbell, MoreVertical } from "lucide-react";
import Link from "next/link";

type Props = {
  title: string;
  duration: string;
  exercises: string[];
  focus?: string | null;
  href?: string | null;
  openLabel: string;
  createLabel: string;
  exerciseCountLabel?: string;
  statusLabel?: string;
};

export function WorkoutSummaryCard({
  title,
  duration,
  exercises,
  focus,
  href,
  openLabel,
  createLabel,
  exerciseCountLabel,
  statusLabel,
}: Props) {
  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#070a08] p-5 shadow-[0_18px_70px_rgba(0,0,0,.28)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-acid/40 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-acid/10 text-acid ring-1 ring-acid/15">
            <Dumbbell size={27} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold sm:text-2xl">{title}</h2>
            <p className="mt-1 text-sm text-muted">
              {duration}
              {focus ? ` · ${focus}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">{exerciseCountLabel&&<span className="rounded-full border border-white/10 px-2.5 py-1 text-muted">{exerciseCountLabel}</span>}{statusLabel&&<span className="rounded-full border border-acid/25 bg-acid/[.06] px-2.5 py-1 font-semibold text-acid">{statusLabel}</span>}</div>
          </div>
        </div>

        <details className="relative">
          <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full text-muted transition hover:bg-white/[0.06] hover:text-paper [&::-webkit-details-marker]:hidden">
            <MoreVertical size={23} />
          </summary>
          <div className="absolute right-0 z-20 mt-2 w-44 rounded-2xl border border-white/10 bg-[#111512] p-2 shadow-2xl">
            {href && (
              <Link href={href} className="block rounded-xl px-3 py-2 text-sm hover:bg-white/[0.06]">
                {openLabel}
              </Link>
            )}
            <Link href="/training/new" className="block rounded-xl px-3 py-2 text-sm hover:bg-white/[0.06]">
              {createLabel}
            </Link>
          </div>
        </details>
      </div>

      <div className="mt-6 space-y-3">
        {exercises.slice(0, 4).map((exercise) => (
          <div key={exercise} className="flex items-center gap-3 text-base sm:text-lg">
            <span className="h-1.5 w-1.5 rounded-full bg-acid" />
            <span>{exercise}</span>
          </div>
        ))}
      </div>

      {href && (
        <Link
          href={href}
          className="mt-6 flex w-full items-center justify-center rounded-2xl bg-white/[0.055] px-4 py-3 text-sm font-semibold transition hover:bg-acid hover:text-ink"
        >
          {openLabel}
        </Link>
      )}
    </article>
  );
}
