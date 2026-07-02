"use client";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingProgress } from "./onboarding-progress";
import { OnboardingNavigation } from "./onboarding-navigation";
import { SafetyNotice } from "./safety-notice";
const data = [
  [
    "primary_goal",
    "What is your main training goal?",
    [
      "build_muscle",
      "lose_body_fat",
      "improve_strength",
      "improve_endurance",
      "improve_mobility",
      "general_fitness",
      "return_to_training",
      "prepare_for_sport",
    ],
  ],
  [
    "experience_level",
    "What is your training experience?",
    ["beginner", "intermediate", "advanced"],
  ],
  [
    "training_location",
    "Where do you usually train?",
    ["commercial_gym", "home", "outdoors", "mixed_locations"],
  ],
] as const;
const equipment = [
  "full_gym",
  "dumbbells",
  "barbell",
  "bench",
  "resistance_bands",
  "pull_up_bar",
  "machines",
  "bodyweight_only",
  "treadmill",
  "exercise_bike",
  "other",
];
const focus = [
  "full_body",
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "glutes",
  "core",
  "cardio",
  "mobility",
];
const limitations = [
  "no_limitations",
  "knee_discomfort",
  "shoulder_discomfort",
  "lower_back_discomfort",
  "hip_discomfort",
  "wrist_discomfort",
  "other",
];
export function TrainingQuestionnaire() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const answers = {
        primaryGoal: String(form.get("primary_goal") ?? ""),
        experienceLevel: String(form.get("experience_level") ?? ""),
        loadProgressionMode: String(
          form.get("load_progression_mode") ?? "confirm",
        ),
        trainingLocation: String(form.get("training_location") ?? ""),
        equipment: form.getAll("equipment").map(String),
        daysPerWeek: Number(form.get("days_per_week")),
        sessionDurationMinutes: Number(form.get("session_duration_minutes")),
        preferredDays: form.getAll("preferred_days").map(String),
        preferredTime: String(form.get("preferred_time") ?? ""),
        focusAreas: form.getAll("focus_areas").map(String),
        limitations: form.getAll("limitations").map(String),
        limitationNotes: String(form.get("limitation_notes") ?? ""),
        coachingStyle: String(form.get("coaching_style") ?? ""),
      };
      const response = await fetch("/api/onboarding/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        next?: string;
        error?: string;
      };
      if (!response.ok || !result.ok) {
        setError(result.error ?? "We couldn't save your training preferences.");
        return;
      }
      router.replace(result.next ?? "/onboarding/review");
      router.refresh();
    } catch {
      setError("We couldn't save your answers. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }
  const sections = [
    ...data
      .slice(0, 2)
      .map(([name, title, options]) => (
        <RadioGroup
          key={name}
          name={name}
          title={title}
          options={[...options]}
        />
      )),
    <ProgressionGroup key="load-progression" />,
    ...data
      .slice(2)
      .map(([name, title, options]) => (
        <RadioGroup
          key={name}
          name={name}
          title={title}
          options={[...options]}
        />
      )),
    <CheckGroup
      key="equipment"
      name="equipment"
      title="What equipment can you use?"
      options={equipment}
    />,
    <Availability key="availability" />,
    <CheckGroup
      key="focus"
      name="focus_areas"
      title="What would you like to focus on?"
      options={focus}
    />,
    <section key="limitations">
      <CheckGroup
        name="limitations"
        title="Do you have injuries, pain or movement limitations?"
        options={limitations}
      />
      <textarea
        name="limitation_notes"
        maxLength={1000}
        placeholder="Optional context about pain or limitations"
        className="mt-4 w-full rounded-xl border border-white/10 bg-[#101512] p-4"
      />
      <div className="mt-4">
        <SafetyNotice>
          PSFIT does not replace medical assessment. Stop movements that
          increase pain and seek qualified guidance when needed.
        </SafetyNotice>
      </div>
    </section>,
    <RadioGroup
      key="style"
      name="coaching_style"
      title="How should PSFIT coach you?"
      options={["supportive", "direct", "educational", "competitive"]}
    />,
  ];
  return (
    <form onSubmit={handleSubmit} noValidate>
      <OnboardingProgress current={step + 1} total={sections.length} />
      <div className="mt-8">
        {sections.map((section, index) => (
          <div key={index} className={index === step ? "block" : "hidden"}>
            {section}
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-5 text-sm text-red-400">
          {error}
        </p>
      )}
      <OnboardingNavigation
        back={
          step > 0
            ? () => {
                setError("");
                setStep((x) => x - 1);
              }
            : undefined
        }
        next={
          step < sections.length - 1
            ? () => {
                setError("");
                setStep((x) => x + 1);
              }
            : undefined
        }
        last={step === sections.length - 1}
        disabled={isSaving}
        loadingLabel="Saving…"
      />
    </form>
  );
}
const nice = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
function RadioGroup({
  name,
  title,
  options,
}: {
  name: string;
  title: string;
  options: string[];
}) {
  return (
    <fieldset>
      <legend className="text-2xl font-semibold">{title}</legend>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option}
            className="rounded-xl border border-white/10 bg-[#090c0a] p-4 has-[:checked]:border-acid has-[:checked]:bg-acid/5"
          >
            <input
              required
              type="radio"
              name={name}
              value={option}
              className="mr-3 accent-[#a8ff2a]"
            />
            {nice(option)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function CheckGroup({
  name,
  title,
  options,
}: {
  name: string;
  title: string;
  options: string[];
}) {
  return (
    <fieldset>
      <legend className="text-2xl font-semibold">{title}</legend>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option}
            className="rounded-xl border border-white/10 bg-[#090c0a] p-4 has-[:checked]:border-acid"
          >
            <input
              type="checkbox"
              name={name}
              value={option}
              className="mr-3 accent-[#a8ff2a]"
            />
            {nice(option)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function ProgressionGroup() {
  const options = [
    [
      "automatic",
      "Progressão automática",
      "O PSFIT aumenta gradualmente a carga quando você conclui todas as séries com boa execução.",
    ],
    [
      "confirm",
      "Sugerir e confirmar",
      "O PSFIT recomenda uma nova carga, mas você confirma antes de aplicar.",
    ],
    [
      "manual",
      "Controle manual",
      "Você escolhe e altera suas cargas sem progressão automática.",
    ],
  ] as const;
  return (
    <fieldset>
      <legend className="text-2xl font-semibold">
        Como você quer evoluir suas cargas?
      </legend>
      <p className="mt-2 text-sm text-muted">
        O PSFIT pode analisar seu desempenho e sugerir aumentos graduais de
        peso.
      </p>
      <div className="mt-6 grid gap-3">
        {options.map(([value, title, description]) => (
          <label
            key={value}
            className="rounded-xl border border-white/10 bg-[#090c0a] p-4 has-[:checked]:border-acid has-[:checked]:bg-acid/5"
          >
            <span className="flex items-start gap-3">
              <input
                required
                defaultChecked={value === "confirm"}
                type="radio"
                name="load_progression_mode"
                value={value}
                className="mt-1 accent-[#a8ff2a]"
              />
              <span>
                <b className="block">{title}</b>
                <span className="mt-1 block text-sm leading-6 text-muted">
                  {description}
                </span>
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function Availability() {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  return (
    <section>
      <h2 className="text-2xl font-semibold">What fits your real week?</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          Days per week
          <select
            required
            name="days_per_week"
            defaultValue=""
            className="mt-2 w-full rounded-xl bg-[#101512] p-3"
          >
            <option value="" disabled>
              Choose
            </option>
            {[2, 3, 4, 5, 6, 7].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Minutes per session
          <select
            required
            name="session_duration_minutes"
            defaultValue=""
            className="mt-2 w-full rounded-xl bg-[#101512] p-3"
          >
            <option value="" disabled>
              Choose
            </option>
            {[20, 30, 45, 60, 75].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Preferred time
          <select
            required
            name="preferred_time"
            defaultValue=""
            className="mt-2 w-full rounded-xl bg-[#101512] p-3"
          >
            <option value="" disabled>
              Choose
            </option>
            {["morning", "afternoon", "evening", "flexible"].map((x) => (
              <option key={x} value={x}>
                {nice(x)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="mt-5">
        <legend className="text-sm text-muted">Preferred days</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {days.map((day) => (
            <label
              key={day}
              className="rounded-full border border-white/10 px-3 py-2 text-xs has-[:checked]:border-acid"
            >
              <input
                type="checkbox"
                name="preferred_days"
                value={day}
                className="sr-only"
              />
              {nice(day).slice(0, 3)}
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
