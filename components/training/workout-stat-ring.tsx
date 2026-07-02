type Props = {
  label: string;
  value: string;
  progress: number;
  note: string;
};

export function WorkoutStatRing({ label, value, progress, note }: Props) {
  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <article className="min-w-0 text-center">
      <p className="truncate text-[11px] font-medium text-muted sm:text-xs">
        {label}
      </p>
      <div
        className="mx-auto mt-3 grid h-[78px] w-[78px] place-items-center rounded-full p-[7px] sm:h-24 sm:w-24"
        style={{
          background: `conic-gradient(#a8ff2a ${safeProgress}%, rgba(255,255,255,.08) ${safeProgress}% 100%)`,
        }}
      >
        <div className="grid h-full w-full place-items-center rounded-full bg-[#050706] text-[15px] font-bold sm:text-lg">
          {value}
        </div>
      </div>
      <p className="mt-3 min-h-8 text-[10px] font-semibold leading-4 text-acid sm:text-xs">
        {note}
      </p>
    </article>
  );
}
