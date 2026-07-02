"use client";

import { saveManualWorkout } from "@/app/internal-actions";
import type { ExerciseCatalogRow } from "@/types/database";
import {
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

type Selected = {
  catalog_exercise_id: string;
  name: string;
  sets: number;
  repetitions: string;
  rest_seconds: number;
  suggested_weight_kg: number;
  load_guidance: string;
  notes: string;
};

const difficultyValues = ["beginner", "intermediate", "advanced"] as const;
const exerciseTypeValues = [
  "strength",
  "cardio",
  "mobility",
  "stretching",
  "balance",
  "conditioning",
] as const;
const weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export function ManualWorkoutBuilder({
  catalog,
}: {
  catalog: ExerciseCatalogRow[];
}) {
  const t = useTranslations("ManualWorkoutBuilder");
  const [selected, setSelected] = useState<Selected[]>([]);
  const [library, setLibrary] = useState(false);
  const [search, setSearch] = useState("");
  const [letter, setLetter] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [exerciseType, setExerciseType] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return catalog.filter((exercise) => {
      const searchable = [
        exercise.name,
        ...(exercise.aliases ?? []),
        exercise.primary_muscle,
        ...(exercise.secondary_muscles ?? []),
        exercise.equipment ?? "",
      ].map((value) => value.toLocaleLowerCase());

      return (
        (!query || searchable.some((value) => value.includes(query))) &&
        (!letter ||
          exercise.name.toLocaleUpperCase().startsWith(letter)) &&
        (!muscle ||
          exercise.primary_muscle === muscle ||
          exercise.secondary_muscles?.includes(muscle)) &&
        (!equipment || exercise.equipment === equipment) &&
        (!difficulty || exercise.difficulty === difficulty) &&
        (!exerciseType || exercise.exercise_type === exerciseType)
      );
    });
  }, [
    catalog,
    difficulty,
    equipment,
    exerciseType,
    letter,
    muscle,
    search,
  ]);

  const muscles = Array.from(
    new Set(
      catalog.flatMap((exercise) => [
        exercise.primary_muscle,
        ...(exercise.secondary_muscles ?? []),
      ]),
    ),
  ).filter(Boolean);

  function update(
    index: number,
    key: keyof Selected,
    value: string | number,
  ) {
    setSelected((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  }

  function add(exercise: ExerciseCatalogRow) {
    setSelected((items) =>
      items.some((item) => item.catalog_exercise_id === exercise.id)
        ? items
        : [
            ...items,
            {
              catalog_exercise_id: exercise.id,
              name: exercise.name,
              sets: 3,
              repetitions: "8–12",
              rest_seconds: 60,
              suggested_weight_kg: 0,
              load_guidance: t("defaultLoadGuidance"),
              notes: "",
            },
          ],
    );
  }

  function remove(exerciseId: string) {
    setSelected((items) =>
      items.filter((item) => item.catalog_exercise_id !== exerciseId),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-2 text-4xl font-semibold">{t("title")}</h1>
      </div>

      <form
        action={saveManualWorkout}
        onSubmit={(event) => {
          const form = event.currentTarget;
          const payload = {
            name: (form.elements.namedItem("name") as HTMLInputElement).value,
            description: (
              form.elements.namedItem("description") as HTMLInputElement
            ).value,
            focus: (form.elements.namedItem("focus") as HTMLInputElement).value,
            difficulty: (
              form.elements.namedItem("difficulty") as HTMLSelectElement
            ).value,
            scheduled_weekday: Number(
              (form.elements.namedItem("day") as HTMLSelectElement).value,
            ),
            scheduled_time:
              (form.elements.namedItem("time") as HTMLInputElement).value ||
              null,
            estimated_minutes: Number(
              (form.elements.namedItem("minutes") as HTMLInputElement).value,
            ),
            exercises: selected,
          };
          (form.elements.namedItem("payload") as HTMLInputElement).value =
            JSON.stringify(payload);
        }}
        className="space-y-5"
      >
        <input type="hidden" name="payload" />
        <section className="card grid gap-4 p-6 md:grid-cols-2">
          <Input name="name" label={t("workoutName")} required />
          <Input name="focus" label={t("muscleFocus")} />
          <Input name="description" label={t("description")} />
          <label>
            {t("difficulty")}
            <select name="difficulty" className="field">
              {difficultyValues.map((value) => (
                <option value={value} key={value}>
                  {t(value)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("day")}
            <select name="day" className="field">
              {weekdays.map((day, index) => (
                <option value={index} key={day}>
                  {t(day)}
                </option>
              ))}
            </select>
          </label>
          <Input name="time" label={t("optionalTime")} type="time" />
          <Input
            name="minutes"
            label={t("estimatedDuration")}
            type="number"
            defaultValue="45"
            required
          />
        </section>

        <section className="card p-6">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                {t("selectedExercises")}
              </h2>
              <p className="text-sm text-muted">{t("configureExercises")}</p>
            </div>
            <button
              type="button"
              onClick={() => setLibrary(true)}
              className="rounded-full bg-acid px-4 py-2 text-sm font-bold text-ink"
            >
              + {t("addExercise")}
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {selected.map((exercise, index) => (
              <div
                className="rounded-2xl border border-white/10 p-4"
                key={exercise.catalog_exercise_id}
              >
                <div className="flex justify-between">
                  <b>{exercise.name}</b>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!index}
                      aria-label={t("moveUp")}
                      onClick={() =>
                        setSelected((items) => {
                          const next = [...items];
                          [next[index - 1], next[index]] = [
                            next[index],
                            next[index - 1],
                          ];
                          return next;
                        })
                      }
                    >
                      <ChevronUp />
                    </button>
                    <button
                      type="button"
                      disabled={index === selected.length - 1}
                      aria-label={t("moveDown")}
                      onClick={() =>
                        setSelected((items) => {
                          const next = [...items];
                          [next[index + 1], next[index]] = [
                            next[index],
                            next[index + 1],
                          ];
                          return next;
                        })
                      }
                    >
                      <ChevronDown />
                    </button>
                    <button
                      type="button"
                      className="text-xs text-aqua"
                      onClick={() => {
                        remove(exercise.catalog_exercise_id);
                        setLibrary(true);
                      }}
                    >
                      {t("swap")}
                    </button>
                    <button
                      type="button"
                      aria-label={t("removeExercise")}
                      onClick={() => remove(exercise.catalog_exercise_id)}
                    >
                      <Trash2 />
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                  <Small
                    label={t("sets")}
                    value={exercise.sets}
                    onChange={(value) => update(index, "sets", Number(value))}
                    type="number"
                  />
                  <Small
                    label={t("repetitions")}
                    value={exercise.repetitions}
                    onChange={(value) => update(index, "repetitions", value)}
                  />
                  <Small
                    label={t("rest")}
                    value={exercise.rest_seconds}
                    onChange={(value) =>
                      update(index, "rest_seconds", Number(value))
                    }
                    type="number"
                  />
                  <Small
                    label={t("suggestedLoad")}
                    value={exercise.suggested_weight_kg}
                    onChange={(value) =>
                      update(index, "suggested_weight_kg", Number(value))
                    }
                    type="number"
                  />
                  <Small
                    label={t("loadGuidance")}
                    value={exercise.load_guidance}
                    onChange={(value) => update(index, "load_guidance", value)}
                  />
                  <Small
                    label={t("notes")}
                    value={exercise.notes}
                    onChange={(value) => update(index, "notes", value)}
                  />
                </div>
              </div>
            ))}
            {!selected.length && (
              <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-muted">
                {t("emptySelection")}
              </p>
            )}
          </div>
        </section>

        <div className="flex gap-3">
          <Submit disabled={!selected.length} />
          <button
            type="button"
            onClick={() => history.back()}
            className="rounded-full border border-white/10 px-6 py-3"
          >
            {t("cancel")}
          </button>
        </div>
      </form>

      {library && (
        <div
          className="fixed inset-0 z-[80] bg-black/70"
          onMouseDown={() => setLibrary(false)}
        >
          <aside
            onMouseDown={(event) => event.stopPropagation()}
            className="ml-auto flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-raised p-5"
          >
            <div className="flex justify-between">
              <h2 className="text-2xl font-semibold">{t("libraryTitle")}</h2>
              <button
                type="button"
                aria-label={t("closeLibrary")}
                onClick={() => setLibrary(false)}
              >
                <X />
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <label className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 px-3">
                <Search />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("searchExercise")}
                  className="w-full bg-transparent py-3 outline-none"
                />
              </label>
              <Filter
                label={t("muscles")}
                value={muscle}
                set={setMuscle}
                values={muscles}
              />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Filter
                label={t("equipment")}
                value={equipment}
                set={setEquipment}
                values={catalog.map((exercise) => exercise.equipment)}
              />
              <Filter
                label={t("difficulty")}
                value={difficulty}
                set={setDifficulty}
                values={difficultyValues.filter((value) =>
                  catalog.some((exercise) => exercise.difficulty === value),
                )}
                getLabel={(value) => t(value as (typeof difficultyValues)[number])}
              />
              <Filter
                label={t("type")}
                value={exerciseType}
                set={setExerciseType}
                values={exerciseTypeValues.filter((value) =>
                  catalog.some((exercise) => exercise.exercise_type === value),
                )}
                getLabel={(value) =>
                  t(value as (typeof exerciseTypeValues)[number])
                }
              />
            </div>
            <div className="my-4 flex flex-wrap gap-1">
              {["", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setLetter(value)}
                  className={`h-7 min-w-7 rounded ${
                    letter === value ? "bg-acid text-ink" : "bg-white/5"
                  }`}
                >
                  {value || t("all")}
                </button>
              ))}
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {filtered.map((exercise) => {
                const isSelected = selected.some(
                  (item) => item.catalog_exercise_id === exercise.id,
                );

                return (
                  <div
                    key={exercise.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 p-3"
                  >
                    {exercise.thumbnail_url ? (
                      <img
                        alt={exercise.name}
                        src={exercise.thumbnail_url}
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-white/5">
                        <Dumbbell className="text-muted" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <b>{exercise.name}</b>
                      <p className="text-xs text-muted">
                        {exercise.primary_muscle} ·{" "}
                        {exercise.equipment || t("noEquipment")} ·{" "}
                        {exercise.difficulty &&
                        difficultyValues.includes(
                          exercise.difficulty as (typeof difficultyValues)[number],
                        )
                          ? t(
                              exercise.difficulty as (typeof difficultyValues)[number],
                            )
                          : exercise.difficulty}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        isSelected ? remove(exercise.id) : add(exercise)
                      }
                      className="rounded-full border border-acid px-3 py-1 text-sm text-acid"
                    >
                      {isSelected ? t("remove") : `+ ${t("add")}`}
                    </button>
                  </div>
                );
              })}
              {!filtered.length && (
                <p className="text-muted">{t("noExercisesFound")}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setLibrary(false)}
              className="mt-4 rounded-full bg-acid py-3 font-bold text-ink"
            >
              {t("finishSelection", { count: selected.length })}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

function Input({
  name,
  label,
  type,
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="field"
      />
    </label>
  );
}

function Small({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="text-xs text-muted">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field"
      />
    </label>
  );
}

function Submit({ disabled }: { disabled: boolean }) {
  const t = useTranslations("ManualWorkoutBuilder");
  const { pending } = useFormStatus();

  return (
    <button
      disabled={disabled || pending}
      className="rounded-full bg-acid px-6 py-3 font-bold text-ink disabled:opacity-40"
    >
      {pending ? t("saving") : t("saveWorkout")}
    </button>
  );
}

function Filter({
  label,
  value,
  set,
  values,
  getLabel = (item) => item,
}: {
  label: string;
  value: string;
  set: (value: string) => void;
  values: readonly (string | null)[];
  getLabel?: (value: string) => string;
}) {
  const uniqueValues = Array.from(
    new Set(values.filter((item): item is string => Boolean(item))),
  );

  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => set(event.target.value)}
      className="min-w-0 rounded-xl bg-surface px-3 py-2 text-sm"
    >
      <option value="">{label}</option>
      {uniqueValues.map((item) => (
        <option value={item} key={item}>
          {getLabel(item)}
        </option>
      ))}
    </select>
  );
}
