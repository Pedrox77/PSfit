"use client";

import {
  createPost,
  type CreatePostState,
} from "@/app/community/actions";
import { MusicPicker } from "@/components/music/music-picker";
import { BodyMuscleMap } from "@/components/training/body-muscle-map";
import {
  POST_TYPE_OPTIONS,
  POST_VISIBILITY_OPTIONS,
  TRAINING_VISUAL_STYLE_OPTIONS,
} from "@/lib/community/post-options";
import type { PostType, WorkoutReceipt } from "@/types/database";
import { Clock3, Layers3, Weight } from "lucide-react";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MediaUploader } from "./media-uploader";
import { UserTagPicker } from "./user-tag-picker";

const initialState: CreatePostState = { ok: false };

const workoutTitleLabels: Record<string, string> = {
  upper_a: "Superiores A",
  upper_b: "Superiores B",
  upper_body_a: "Superiores A",
  upper_body_b: "Superiores B",
  lower_a: "Inferiores A",
  lower_b: "Inferiores B",
  lower_body_a: "Inferiores A",
  lower_body_b: "Inferiores B",
  full_body: "Corpo inteiro",
  full_body_a: "Corpo inteiro A",
  full_body_b: "Corpo inteiro B",
};

const rawWorkoutTitles: Record<string, string> = {
  "upper body a": "Superiores A",
  "upper body b": "Superiores B",
  "lower body a": "Inferiores A",
  "lower body b": "Inferiores B",
  "full body": "Corpo inteiro",
  "full body a": "Corpo inteiro A",
  "full body b": "Corpo inteiro B",
};

const postTypeLabels: Record<string, string> = {
  daily_life: "Dia a dia",
  workout: "Treino",
  training: "Treino",
  progress: "Progresso",
  meal: "Alimentação",
  nutrition: "Alimentação",
  recovery: "Recuperação",
  achievement: "Conquista",
};

const visibilityLabels: Record<string, string> = {
  public: "Público",
  followers: "Seguidores",
  private: "Somente eu",
  close_friends: "Amigos próximos",
};

const trainingVisualLabels: Record<string, string> = {
  full_carousel: "Carrossel completo",
  compact_card: "Card compacto",
  compact: "Card compacto",
  receipt: "Resumo do treino",
  stats: "Estatísticas",
  minimal: "Minimalista",
};

type ReceiptExerciseLike = {
  sets?: number | string | null;
  repetitions?: number | string | null;
  load?: number | string | null;
  weight_kg?: number | string | null;
  suggested_weight_kg?: number | string | null;
  rest_seconds?: number | string | null;
};

type WorkoutReceiptDetails = Omit<WorkoutReceipt, "exercises"> & {
  name_key?: string | null;
  trained_areas?: string[] | null;
  muscles?: string[] | null;
  session_id?: string | null;
  exercises?: ReceiptExerciseLike[] | null;
};

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function workoutTitle(receipt: WorkoutReceiptDetails) {
  const nameKey = normalize(receipt.name_key).replaceAll(" ", "_");
  const rawTitle = normalize(receipt.title);

  return (
    workoutTitleLabels[nameKey] ??
    rawWorkoutTitles[rawTitle] ??
    receipt.title ??
    "Treino concluído"
  );
}

function toPositiveNumber(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value ?? "").replace(",", "."));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function getReceiptExercises(receipt: WorkoutReceiptDetails) {
  const exercises = receipt.exercises;

  return Array.isArray(exercises) ? exercises : [];
}

function getCompletedSets(receipt: WorkoutReceiptDetails) {
  const recorded = toPositiveNumber(receipt.sets_completed);
  if (recorded > 0) return Math.round(recorded);

  return getReceiptExercises(receipt).reduce(
    (total, exercise) => total + Math.round(toPositiveNumber(exercise.sets)),
    0,
  );
}

function getTotalVolume(receipt: WorkoutReceiptDetails) {
  const recorded = toPositiveNumber(receipt.total_volume_kg);
  if (recorded > 0) return recorded;

  return getReceiptExercises(receipt).reduce((total, exercise) => {
    const sets = toPositiveNumber(exercise.sets);
    const repetitions = toPositiveNumber(exercise.repetitions);
    const load =
      toPositiveNumber(exercise.weight_kg) ||
      toPositiveNumber(exercise.suggested_weight_kg) ||
      toPositiveNumber(exercise.load);

    if (!sets || !repetitions || !load) return total;
    return total + sets * repetitions * load;
  }, 0);
}

function getDurationMinutes(receipt: WorkoutReceiptDetails) {
  const recorded = toPositiveNumber(receipt.duration_minutes);

  // Um minuto geralmente representa um valor incompleto no registro.
  if (recorded > 1) return Math.round(recorded);

  const exercises = getReceiptExercises(receipt);
  if (!exercises.length) return 0;

  const estimatedSeconds = exercises.reduce((total, exercise) => {
    const sets = Math.max(1, Math.round(toPositiveNumber(exercise.sets)));
    const restSeconds = toPositiveNumber(exercise.rest_seconds) || 60;
    const activeSecondsPerSet = 45;

    return total + sets * (activeSecondsPerSet + restSeconds) + 60;
  }, 0);

  return Math.max(10, Math.ceil(estimatedSeconds / 300) * 5);
}

function getMuscles(receipt: WorkoutReceiptDetails): string[] {
  const trainedAreas = Array.isArray(receipt.trained_areas)
    ? receipt.trained_areas
    : [];
  const muscles = Array.isArray(receipt.muscles) ? receipt.muscles : [];

  return [
    ...new Set(
      [...trainedAreas, ...muscles].filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      ),
    ),
  ];
}

export function PostComposer({
  initialType = "daily_life",
  workoutSessionId,
  workoutReceipt,
}: {
  initialType?: PostType;
  workoutSessionId?: string;
  workoutReceipt?: WorkoutReceipt | null;
}) {
  const [state, formAction, isPending] = useActionState(
    createPost,
    initialState,
  );
  const [caption, setCaption] = useState("");
  const [offline, setOffline] = useState(false);
  const [sensitive, setSensitive] = useState(false);
  const receipt = workoutReceipt as WorkoutReceiptDetails | null | undefined;

  const receiptMetrics = useMemo(() => {
    if (!receipt) return null;

    return {
      duration: getDurationMinutes(receipt),
      sets: getCompletedSets(receipt),
      volume: getTotalVolume(receipt),
      muscles: getMuscles(receipt),
      title: workoutTitle(receipt),
    };
  }, [receipt]);

  useEffect(() => {
    const saved = localStorage.getItem("psfit-community-draft");
    if (saved) setCaption(saved);

    const update = () => setOffline(!navigator.onLine);
    update();

    addEventListener("online", update);
    addEventListener("offline", update);

    return () => {
      removeEventListener("online", update);
      removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("psfit-community-draft", caption);
    }, 400);

    return () => clearTimeout(timer);
  }, [caption]);

  return (
    <form action={formAction} className="space-y-6 p-5 sm:p-7">
      {workoutSessionId && (
        <input
          type="hidden"
          name="workout_session_id"
          value={workoutSessionId}
        />
      )}

      {offline && (
        <p
          role="status"
          className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-3 text-sm text-yellow-200"
        >
          Você está sem conexão. Seu rascunho está salvo neste dispositivo.
        </p>
      )}

      <fieldset>
        <legend className="mb-3 text-sm font-semibold">
          Tipo de publicação
        </legend>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {POST_TYPE_OPTIONS.map(({ value, label }) => (
            <label key={value} className="shrink-0">
              <input
                required
                defaultChecked={value === initialType}
                className="peer sr-only"
                type="radio"
                name="post_type"
                value={value}
              />

              <span className="block rounded-full border border-white/10 px-4 py-2 text-sm text-muted transition peer-checked:border-acid peer-checked:bg-acid/[.08] peer-checked:text-acid">
                {postTypeLabels[value] ?? label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <MediaUploader />

      <label className="block">
        <span className="text-sm font-semibold">Legenda</span>

        <textarea
          name="caption"
          maxLength={2200}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          rows={6}
          className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-[#101512] p-4 outline-none transition placeholder:text-muted/70 focus:border-acid/50 focus:ring-2 focus:ring-acid/10"
          placeholder="Compartilhe como foi seu dia ou seu treino..."
        />

        <span className="mt-1 block text-right text-xs text-muted">
          {caption.length}/2.200
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Título do treino
          <input
            name="workout_title"
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] px-4 py-3 outline-none transition focus:border-acid/50 focus:ring-2 focus:ring-acid/10"
            placeholder="Ex.: Superiores B"
          />
        </label>

        <label className="text-sm">
          Localização
          <span className="ml-1 text-muted">(opcional)</span>
          <input
            name="location"
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] px-4 py-3 outline-none transition focus:border-acid/50 focus:ring-2 focus:ring-acid/10"
            placeholder="Ex.: Academia"
          />
        </label>
      </div>

      <TrainingVisualOptions />

      {workoutSessionId &&
        (receipt && receiptMetrics ? (
          <section className="overflow-hidden rounded-3xl border border-acid/25 bg-[radial-gradient(circle_at_top_right,rgba(168,255,42,.10),transparent_40%),#09100b] p-5 shadow-[0_20px_55px_rgba(0,0,0,.28)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-acid">
                  Treino concluído
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  {receiptMetrics.title}
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Seu desempenho foi anexado à publicação.
                </p>
              </div>

              <span className="rounded-full border border-acid/20 bg-acid/[.08] px-3 py-1 text-xs font-semibold text-acid">
                Sessão verificada
              </span>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <ReceiptMetric
                icon={<Clock3 size={17} />}
                label="Duração"
                value={
                  receiptMetrics.duration > 0
                    ? `${receiptMetrics.duration} min`
                    : "Não informada"
                }
              />

              <ReceiptMetric
                icon={<Layers3 size={17} />}
                label="Séries"
                value={
                  receiptMetrics.sets > 0
                    ? `${receiptMetrics.sets}`
                    : "Não informadas"
                }
              />

              <ReceiptMetric
                icon={<Weight size={17} />}
                label="Volume"
                value={
                  receiptMetrics.volume > 0
                    ? `${new Intl.NumberFormat("pt-BR", {
                        maximumFractionDigits: 0,
                      }).format(receiptMetrics.volume)} kg`
                    : "Carga não informada"
                }
              />
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <BodyMuscleMap
                muscles={receiptMetrics.muscles}
                workoutTitle={receiptMetrics.title}
              />
            </div>

            {receipt.session_id && (
              <Link
                href={`/workouts/session/${receipt.session_id}`}
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-acid px-5 text-sm font-bold text-ink transition hover:brightness-110 sm:w-auto"
              >
                Ver treino
              </Link>
            )}
          </section>
        ) : (
          <p
            role="alert"
            className="rounded-xl border border-red-400/20 bg-red-400/[.05] p-3 text-sm text-red-300"
          >
            Não foi possível anexar o treino concluído. Volte ao resumo do
            treino e tente novamente.
          </p>
        ))}

      <UserTagPicker />

      <div>
        <p className="mb-2 text-sm font-semibold">Música</p>
        <MusicPicker />
      </div>

      <label className="block text-sm">
        Visibilidade
        <select
          name="visibility"
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] px-4 py-3 outline-none transition focus:border-acid/50 focus:ring-2 focus:ring-acid/10"
        >
          {POST_VISIBILITY_OPTIONS.map(({ value, label }) => (
            <option value={value} key={value}>
              {visibilityLabels[value] ?? label}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-3 text-sm">
        <Check
          name="allow_comments"
          label="Permitir comentários"
          initial
        />

        <Check
          name="hide_like_count"
          label="Ocultar número de curtidas"
        />

        <Check
          name="sensitive_content"
          label="Marcar como conteúdo sensível"
          onChange={setSensitive}
        />

        {sensitive && (
          <p className="rounded-xl bg-white/[.04] p-3 text-xs text-muted">
            Fotos de progresso podem ser pessoais. Confirme que você se sente
            confortável em compartilhar essa mídia com o público selecionado.
          </p>
        )}
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300"
        >
          {state.error}
        </p>
      )}

      <button
        disabled={offline || isPending}
        className="w-full rounded-full bg-acid py-3 font-bold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Publicando..." : "Publicar na comunidade"}
      </button>

      <p className="text-center text-xs text-muted">
        Compartilhe com respeito e ajude outros atletas a evoluir.
      </p>
    </form>
  );
}

function Check({
  name,
  label,
  initial,
  onChange,
}: {
  name: string;
  label: string;
  initial?: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-white/[.06] bg-white/[.025] px-4 py-3">
      <span>{label}</span>

      <input
        name={name}
        type="checkbox"
        defaultChecked={initial}
        onChange={(event) => onChange?.(event.target.checked)}
        className="h-4 w-4 shrink-0 accent-[#a8ff2a]"
      />
    </label>
  );
}

function ReceiptMetric({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-acid/[.08] text-acid">
        {icon}
      </span>

      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[#edf4ef]">
          {value}
        </span>
        <span className="mt-0.5 block text-[11px] text-muted">
          {label}
        </span>
      </span>
    </div>
  );
}

function TrainingVisualOptions() {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">
        Visual do treino
      </legend>

      <p className="mb-3 text-xs text-muted">
        Escolha como o treino aparecerá quando esta publicação estiver
        vinculada a uma sessão concluída.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {TRAINING_VISUAL_STYLE_OPTIONS.map(({ value, label }) => (
          <label
            key={value}
            className="rounded-xl border border-white/10 p-3 text-xs transition has-[:checked]:border-acid has-[:checked]:bg-acid/[.06] has-[:checked]:text-acid"
          >
            <input
              type="radio"
              name="training_visual_style"
              value={value}
              defaultChecked={value === "full_carousel"}
              className="mr-2 accent-[#a8ff2a]"
            />
            {trainingVisualLabels[value] ?? label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
