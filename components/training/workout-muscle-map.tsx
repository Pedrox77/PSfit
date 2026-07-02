"use client";

import type { MuscleGroup } from "@/lib/training/muscle-normalizer";
import { normalizeMuscles } from "@/lib/training/muscle-normalizer";
import { useTranslations } from "next-intl";

type WorkoutMuscleMapProps = {
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  muscleSets?: Record<string, number>;
  compact?: boolean;
};

type RegionProps = {
  d: string;
  muscles: MuscleGroup[];
  primary: Set<MuscleGroup>;
  secondary: Set<MuscleGroup>;
  intensity: Map<MuscleGroup, number>;
};

const visualMuscles: MuscleGroup[] = [
  "chest", "upper_chest", "back", "lats", "traps", "lower_back",
  "shoulders", "front_delts", "side_delts", "rear_delts", "biceps",
  "triceps", "forearms", "core", "abs", "obliques", "glutes",
  "quadriceps", "hamstrings", "adductors", "calves", "hip_flexors",
];

function levelOpacity(sets: number, secondary: boolean) {
  if (sets >= 6) return secondary ? 0.85 : 1;
  if (sets >= 3) return secondary ? 0.62 : 0.78;
  return secondary ? 0.4 : 0.54;
}

function MuscleRegion({
  d,
  muscles,
  primary,
  secondary,
  intensity,
}: RegionProps) {
  const primaryMatches = muscles.filter((muscle) => primary.has(muscle));
  const secondaryMatches = muscles.filter((muscle) => secondary.has(muscle));
  const active = primaryMatches.length ? primaryMatches : secondaryMatches;
  const isSecondary = !primaryMatches.length && secondaryMatches.length > 0;
  const sets = Math.max(1, ...active.map((muscle) => intensity.get(muscle) ?? 1));

  return (
    <path
      d={d}
      fill={active.length ? (isSecondary ? "#35D9F5" : "#A8FF2A") : "#151A17"}
      fillOpacity={active.length ? levelOpacity(sets, isSecondary) : 1}
      stroke={active.length ? (isSecondary ? "#64E5FA" : "#C1FF65") : "#303832"}
      strokeWidth="1"
    />
  );
}

function Figure({
  side,
  label,
  primary,
  secondary,
  intensity,
}: {
  side: "front" | "back";
  label: string;
  primary: Set<MuscleGroup>;
  secondary: Set<MuscleGroup>;
  intensity: Map<MuscleGroup, number>;
}) {
  const common = { primary, secondary, intensity };
  return (
    <svg viewBox="0 0 120 260" role="img" aria-label={label} className="h-auto w-full max-w-[128px]">
      <title>{label}</title>
      <circle cx="60" cy="17" r="13" fill="#151A17" stroke="#303832" />
      <path d="M49 31 Q60 37 71 31 L78 44 88 49 82 101 72 126 48 126 38 101 32 49 42 44Z" fill="#111613" stroke="#303832" />
      <path d="M32 48 Q22 54 19 73 L12 124 24 126 34 84 42 51Z" fill="#151A17" stroke="#303832" />
      <path d="M88 48 Q98 54 101 73 L108 124 96 126 86 84 78 51Z" fill="#151A17" stroke="#303832" />
      <path d="M48 125 36 149 39 204 52 204 60 151 68 204 81 204 84 149 72 125Z" fill="#151A17" stroke="#303832" />
      <path d="M39 203 41 248 53 248 52 203ZM68 203 67 248 79 248 81 203Z" fill="#151A17" stroke="#303832" />
      {side === "front" ? (
        <>
          <MuscleRegion d="M43 46 Q51 39 59 45 L58 70 Q48 70 40 62Z M77 46 Q69 39 61 45 L62 70 Q72 70 80 62Z" muscles={["chest", "upper_chest"]} {...common} />
          <MuscleRegion d="M34 49 Q38 42 45 43 L41 62 33 64Z M86 49 Q82 42 75 43 L79 62 87 64Z" muscles={["shoulders", "front_delts", "side_delts"]} {...common} />
          <MuscleRegion d="M28 61 37 61 33 91 24 89Z M92 61 83 61 87 91 96 89Z" muscles={["biceps"]} {...common} />
          <MuscleRegion d="M22 91 33 93 27 123 15 121Z M98 91 87 93 93 123 105 121Z" muscles={["forearms"]} {...common} />
          <MuscleRegion d="M50 72 59 71 59 111 49 108Z M61 71 70 72 71 108 61 111Z" muscles={["core", "abs"]} {...common} />
          <MuscleRegion d="M42 68 50 73 48 111 41 101Z M78 68 70 73 72 111 79 101Z" muscles={["obliques"]} {...common} />
          <MuscleRegion d="M45 119 59 122 54 145 39 151Z M75 119 61 122 66 145 81 151Z" muscles={["hip_flexors"]} {...common} />
          <MuscleRegion d="M39 151 58 145 52 199 40 199Z M81 151 62 145 68 199 80 199Z" muscles={["quadriceps"]} {...common} />
          <MuscleRegion d="M52 139 59 143 54 169 48 165Z M68 139 61 143 66 169 72 165Z" muscles={["adductors"]} {...common} />
          <MuscleRegion d="M41 205 52 205 52 242 42 242Z M68 205 79 205 78 242 68 242Z" muscles={["calves"]} {...common} />
        </>
      ) : (
        <>
          <MuscleRegion d="M48 40 60 48 72 40 76 58 60 69 44 58Z" muscles={["traps", "back"]} {...common} />
          <MuscleRegion d="M34 49 Q38 42 45 43 L42 62 33 64Z M86 49 Q82 42 75 43 L78 62 87 64Z" muscles={["shoulders", "rear_delts", "side_delts"]} {...common} />
          <MuscleRegion d="M43 59 59 69 57 101 43 91Z M77 59 61 69 63 101 77 91Z" muscles={["back", "lats"]} {...common} />
          <MuscleRegion d="M28 61 37 62 33 91 24 89Z M92 61 83 62 87 91 96 89Z" muscles={["triceps"]} {...common} />
          <MuscleRegion d="M22 91 33 93 27 123 15 121Z M98 91 87 93 93 123 105 121Z" muscles={["forearms"]} {...common} />
          <MuscleRegion d="M48 96 59 102 59 121 44 115Z M72 96 61 102 61 121 76 115Z" muscles={["lower_back", "back"]} {...common} />
          <MuscleRegion d="M42 120 59 123 58 148 39 145Z M78 120 61 123 62 148 81 145Z" muscles={["glutes"]} {...common} />
          <MuscleRegion d="M39 150 58 149 52 199 40 199Z M81 150 62 149 68 199 80 199Z" muscles={["hamstrings"]} {...common} />
          <MuscleRegion d="M41 205 52 205 52 242 42 242Z M68 205 79 205 78 242 68 242Z" muscles={["calves"]} {...common} />
        </>
      )}
    </svg>
  );
}

export function WorkoutMuscleMap({
  primaryMuscles,
  secondaryMuscles = [],
  muscleSets = {},
  compact = false,
}: WorkoutMuscleMapProps) {
  const t = useTranslations("WorkoutComplete");
  let primaryList = normalizeMuscles(primaryMuscles);
  let secondaryList = normalizeMuscles(secondaryMuscles).filter(
    (muscle) => !primaryList.includes(muscle),
  );
  if (primaryList.includes("full_body")) {
    primaryList = [...new Set([...primaryList, ...visualMuscles])];
    secondaryList = [];
  }
  const primary = new Set(primaryList);
  const secondary = new Set(secondaryList);
  const intensity = new Map<MuscleGroup, number>();
  for (const [muscle, sets] of Object.entries(muscleSets)) {
    const normalized = normalizeMuscles([muscle])[0];
    if (normalized) intensity.set(normalized, sets);
  }
  const visibleNames = [...primaryList, ...secondaryList].filter(
    (muscle, index, all) => all.indexOf(muscle) === index,
  );

  return (
    <section className={`${compact ? "mt-4" : "mt-6"} rounded-2xl border border-white/[.08] bg-black/20 p-4`}>
      <p className="text-xs font-bold uppercase tracking-[.18em] text-acid">{t("trainedAreas")}</p>
      {visibleNames.length ? (
        <>
          <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-4">
            <div className="flex flex-col items-center">
              <Figure side="front" label={`${t("trainedAreas")} — ${t("front")}`} primary={primary} secondary={secondary} intensity={intensity} />
              <span className="mt-1 text-[10px] uppercase tracking-widest text-muted">{t("front")}</span>
            </div>
            <div className="flex flex-col items-center">
              <Figure side="back" label={`${t("trainedAreas")} — ${t("back")}`} primary={primary} secondary={secondary} intensity={intensity} />
              <span className="mt-1 text-[10px] uppercase tracking-widest text-muted">{t("back")}</span>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-paper">
            {visibleNames.map((muscle) => t(`muscleNames.${muscle}`)).join(" · ")}
          </p>
          <div className="mt-3 flex justify-center gap-5 text-[11px] text-muted">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-acid" />{t("primary")}</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-aqua/70" />{t("secondary")}</span>
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted">{t("unidentifiedMuscles")}</p>
      )}
    </section>
  );
}
