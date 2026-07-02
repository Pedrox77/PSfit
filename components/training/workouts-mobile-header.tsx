"use client";

import { Flame, Search, Settings, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = {
  title: string;
  streak: number;
  searchPlaceholder: string;
  defaultQuery?: string;
};

export function WorkoutsMobileHeader({
  title,
  streak,
  searchPlaceholder,
  defaultQuery = "",
}: Props) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(Boolean(defaultQuery));
  const [query, setQuery] = useState(defaultQuery);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/workouts?q=${encodeURIComponent(value)}` : "/workouts");
  }

  return (
    <div className="lg:hidden">
      <div className="flex min-h-16 items-center justify-between gap-3">
        <button
          type="button"
          aria-label={searchPlaceholder}
          onClick={() => setSearchOpen((value) => !value)}
          className="grid h-11 w-11 place-items-center rounded-full text-paper transition hover:bg-white/[0.06]"
        >
          {searchOpen ? <X size={25} /> : <Search size={27} />}
        </button>

        <h1 className="text-center text-[1.65rem] font-semibold tracking-tight">
          {title}
        </h1>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-sm font-bold">
            <Flame size={24} className="fill-acid text-acid" />
            {streak}
          </span>
          <Link
            href="/settings"
            aria-label="Settings"
            className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-white/[0.06]"
          >
            <Settings size={27} />
          </Link>
        </div>
      </div>

      {searchOpen && (
        <form onSubmit={submit} className="pb-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
            <Search size={18} className="text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
        </form>
      )}
    </div>
  );
}
