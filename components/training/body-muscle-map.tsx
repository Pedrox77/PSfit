"use client";

type MuscleKey =
  | "chest"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "core"
  | "obliques"
  | "back"
  | "traps"
  | "lower_back"
  | "glutes"
  | "quads"
  | "hamstrings"
  | "calves";

type BodyMuscleMapProps = {
  muscles?: string[];
  workoutTitle?: string;
  compact?: boolean;
};

const MUSCLE_LABELS: Record<MuscleKey, string> = {
  chest: "Peito",
  shoulders: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  forearms: "Antebraços",
  core: "Abdômen",
  obliques: "Oblíquos",
  back: "Costas",
  traps: "Trapézio",
  lower_back: "Lombar",
  glutes: "Glúteos",
  quads: "Quadríceps",
  hamstrings: "Posteriores",
  calves: "Panturrilhas",
};

const ALL_MUSCLES = Object.keys(MUSCLE_LABELS) as MuscleKey[];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function detectMuscles(values: string[], workoutTitle = "") {
  const text = normalize([...values, workoutTitle].filter(Boolean).join(" "));
  const active = new Set<MuscleKey>();

  const add = (...muscles: MuscleKey[]) => {
    muscles.forEach((muscle) => active.add(muscle));
  };

  if (
    includesAny(text, [
      "full body",
      "fullbody",
      "corpo inteiro",
      "treino completo",
    ])
  ) {
    ALL_MUSCLES.forEach((muscle) => active.add(muscle));
    return active;
  }

  if (
    includesAny(text, [
      "upper body",
      "upper a",
      "upper b",
      "superiores",
      "membros superiores",
    ])
  ) {
    add(
      "chest",
      "shoulders",
      "biceps",
      "triceps",
      "forearms",
      "back",
      "traps",
    );
  }

  if (
    includesAny(text, [
      "lower body",
      "lower a",
      "lower b",
      "inferiores",
      "membros inferiores",
      "pernas",
      "legs",
    ])
  ) {
    add("glutes", "quads", "hamstrings", "calves");
  }

  if (includesAny(text, ["peito", "chest", "peitoral"])) add("chest");

  if (
    includesAny(text, [
      "ombro",
      "shoulder",
      "deltoide",
      "deltoid",
      "front delt",
      "side delt",
      "rear delt",
    ])
  ) {
    add("shoulders");
  }

  if (includesAny(text, ["biceps", "bíceps"])) add("biceps");
  if (includesAny(text, ["triceps", "tríceps"])) add("triceps");

  if (
    includesAny(text, [
      "antebraco",
      "antebraço",
      "forearm",
      "pegada",
      "grip",
    ])
  ) {
    add("forearms");
  }

  if (
    includesAny(text, [
      "abdomen",
      "abdominal",
      "abs",
      "core",
      "reto abdominal",
    ])
  ) {
    add("core");
  }

  if (includesAny(text, ["obliquo", "oblíquo", "oblique"])) {
    add("obliques");
  }

  if (
    includesAny(text, [
      "costas",
      "dorsal",
      "dorsais",
      "back",
      "lat",
      "lats",
      "latissimo",
    ])
  ) {
    add("back");
  }

  if (includesAny(text, ["trapezio", "trapézio", "trap", "traps"])) {
    add("traps");
  }

  if (
    includesAny(text, [
      "lombar",
      "lower back",
      "eretor",
      "extensao lombar",
      "extensão lombar",
    ])
  ) {
    add("lower_back");
  }

  if (includesAny(text, ["gluteo", "glúteo", "glutes", "glute"])) {
    add("glutes");
  }

  if (
    includesAny(text, [
      "quadriceps",
      "quadríceps",
      "quads",
      "coxa anterior",
    ])
  ) {
    add("quads");
  }

  if (
    includesAny(text, [
      "posterior",
      "posteriores",
      "hamstring",
      "isquiotib",
      "coxa posterior",
    ])
  ) {
    add("hamstrings");
  }

  if (
    includesAny(text, [
      "panturrilha",
      "panturrilhas",
      "calf",
      "calves",
      "gemeos",
      "gêmeos",
    ])
  ) {
    add("calves");
  }

  return active;
}

function MuscleShape({
  id,
  d,
  active,
  label,
}: {
  id: string;
  d: string;
  active: boolean;
  label: string;
}) {
  return (
    <path
      id={id}
      d={d}
      fill={active ? "#9CFF1A" : "#202622"}
      stroke={active ? "#D8FF94" : "rgba(255,255,255,0.10)"}
      strokeWidth="1.2"
      strokeLinejoin="round"
      className="transition-all duration-300"
      style={{
        filter: active
          ? "drop-shadow(0 0 7px rgba(156,255,26,.66))"
          : undefined,
      }}
      aria-label={active ? `${label}: área trabalhada` : label}
    >
      <title>
        {active ? `${label} — área trabalhada` : `${label} — não destacada`}
      </title>
    </path>
  );
}

function NeutralShape({
  d,
  opacity = 1,
}: {
  d: string;
  opacity?: number;
}) {
  return (
    <path
      d={d}
      fill="#202622"
      stroke="rgba(255,255,255,0.10)"
      strokeWidth="1.2"
      strokeLinejoin="round"
      opacity={opacity}
    />
  );
}

function FrontBody({ active }: { active: Set<MuscleKey> }) {
  return (
    <figure className="flex min-w-0 flex-col items-center">
      <figcaption className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-muted">
        Frente
      </figcaption>

      <svg
        viewBox="0 0 180 360"
        className="h-[260px] w-[130px] max-w-full sm:h-[300px] sm:w-[150px]"
        role="img"
        aria-label="Mapa anatômico frontal das áreas trabalhadas"
      >
        <circle
          cx="90"
          cy="25"
          r="18"
          fill="#202622"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="1.2"
        />
        <NeutralShape d="M81 43 L99 43 L103 62 L77 62 Z" />

        <MuscleShape
          id="front-left-shoulder"
          d="M76 63 Q55 62 43 77 Q46 91 59 99 L76 89 Z"
          active={active.has("shoulders")}
          label="Ombro esquerdo"
        />
        <MuscleShape
          id="front-right-shoulder"
          d="M104 63 Q125 62 137 77 Q134 91 121 99 L104 89 Z"
          active={active.has("shoulders")}
          label="Ombro direito"
        />

        <MuscleShape
          id="front-left-chest"
          d="M77 64 L88 65 L88 96 Q72 98 58 91 Q61 72 77 64 Z"
          active={active.has("chest")}
          label="Peito esquerdo"
        />
        <MuscleShape
          id="front-right-chest"
          d="M103 64 L92 65 L92 96 Q108 98 122 91 Q119 72 103 64 Z"
          active={active.has("chest")}
          label="Peito direito"
        />

        <MuscleShape
          id="front-left-biceps"
          d="M43 82 Q29 91 28 119 Q29 132 40 141 L50 129 L51 96 Z"
          active={active.has("biceps")}
          label="Bíceps esquerdo"
        />
        <MuscleShape
          id="front-right-biceps"
          d="M137 82 Q151 91 152 119 Q151 132 140 141 L130 129 L129 96 Z"
          active={active.has("biceps")}
          label="Bíceps direito"
        />

        <MuscleShape
          id="front-left-forearm"
          d="M28 121 Q21 151 27 179 L39 183 L42 138 Z"
          active={active.has("forearms")}
          label="Antebraço esquerdo"
        />
        <MuscleShape
          id="front-right-forearm"
          d="M152 121 Q159 151 153 179 L141 183 L138 138 Z"
          active={active.has("forearms")}
          label="Antebraço direito"
        />

        <NeutralShape d="M26 180 L39 184 L40 195 L27 195 Z" />
        <NeutralShape d="M154 180 L141 184 L140 195 L153 195 Z" />

        <MuscleShape
          id="front-core"
          d="M66 97 Q90 106 114 97 L111 171 Q101 184 90 184 Q79 184 69 171 Z"
          active={active.has("core")}
          label="Abdômen"
        />

        <MuscleShape
          id="front-left-oblique"
          d="M58 93 L69 100 L69 170 L61 184 Q52 152 58 93 Z"
          active={active.has("obliques")}
          label="Oblíquo esquerdo"
        />
        <MuscleShape
          id="front-right-oblique"
          d="M122 93 L111 100 L111 170 L119 184 Q128 152 122 93 Z"
          active={active.has("obliques")}
          label="Oblíquo direito"
        />

        <NeutralShape d="M61 184 Q90 196 119 184 L117 205 L63 205 Z" />

        <MuscleShape
          id="front-left-quad"
          d="M63 205 L88 205 L86 271 L62 271 Q56 238 63 205 Z"
          active={active.has("quads")}
          label="Quadríceps esquerdo"
        />
        <MuscleShape
          id="front-right-quad"
          d="M92 205 L117 205 Q124 238 118 271 L94 271 Z"
          active={active.has("quads")}
          label="Quadríceps direito"
        />

        <NeutralShape d="M62 272 L86 272 L82 290 L64 290 Z" />
        <NeutralShape d="M94 272 L118 272 L116 290 L98 290 Z" />

        <MuscleShape
          id="front-left-calf"
          d="M64 291 L82 291 L79 338 L59 338 Q57 314 64 291 Z"
          active={active.has("calves")}
          label="Panturrilha esquerda"
        />
        <MuscleShape
          id="front-right-calf"
          d="M98 291 L116 291 Q123 314 121 338 L101 338 Z"
          active={active.has("calves")}
          label="Panturrilha direita"
        />

        <NeutralShape d="M58 339 L79 339 L84 351 L54 351 Z" />
        <NeutralShape d="M101 339 L122 339 L126 351 L96 351 Z" />
      </svg>
    </figure>
  );
}

function BackBody({ active }: { active: Set<MuscleKey> }) {
  return (
    <figure className="flex min-w-0 flex-col items-center">
      <figcaption className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-muted">
        Costas
      </figcaption>

      <svg
        viewBox="0 0 180 360"
        className="h-[260px] w-[130px] max-w-full sm:h-[300px] sm:w-[150px]"
        role="img"
        aria-label="Mapa anatômico traseiro das áreas trabalhadas"
      >
        <circle
          cx="90"
          cy="25"
          r="18"
          fill="#202622"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="1.2"
        />
        <NeutralShape d="M81 43 L99 43 L103 62 L77 62 Z" />

        <MuscleShape
          id="back-traps"
          d="M76 62 Q90 72 104 62 L118 86 L90 103 L62 86 Z"
          active={active.has("traps")}
          label="Trapézio"
        />

        <MuscleShape
          id="back-left-shoulder"
          d="M62 67 Q44 68 33 83 Q35 97 49 103 L64 88 Z"
          active={active.has("shoulders")}
          label="Ombro esquerdo"
        />
        <MuscleShape
          id="back-right-shoulder"
          d="M118 67 Q136 68 147 83 Q145 97 131 103 L116 88 Z"
          active={active.has("shoulders")}
          label="Ombro direito"
        />

        <MuscleShape
          id="back-main"
          d="M63 87 Q90 104 117 87 L112 158 Q102 171 90 173 Q78 171 68 158 Z"
          active={active.has("back")}
          label="Costas e dorsais"
        />

        <MuscleShape
          id="back-left-triceps"
          d="M34 88 Q26 101 28 127 Q30 139 41 145 L50 130 L49 103 Z"
          active={active.has("triceps")}
          label="Tríceps esquerdo"
        />
        <MuscleShape
          id="back-right-triceps"
          d="M146 88 Q154 101 152 127 Q150 139 139 145 L130 130 L131 103 Z"
          active={active.has("triceps")}
          label="Tríceps direito"
        />

        <MuscleShape
          id="back-left-forearm"
          d="M28 128 Q21 153 27 180 L39 184 L42 142 Z"
          active={active.has("forearms")}
          label="Antebraço esquerdo"
        />
        <MuscleShape
          id="back-right-forearm"
          d="M152 128 Q159 153 153 180 L141 184 L138 142 Z"
          active={active.has("forearms")}
          label="Antebraço direito"
        />

        <NeutralShape d="M26 181 L39 185 L40 196 L27 196 Z" />
        <NeutralShape d="M154 181 L141 185 L140 196 L153 196 Z" />

        <MuscleShape
          id="back-lower-back"
          d="M69 158 L111 158 L114 191 Q90 201 66 191 Z"
          active={active.has("lower_back")}
          label="Lombar"
        />

        <MuscleShape
          id="back-left-glute"
          d="M64 192 Q77 182 89 196 L87 224 Q71 231 61 216 Z"
          active={active.has("glutes")}
          label="Glúteo esquerdo"
        />
        <MuscleShape
          id="back-right-glute"
          d="M91 196 Q103 182 116 192 L119 216 Q109 231 93 224 Z"
          active={active.has("glutes")}
          label="Glúteo direito"
        />

        <MuscleShape
          id="back-left-hamstring"
          d="M62 222 L87 225 L84 278 L62 278 Q57 247 62 222 Z"
          active={active.has("hamstrings")}
          label="Posterior esquerdo"
        />
        <MuscleShape
          id="back-right-hamstring"
          d="M93 225 L118 222 Q123 247 118 278 L96 278 Z"
          active={active.has("hamstrings")}
          label="Posterior direito"
        />

        <NeutralShape d="M62 279 L84 280 L81 292 L63 292 Z" />
        <NeutralShape d="M96 280 L118 279 L117 292 L99 292 Z" />

        <MuscleShape
          id="back-left-calf"
          d="M63 293 L81 293 L78 338 L59 338 Q57 316 63 293 Z"
          active={active.has("calves")}
          label="Panturrilha esquerda"
        />
        <MuscleShape
          id="back-right-calf"
          d="M99 293 L117 293 Q123 316 121 338 L102 338 Z"
          active={active.has("calves")}
          label="Panturrilha direita"
        />

        <NeutralShape d="M58 339 L79 339 L84 351 L54 351 Z" />
        <NeutralShape d="M101 339 L122 339 L126 351 L96 351 Z" />
      </svg>
    </figure>
  );
}

export function BodyMuscleMap({
  muscles = [],
  workoutTitle = "",
  compact = false,
}: BodyMuscleMapProps) {
  const safeMuscles = Array.isArray(muscles)
    ? muscles.filter((muscle): muscle is string => typeof muscle === "string")
    : [];

  const active = detectMuscles(safeMuscles, workoutTitle);
  const activeMuscles = ALL_MUSCLES.filter((muscle) => active.has(muscle));

  return (
    <section aria-label="Áreas musculares trabalhadas">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-acid">
            Áreas trabalhadas
          </p>
          <p className="mt-1 text-xs text-muted">
            Regiões ativadas durante este treino
          </p>
        </div>

        {activeMuscles.length > 0 && (
          <span className="rounded-full border border-acid/20 bg-acid/[.08] px-3 py-1 text-xs font-semibold text-acid">
            {activeMuscles.length}{" "}
            {activeMuscles.length === 1 ? "região" : "regiões"}
          </span>
        )}
      </div>

      <div
        className={`mt-4 overflow-hidden rounded-2xl border border-white/[.08] bg-[radial-gradient(circle_at_center,rgba(156,255,26,.05),transparent_58%),rgba(0,0,0,.22)] ${
          compact ? "p-2 sm:p-3" : "p-3 sm:p-5"
        }`}
      >
        <div className="grid grid-cols-2 items-end justify-items-center gap-1 sm:gap-4">
          <FrontBody active={active} />
          <BackBody active={active} />
        </div>
      </div>

      {activeMuscles.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeMuscles.map((muscle) => (
            <span
              key={muscle}
              className="rounded-full border border-acid/25 bg-acid/[.08] px-3 py-1.5 text-xs font-semibold text-acid"
            >
              {MUSCLE_LABELS[muscle]}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-white/[.08] bg-white/[.03] p-3 text-sm text-muted">
          Não foi possível identificar com precisão as áreas trabalhadas.
        </p>
      )}
    </section>
  );
}
