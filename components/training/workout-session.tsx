"use client";

import type {
  ExerciseCatalogRow,
  ExerciseRow,
  WorkoutSessionRow,
  WorkoutSetLogRow,
} from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { calculateStreak } from "@/lib/training/streak";
import {
  normalizeMuscles,
  type MuscleGroup,
} from "@/lib/training/muscle-normalizer";
import { ExerciseMedia } from "./exercise-media";
import { WorkoutMuscleMap } from "./workout-muscle-map";
import {
  decideLoadProgression,
  processLoadProgressions,
  revertLoadProgression,
  type LoadProgressionSuggestion,
} from "@/app/workouts/session/load-progression-actions";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Pause,
  Play,
  Share2,
  SkipForward,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

type SetValue = {
  weight: string;
  repetitions: string;
  duration: string;
  done: boolean;
};

type ReceiptState = {
  duration: number;
  volume: number;
  sets: number;
  streak: number;
};

export function WorkoutSession({
  session,
  workoutName,
  exercises,
  logs,
  previousLogs,
  catalog,
  detailedMuscleMap,
  initialProgressions = [],
}: {
  session: WorkoutSessionRow;
  workoutName: string;
  exercises: ExerciseRow[];
  logs: WorkoutSetLogRow[];
  previousLogs: WorkoutSetLogRow[];
  catalog: ExerciseCatalogRow[];
  detailedMuscleMap: boolean;
  initialProgressions?: LoadProgressionSuggestion[];
}) {
  const t = useTranslations("WorkoutSession");

  const [index, setIndex] = useState(0);
  const [rest, setRest] = useState(0);
  const [paused, setPaused] = useState(false);
  const [saving, setSaving] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState(session.status === "completed");
  const [effort, setEffort] = useState(session.perceived_effort ?? 7);
  const [exerciseList, setExerciseList] = useState<ExerciseRow[]>(exercises);
  const [swapOpen, setSwapOpen] = useState(false);
  const [error, setError] = useState("");
  const [progressions, setProgressions] =
    useState<LoadProgressionSuggestion[]>(initialProgressions);

  const [receipt, setReceipt] = useState<ReceiptState>({
    duration: Number(session.duration_minutes ?? 0),
    volume: Number(session.total_volume_kg ?? 0),
    sets: Number(session.sets_completed ?? 0),
    streak: 0,
  });

  const exercise = exerciseList[index];
  const activeProgression = progressions.find(
    (item) => item.exerciseId === exercise?.id && item.status === "applied",
  );

  const catalogItem = catalog.find(
    (item) => item.id === exercise?.catalog_exercise_id,
  );

  const instructions = Array.isArray(catalogItem?.instructions)
    ? catalogItem.instructions.filter(
        (item): item is string => typeof item === "string",
      )
    : [];

  const safetyNotes = Array.isArray(catalogItem?.safety_notes)
    ? catalogItem.safety_notes.filter(
        (item): item is string => typeof item === "string",
      )
    : [];

  const initialValues = useMemo(() => {
    return Object.fromEntries(
      exercises.map((item) => {
        const numberOfSets = Math.max(1, item.sets ?? 3);

        const setValues = Array.from(
          { length: numberOfSets },
          (_, setIndex) => {
            const existingLog = logs.find(
              (log) =>
                log.exercise_id === item.id && log.set_number === setIndex + 1,
            );

            return {
              weight:
                existingLog?.weight_kg?.toString() ??
                item.suggested_weight_kg?.toString() ??
                "",
              repetitions: existingLog?.repetitions?.toString() ?? "",
              duration: existingLog?.duration_seconds?.toString() ?? "",
              done: existingLog?.completed ?? false,
            } satisfies SetValue;
          },
        );

        return [item.id, setValues];
      }),
    ) as Record<string, SetValue[]>;
  }, [exercises, logs]);

  const [values, setValues] =
    useState<Record<string, SetValue[]>>(initialValues);

  const muscleSummary = useMemo(() => {
    const primarySets = new Map<MuscleGroup, number>();
    const secondarySets = new Map<MuscleGroup, number>();

    for (const item of exerciseList) {
      const completedSetCount = (values[item.id] ?? []).filter(
        (set) => set.done,
      ).length;
      if (!completedSetCount) continue;

      const fallbackCatalog = catalog.find(
        (catalogExercise) => catalogExercise.id === item.catalog_exercise_id,
      );
      const primarySource = item.primary_muscles?.length
        ? item.primary_muscles
        : item.muscle_group
          ? [item.muscle_group]
          : fallbackCatalog?.primary_muscle
            ? [fallbackCatalog.primary_muscle]
            : [];
      const secondarySource = item.secondary_muscles?.length
        ? item.secondary_muscles
        : (fallbackCatalog?.secondary_muscles ?? []);

      for (const muscle of normalizeMuscles(primarySource)) {
        primarySets.set(
          muscle,
          (primarySets.get(muscle) ?? 0) + completedSetCount,
        );
      }
      for (const muscle of normalizeMuscles(secondarySource)) {
        secondarySets.set(
          muscle,
          (secondarySets.get(muscle) ?? 0) + completedSetCount,
        );
      }
    }

    for (const muscle of primarySets.keys()) {
      secondarySets.delete(muscle);
    }

    return {
      primary: [...primarySets.keys()],
      secondary: [...secondarySets.keys()],
      sets: Object.fromEntries([
        ...primarySets.entries(),
        ...secondarySets.entries(),
      ]),
    };
  }, [catalog, exerciseList, values]);

  useEffect(() => {
    if (rest <= 0 || paused) {
      return;
    }

    const timer = window.setInterval(() => {
      setRest((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [rest, paused]);

  if (!exercise) {
    return (
      <main className="grid min-h-screen place-items-center bg-ink px-5 text-center">
        <div>
          <h1 className="text-xl font-semibold">{t("emptyTitle")}</h1>

          <p className="mt-2 text-sm text-muted">{t("emptyDescription")}</p>

          <Link
            href="/training"
            className="mt-5 inline-flex rounded-full bg-acid px-5 py-3 font-bold text-ink"
          >
            {t("backToTraining")}
          </Link>
        </div>
      </main>
    );
  }

  const sets = values[exercise.id] ?? [];

  const previous = previousLogs.find((log) => log.exercise_id === exercise.id);

  function updateSetLocally(setIndex: number, next: SetValue) {
    setValues((current) => ({
      ...current,
      [exercise.id]: (current[exercise.id] ?? []).map((setItem, indexItem) =>
        indexItem === setIndex ? next : setItem,
      ),
    }));
  }

  async function saveSet(setIndex: number, next: SetValue) {
    const savingKey = `${exercise.id}-${setIndex}`;

    setSaving(savingKey);
    setError("");
    updateSetLocally(setIndex, next);

    const supabase = createClient();

    const { error: saveError } = await supabase.from("workout_set_logs").upsert(
      {
        user_id: session.user_id,
        session_id: session.id,
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        set_number: setIndex + 1,
        weight_kg: next.weight ? Number(next.weight) : null,
        repetitions: next.repetitions ? Number(next.repetitions) : null,
        duration_seconds: next.duration ? Number(next.duration) : null,
        completed: next.done,
      },
      {
        onConflict: "session_id,exercise_id,set_number",
      },
    );

    if (saveError) {
      console.error("[PSFIT SET SAVE ERROR]", {
        message: saveError.message,
        code: saveError.code,
        details: saveError.details,
        hint: saveError.hint,
      });

      setError(saveError.message);
    } else if (next.done) {
      setPaused(false);
      setRest(exercise.rest_seconds ?? 60);
    }

    setSaving("");
  }

  async function addSessionNote(kind: "desconforto" | "observação") {
    const note = window.prompt(
      kind === "desconforto" ? t("describeDiscomfort") : t("observationPrompt"),
    );

    if (!note?.trim()) {
      return;
    }

    const supabase = createClient();

    const currentNotes = session.notes?.trim();

    const { error: noteError } = await supabase
      .from("workout_sessions")
      .update({
        notes: [currentNotes, `${kind}: ${note.trim()}`]
          .filter(Boolean)
          .join("\n"),
      })
      .eq("id", session.id);

    if (noteError) {
      console.error("[PSFIT SESSION NOTE ERROR]", {
        message: noteError.message,
        code: noteError.code,
        details: noteError.details,
        hint: noteError.hint,
      });

      setError(noteError.message);
      return;
    }

    if (kind === "desconforto") {
      setPaused(true);
    }
  }

  async function swapExercise(catalogId: string) {
    const replacement = catalog.find((item) => item.id === catalogId);

    if (!replacement) {
      return;
    }

    const changes: Partial<ExerciseRow> = {
      catalog_exercise_id: replacement.id,
      name: replacement.name,
      muscle_group: replacement.primary_muscle,
      primary_muscles: [replacement.primary_muscle],
      secondary_muscles: replacement.secondary_muscles,
      equipment: replacement.equipment,
      video_url: replacement.video_url,
      video_thumbnail_url: replacement.thumbnail_url,
    };

    const supabase = createClient();

    const { error: swapError } = await supabase
      .from("exercises")
      .update(changes)
      .eq("id", exercise.id);

    if (swapError) {
      console.error("[PSFIT EXERCISE SWAP ERROR]", {
        message: swapError.message,
        code: swapError.code,
        details: swapError.details,
        hint: swapError.hint,
      });

      setError(swapError.message);
      return;
    }

    setExerciseList((items) =>
      items.map((item) =>
        item.id === exercise.id
          ? {
              ...item,
              ...changes,
            }
          : item,
      ),
    );

    setSwapOpen(false);
  }

  async function finishWorkout() {
    setFinishing(true);
    setError("");

    const completedSets = Object.values(values)
      .flat()
      .filter((item) => item.done);

    const volume = completedSets.reduce(
      (total, item) =>
        total + (Number(item.weight) || 0) * (Number(item.repetitions) || 0),
      0,
    );

    const startedAt = session.started_at
      ? Date.parse(session.started_at)
      : Date.now();

    const duration = Math.max(1, Math.round((Date.now() - startedAt) / 60000));

    const exercisesCompleted = Object.values(values).filter((exerciseSets) =>
      exerciseSets.some((item) => item.done),
    ).length;

    const supabase = createClient();

    const { error: finishError } = await supabase
      .from("workout_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_minutes: duration,
        total_volume_kg: volume,
        perceived_effort: effort,
        sets_completed: completedSets.length,
        exercises_completed: exercisesCompleted,
      })
      .eq("id", session.id);

    if (finishError) {
      console.error("[PSFIT FINISH WORKOUT ERROR]", {
        message: finishError.message,
        code: finishError.code,
        details: finishError.details,
        hint: finishError.hint,
      });

      setError(finishError.message);
      setFinishing(false);
      return;
    }

    const streakResult = await supabase
      .from("workout_sessions")
      .select("scheduled_date")
      .eq("user_id", session.user_id)
      .eq("status", "completed");

    if (streakResult.error) {
      console.error("[PSFIT STREAK ERROR]", {
        message: streakResult.error.message,
        code: streakResult.error.code,
        details: streakResult.error.details,
        hint: streakResult.error.hint,
      });
    }

    const currentStreak = calculateStreak(
      (streakResult.data ?? []).map((item) => item.scheduled_date),
    ).current;

    setReceipt({
      duration,
      volume,
      sets: completedSets.length,
      streak: currentStreak,
    });
    try {
      setProgressions(await processLoadProgressions(session.id));
    } catch (progressionError) {
      console.error("[PSFIT LOAD PROGRESSION]", progressionError);
    }

    setFinished(true);
    setFinishing(false);
  }

  if (finished) {
    return (
      <main className="grid min-h-screen place-items-center bg-ink p-5">
        <section className="card w-full max-w-xl p-6 text-center sm:p-8">
          <p className="eyebrow">{t("completed")}</p>

          <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">
            {receipt.streak > 1
              ? t("streakMaintained", {
                  days: receipt.streak,
                })
              : t("newStreak")}
          </h1>

          <p className="mt-3 text-muted">
            {t("savedSuccessfully", {
              workout: workoutName,
            })}
          </p>

          <WorkoutMuscleMap
            primaryMuscles={muscleSummary.primary}
            secondaryMuscles={detailedMuscleMap ? muscleSummary.secondary : []}
            muscleSets={detailedMuscleMap ? muscleSummary.sets : {}}
          />

          {progressions.length > 0 && (
            <section className="mt-6 space-y-3 text-left">
              <p className="eyebrow">Progressão de carga</p>
              {progressions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-acid/20 bg-acid/[.05] p-4"
                >
                  <p className="font-semibold">{item.exerciseName}</p>
                  <p className="mt-1 text-sm text-muted">
                    Você concluiu todas as séries. Próxima carga sugerida:{" "}
                    {item.previousWeight} kg → {item.suggestedWeight} kg.
                  </p>
                  {item.status === "applied" ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="text-sm text-acid">
                        Nova carga aplicada para o próximo treino.
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          await revertLoadProgression(item.id);
                          setProgressions((current) =>
                            current.map((value) =>
                              value.id === item.id
                                ? { ...value, status: "reverted" }
                                : value,
                            ),
                          );
                        }}
                        className="text-sm text-aqua"
                      >
                        Desfazer
                      </button>
                    </div>
                  ) : item.status === "suggested" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await decideLoadProgression(item.id, true);
                          setProgressions((current) =>
                            current.map((value) =>
                              value.id === item.id
                                ? { ...value, status: "applied" }
                                : value,
                            ),
                          );
                        }}
                        className="rounded-full bg-acid px-4 py-2 text-sm font-bold text-ink"
                      >
                        Aplicar nova carga
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await decideLoadProgression(item.id, false);
                          setProgressions((current) =>
                            current.map((value) =>
                              value.id === item.id
                                ? { ...value, status: "rejected" }
                                : value,
                            ),
                          );
                        }}
                        className="rounded-full border border-white/15 px-4 py-2 text-sm"
                      >
                        Manter carga atual
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </section>
          )}

          <div className="mt-6 grid grid-cols-3 gap-2">
            <ReceiptMetric
              label={t("duration")}
              value={`${receipt.duration} min`}
            />

            <ReceiptMetric
              label={t("volume")}
              value={`${receipt.volume.toFixed(0)} kg`}
            />

            <ReceiptMetric label={t("sets")} value={String(receipt.sets)} />
          </div>

          <Link
            href={`/community/create?type=workout&session=${session.id}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-acid px-5 py-3 font-bold text-ink"
          >
            <Share2 size={18} />
            {t("shareCommunity")}
          </Link>
        </section>
      </main>
    );
  }

  const progress = ((index + 1) / exerciseList.length) * 100;

  return (
    <main className="min-h-screen bg-ink px-4 py-5 sm:px-5">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link
          href="/workouts/today"
          className="text-sm text-muted transition hover:text-white"
        >
          {t("exit")}
        </Link>

        <span className="text-sm font-medium">
          {t("progressCount", {
            current: index + 1,
            total: exerciseList.length,
          })}
        </span>

        <span className="text-sm text-muted">{Math.round(progress)}%</span>
      </header>

      <div className="mx-auto mt-4 h-1 max-w-6xl overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-acid transition-all duration-300"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <div className="mx-auto mt-7 grid max-w-6xl gap-6 lg:grid-cols-[1fr_.9fr]">
        <ExerciseMedia exercise={exercise} catalog={catalogItem} />

        <section>
          <p className="eyebrow">{exercise.muscle_group || workoutName}</p>

          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            {exercise.name}
          </h1>

          <p className="mt-2 text-sm text-muted sm:text-base">
            {t("exerciseSummary", {
              sets: exercise.sets ?? sets.length,
              repetitions: exercise.repetitions ?? t("free"),
              seconds: exercise.rest_seconds ?? 60,
            })}
          </p>

          {exercise.load_guidance && (
            <p className="mt-3">{exercise.load_guidance}</p>
          )}
          {activeProgression && (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-acid/20 bg-acid/[.05] px-3 py-2 text-sm">
              <span className="text-acid">
                Progressão aplicada: +
                {(
                  activeProgression.suggestedWeight -
                  activeProgression.previousWeight
                ).toFixed(1)}{" "}
                kg
              </span>
              <button
                type="button"
                className="text-aqua"
                onClick={async () => {
                  await revertLoadProgression(activeProgression.id);
                  setProgressions((current) =>
                    current.map((value) =>
                      value.id === activeProgression.id
                        ? { ...value, status: "reverted" }
                        : value,
                    ),
                  );
                }}
              >
                Usar carga anterior
              </button>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-white/[0.04] p-3">
              <p className="text-xs text-muted">{t("previousLoad")}</p>

              <p className="mt-1 font-semibold">
                {previous?.weight_kg != null
                  ? `${previous.weight_kg} kg × ${previous.repetitions ?? "—"}`
                  : t("noPreviousRecord")}
              </p>
            </div>

            <div className="rounded-xl bg-white/[0.04] p-3">
              <p className="text-xs text-muted">{t("suggestedLoad")}</p>

              <p className="mt-1 font-semibold">
                {exercise.suggested_weight_kg != null
                  ? `${exercise.suggested_weight_kg} kg`
                  : exercise.load_guidance || t("notProvided")}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSwapOpen((value) => !value)}
              className="rounded-full border border-white/10 px-3 py-2 text-sm transition hover:border-acid/40"
            >
              {t("swapExercise")}
            </button>

            <button
              type="button"
              onClick={() => addSessionNote("desconforto")}
              className="rounded-full border border-white/10 px-3 py-2 text-sm transition hover:border-acid/40"
            >
              {t("reportDiscomfort")}
            </button>

            <button
              type="button"
              onClick={() => addSessionNote("observação")}
              className="rounded-full border border-white/10 px-3 py-2 text-sm transition hover:border-acid/40"
            >
              {t("addObservation")}
            </button>
          </div>

          {swapOpen && (
            <select
              defaultValue=""
              onChange={(event) => swapExercise(event.target.value)}
              className="field mt-3 w-full"
            >
              <option value="" disabled>
                {t("selectReplacement")}
              </option>

              {catalog.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} · {item.primary_muscle}
                </option>
              ))}
            </select>
          )}

          {instructions.length > 0 && (
            <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="text-sm font-semibold">{t("howToExecute")}</p>

              <ol className="mt-2 space-y-1 text-sm text-muted">
                {instructions.map((instruction, instructionIndex) => (
                  <li key={`${instruction}-${instructionIndex}`}>
                    {instructionIndex + 1}. {instruction}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {safetyNotes.length > 0 && (
            <div className="mt-3 rounded-xl border border-warning/20 bg-warning/[0.04] p-4">
              <p className="text-sm font-semibold text-warning">
                {t("safety")}
              </p>

              <ul className="mt-2 space-y-1 text-sm text-muted">
                {safetyNotes.map((note, noteIndex) => (
                  <li key={`${note}-${noteIndex}`}>• {note}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <div className="hidden grid-cols-[36px_1fr_1fr_1fr_48px] gap-3 px-3 text-xs font-medium uppercase tracking-wider text-muted sm:grid">
              <span>{t("set")}</span>
              <span>{t("weight")}</span>
              <span>{t("repetitions")}</span>
              <span>{t("setDuration")}</span>
              <span className="text-center">{t("done")}</span>
            </div>

            {sets.map((setItem, setIndex) => {
              const savingKey = `${exercise.id}-${setIndex}`;
              const isSaving = saving === savingKey;

              return (
                <div
                  key={setIndex}
                  className={`rounded-2xl border p-3 transition ${
                    setItem.done
                      ? "border-acid/40 bg-acid/[0.06]"
                      : "border-white/10 bg-white/[0.02]"
                  }`}
                >
                  <div className="grid grid-cols-[36px_1fr_1fr_48px] items-end gap-2 sm:grid-cols-[36px_1fr_1fr_1fr_48px] sm:gap-3">
                    <div className="flex h-11 items-center justify-center rounded-xl bg-white/[0.04] font-semibold">
                      {setIndex + 1}
                    </div>

                    <label className="min-w-0">
                      <span className="mb-1 block text-[11px] text-muted sm:hidden">
                        {t("weight")}
                      </span>

                      <div className="flex h-11 items-center rounded-xl border border-white/10 bg-black/20 px-3 focus-within:border-acid/50">
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.5"
                          aria-label={t("weightAria", {
                            set: setIndex + 1,
                          })}
                          placeholder="0"
                          value={setItem.weight}
                          onChange={(event) =>
                            saveSet(setIndex, {
                              ...setItem,
                              weight: event.target.value,
                            })
                          }
                          className="min-w-0 flex-1 bg-transparent outline-none"
                        />

                        <span className="ml-1 text-xs text-muted">kg</span>
                      </div>
                    </label>

                    <label className="min-w-0">
                      <span className="mb-1 block text-[11px] text-muted sm:hidden">
                        {t("repetitions")}
                      </span>

                      <div className="flex h-11 items-center rounded-xl border border-white/10 bg-black/20 px-3 focus-within:border-acid/50">
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          step="1"
                          aria-label={t("repetitionsAria", {
                            set: setIndex + 1,
                          })}
                          placeholder="0"
                          value={setItem.repetitions}
                          onChange={(event) =>
                            saveSet(setIndex, {
                              ...setItem,
                              repetitions: event.target.value,
                            })
                          }
                          className="min-w-0 flex-1 bg-transparent outline-none"
                        />

                        <span className="ml-1 text-xs text-muted">reps</span>
                      </div>
                    </label>

                    <label className="hidden min-w-0 sm:block">
                      <div className="flex h-11 items-center rounded-xl border border-white/10 bg-black/20 px-3 focus-within:border-acid/50">
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          step="1"
                          aria-label={t("durationAria", {
                            set: setIndex + 1,
                          })}
                          placeholder="0"
                          value={setItem.duration}
                          onChange={(event) =>
                            saveSet(setIndex, {
                              ...setItem,
                              duration: event.target.value,
                            })
                          }
                          className="min-w-0 flex-1 bg-transparent outline-none"
                        />

                        <span className="ml-1 text-xs text-muted">seg</span>
                      </div>
                    </label>

                    <button
                      type="button"
                      disabled={isSaving}
                      aria-label={
                        setItem.done
                          ? t("unmarkSetAria", {
                              set: setIndex + 1,
                            })
                          : t("completeSetAria", {
                              set: setIndex + 1,
                            })
                      }
                      onClick={() =>
                        saveSet(setIndex, {
                          ...setItem,
                          done: !setItem.done,
                        })
                      }
                      className={`grid h-11 w-11 place-items-center rounded-full border transition disabled:cursor-wait disabled:opacity-50 ${
                        setItem.done
                          ? "border-acid bg-acid text-black"
                          : "border-white/15 text-muted hover:border-acid/50 hover:text-acid"
                      }`}
                    >
                      {isSaving ? (
                        <span>…</span>
                      ) : setItem.done ? (
                        <Check size={19} />
                      ) : (
                        <Circle size={19} />
                      )}
                    </button>
                  </div>

                  <label className="mt-3 block sm:hidden">
                    <span className="mb-1 block text-[11px] text-muted">
                      {t("durationOptional")}
                    </span>

                    <div className="flex h-11 items-center rounded-xl border border-white/10 bg-black/20 px-3 focus-within:border-acid/50">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        aria-label={t("durationAria", {
                          set: setIndex + 1,
                        })}
                        placeholder="0"
                        value={setItem.duration}
                        onChange={(event) =>
                          saveSet(setIndex, {
                            ...setItem,
                            duration: event.target.value,
                          })
                        }
                        className="min-w-0 flex-1 bg-transparent outline-none"
                      />

                      <span className="ml-1 text-xs text-muted">
                        {t("seconds")}
                      </span>
                    </div>
                  </label>
                </div>
              );
            })}
          </div>

          {error && (
            <p className="mt-3 rounded-xl border border-danger/20 bg-danger/[0.05] p-3 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => setIndex((current) => current - 1)}
              className="inline-flex items-center gap-1 text-sm disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={20} />
              {t("previous")}
            </button>

            {index < exerciseList.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  setSwapOpen(false);
                  setIndex((current) => current + 1);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-acid px-5 py-3 font-bold text-ink"
              >
                {t("next")}
                <ChevronRight size={20} />
              </button>
            ) : (
              <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 text-sm">
                  {t("effort")}

                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={effort}
                    onChange={(event) =>
                      setEffort(
                        Math.min(10, Math.max(1, Number(event.target.value))),
                      )
                    }
                    className="h-10 w-16 rounded-xl border border-white/10 bg-surface px-2 text-center outline-none focus:border-acid/50"
                  />
                </label>

                <button
                  type="button"
                  disabled={finishing}
                  onClick={finishWorkout}
                  className="rounded-full bg-acid px-5 py-3 font-bold text-ink disabled:cursor-wait disabled:opacity-60"
                >
                  {finishing ? t("finishing") : t("finishWorkout")}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {rest > 0 && (
        <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-2xl bg-acid p-4 text-ink shadow-2xl">
          <div>
            <p className="text-xs font-medium opacity-70">{t("rest")}</p>

            <b className="text-xl">
              {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, "0")}
            </b>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              aria-label={paused ? t("continueRest") : t("pauseRest")}
              onClick={() => setPaused((current) => !current)}
              className="grid h-10 w-10 place-items-center rounded-full bg-black/10"
            >
              {paused ? <Play size={20} /> : <Pause size={20} />}
            </button>

            <button
              type="button"
              aria-label={t("skipRest")}
              onClick={() => setRest(0)}
              className="grid h-10 w-10 place-items-center rounded-full bg-black/10"
            >
              <SkipForward size={20} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function ReceiptMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-3">
      <b>{value}</b>
      <small className="mt-1 block text-muted">{label}</small>
    </div>
  );
}
