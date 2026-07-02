import Link from "next/link";

type DayItem = {
  date: string;
  label: string;
  number: string;
  isToday: boolean;
  hasWorkout: boolean;
  completed: boolean;
};

type Props = {
  days: DayItem[];
  selectedDate: string;
  query?: string;
  ariaLabel: string;
};

export function WorkoutsWeekStrip({
  days,
  selectedDate,
  query,
  ariaLabel,
}: Props) {
  return (
    <nav
      aria-label={ariaLabel}
      className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
    >
      <div className="grid min-w-[560px] grid-cols-7 gap-2 sm:min-w-0">
        {days.map((day) => {
          const active = day.date === selectedDate;
          const params = new URLSearchParams({ date: day.date });
          if (query) params.set("q", query);

          return (
            <Link
              key={day.date}
              href={`/workouts?${params.toString()}`}
              aria-current={active ? "date" : undefined}
              className={`relative flex min-h-[74px] flex-col items-center justify-center rounded-2xl border text-center transition ${
                active
                  ? "border-acid/50 bg-acid text-ink shadow-[0_0_26px_rgba(168,255,42,.13)]"
                  : "border-transparent text-muted hover:border-white/10 hover:bg-white/[0.035]"
              }`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">
                {day.label}
              </span>
              <strong className="mt-1 text-xl">{day.number}</strong>
              {(day.hasWorkout || day.completed) && (
                <span
                  className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${
                    active ? "bg-ink" : day.completed ? "bg-aqua" : "bg-acid"
                  }`}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
