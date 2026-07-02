"use client";

import {
  type FormEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { OnboardingNavigation } from "./onboarding-navigation";
import { OnboardingProgress } from "./onboarding-progress";
import { SafetyNotice } from "./safety-notice";

const preferences = [
  "no_specific_preference",
  "high_protein",
  "vegetarian",
  "vegan",
  "pescatarian",
  "low_lactose",
  "gluten_free_preference",
];

const allergies = [
  "none",
  "milk",
  "eggs",
  "peanuts",
  "tree_nuts",
  "soy",
  "wheat",
  "fish",
  "shellfish",
  "other",
];

type FormControl =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

type ApiResult = {
  ok?: boolean;
  next?: string;
  error?: string;
};

type Section = {
  id: string;
  content: ReactNode;
};

type ChoiceProps = {
  name: string;
  title: string;
  options: string[];
  onChange?: (value: string) => void;
  defaultValue?: string;
};

type ChecksProps = {
  name: string;
  title: string;
  options: string[];
  onChange?: (value: string, checked: boolean) => void;
  selectedValues?: string[];
};

export function NutritionQuestionnaire() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingNutrition = searchParams.get("edit") === "true";
  const formRef = useRef<HTMLFormElement>(null);

  const [step, setStep] = useState(0);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [care, setCare] = useState<"no" | "yes" | "prefer_not_to_say">("no");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const hasSpecificAllergy = selectedAllergies.some(
    (value) => value !== "none",
  );

  function handleAllergyChange(value: string, checked: boolean) {
    setSelectedAllergies((current) => {
      if (value === "none") {
        return checked ? ["none"] : [];
      }

      const withoutNoneOrCurrent = current.filter(
        (item) => item !== "none" && item !== value,
      );

      return checked
        ? [...withoutNoneOrCurrent, value]
        : withoutNoneOrCurrent;
    });
  }

  function validateStep(currentStep: number) {
    const form = formRef.current;

    if (!form) {
      setError("The form could not be loaded. Please refresh the page.");
      return false;
    }

    const section = form.querySelector<HTMLElement>(
      `[data-onboarding-step="${currentStep}"]`,
    );

    if (!section) {
      setError("This step could not be validated. Please refresh the page.");
      return false;
    }

    const requiredControls = Array.from(
      section.querySelectorAll<FormControl>(
        "input[required], select[required], textarea[required]",
      ),
    );

    for (const control of requiredControls) {
      if (!control.checkValidity()) {
        setError("Complete the required fields before continuing.");
        control.reportValidity();
        control.focus();
        return false;
      }
    }

    if (
      currentStep === 3 &&
      !section.querySelector<HTMLInputElement>(
        'input[name="eating_preferences"]:checked',
      )
    ) {
      setError("Select at least one eating preference.");
      return false;
    }

    if (
      currentStep === 4 &&
      !section.querySelector<HTMLInputElement>(
        'input[name="allergies"]:checked',
      )
    ) {
      setError("Select at least one allergy or restriction option.");
      return false;
    }

    if (
      currentStep === 7 &&
      !section.querySelector<HTMLInputElement>(
        'input[name="professional_care_answer"]:checked',
      )
    ) {
      setError("Choose an answer before continuing.");
      return false;
    }

    setError("");
    return true;
  }

  function goToNextStep() {
    if (!validateStep(step)) {
      return;
    }

    setStep((current) => Math.min(current + 1, sections.length - 1));
  }

  function goToPreviousStep() {
    setError("");
    setStep((current) => Math.max(0, current - 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving || step !== sections.length - 1) {
      return;
    }

    if (!validateStep(step)) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    if (editingNutrition) {
      formData.set("edit_mode", "true");
    }

    if (!formData.get("professional_care_answer")) {
      formData.set("professional_care_answer", care);
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/onboarding/nutrition", {
        method: "POST",
        body: formData,
      });

      let result: ApiResult;

      try {
        result = (await response.json()) as ApiResult;
      } catch {
        result = {
          ok: false,
          error: "The server returned an invalid response.",
        };
      }

      if (!response.ok || !result.ok) {
        setError(
          result.error ??
            "We couldn't save your nutrition preferences.",
        );
        return;
      }

      router.replace(
        result.next ??
          (editingNutrition
            ? "/nutrition/setup"
            : "/onboarding/review"),
      );
      router.refresh();
    } catch (requestError) {
      console.error("[NutritionQuestionnaire]", requestError);
      setError("We couldn't save your answers. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const sections: Section[] = [
    {
      id: "goal",
      content: (
        <Choice
          name="nutrition_goal"
          title="What is your nutrition goal?"
          options={[
            "lose_body_fat",
            "gain_muscle",
            "maintain_weight",
            "improve_eating_habits",
            "increase_protein_intake",
            "improve_workout_performance",
          ]}
        />
      ),
    },
    {
      id: "body",
      content: (
        <section>
          <h2 className="text-2xl font-semibold">
            Tell us about your body information
          </h2>

          <p className="mt-2 text-sm text-muted">
            This information is used only to estimate calorie and macro
            ranges.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <NumberInput name="age" label="Age" min={13} max={120} />

            <NumberInput
              name="height_cm"
              label="Height (cm)"
              min={80}
              max={260}
            />

            <NumberInput
              name="current_weight_kg"
              label="Current weight (kg)"
              min={25}
              max={500}
            />

            <NumberInput
              name="target_weight_kg"
              label="Target weight (optional)"
              min={25}
              max={500}
              optional
            />

            <label className="text-sm">
              Biological sex for metabolic estimates
              <select
                required
                name="biological_sex"
                defaultValue=""
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] p-3"
              >
                <option value="" disabled>
                  Choose
                </option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="prefer_not_to_say">
                  Prefer not to say
                </option>
              </select>
            </label>
          </div>
        </section>
      ),
    },
    {
      id: "activity",
      content: (
        <Choice
          name="activity_level"
          title="How active is your daily routine?"
          options={[
            "mostly_seated",
            "lightly_active",
            "moderately_active",
            "very_active",
            "extremely_active",
          ]}
        />
      ),
    },
    {
      id: "preferences",
      content: (
        <Checks
          name="eating_preferences"
          title="What eating preferences fit you?"
          options={preferences}
        />
      ),
    },
    {
      id: "allergies",
      content: (
        <section>
          <Checks
            name="allergies"
            title="Allergies and restrictions"
            options={allergies}
            selectedValues={selectedAllergies}
            onChange={handleAllergyChange}
          />

          {hasSpecificAllergy && (
            <div className="mt-4">
              <textarea
                name="allergy_notes"
                maxLength={1000}
                placeholder="Optional safety notes"
                className="w-full rounded-xl border border-white/10 bg-[#101512] p-4"
              />

              <div className="mt-3">
                <SafetyNotice>
                  Always verify ingredients and cross-contamination risk.
                  PSFIT does not replace qualified allergy or nutrition care.
                </SafetyNotice>
              </div>
            </div>
          )}
        </section>
      ),
    },
    {
      id: "meals",
      content: (
        <section>
          <h2 className="text-2xl font-semibold">
            Meals and preparation
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Meals per day
              <select
                required
                name="meals_per_day"
                defaultValue=""
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] p-3"
              >
                <option value="" disabled>
                  Choose
                </option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="flexible">Flexible</option>
              </select>
            </label>

            <label className="text-sm">
              Cooking skill
              <select
                required
                name="cooking_skill"
                defaultValue=""
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] p-3"
              >
                <option value="" disabled>
                  Choose
                </option>
                <option value="beginner">Beginner</option>
                <option value="comfortable">Comfortable</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>

            <NumberInput
              name="preparation_time_minutes"
              label="Available preparation time (minutes)"
              min={0}
              max={1440}
            />

            <NumberInput
              name="weekly_food_budget"
              label="Weekly food budget (optional)"
              min={0}
              max={100000}
              optional
            />

            <TextInput
              name="liked_foods"
              label="Foods you like (comma separated)"
            />

            <TextInput
              name="disliked_foods"
              label="Foods you dislike (comma separated)"
            />
          </div>
        </section>
      ),
    },
    {
      id: "routine",
      content: (
        <section>
          <h2 className="text-2xl font-semibold">
            Your usual routine
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <TimeInput name="breakfast_time" label="Breakfast" />
            <TimeInput name="lunch_time" label="Lunch" />
            <TimeInput name="dinner_time" label="Dinner" />
            <TimeInput name="usual_training_time" label="Training" />

            <YesNo
              name="eats_before_training"
              label="Do you eat before training?"
            />

            <YesNo
              name="eats_after_training"
              label="Do you eat after training?"
            />
          </div>
        </section>
      ),
    },
    {
      id: "safety",
      content: (
        <section>
          <Choice
            name="professional_care_answer"
            title="Do you have a medical condition, pregnancy, eating disorder history or another situation that requires professional nutrition care?"
            options={["no", "yes", "prefer_not_to_say"]}
            defaultValue="no"
            onChange={(value) =>
              setCare(
                value as "no" | "yes" | "prefer_not_to_say",
              )
            }
          />

          {care === "yes" && (
            <div className="mt-4">
              <SafetyNotice>
                You can continue using PSFIT, but guidance will remain
                general and non-restrictive. Consult a doctor or registered
                nutrition professional for individual care.
              </SafetyNotice>
            </div>
          )}
        </section>
      ),
    },
  ];

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
    >
      <OnboardingProgress
        current={step + 1}
        total={sections.length}
      />

      <div className="mt-8">
        {sections.map((section, index) => (
          <div
            key={section.id}
            data-onboarding-step={index}
            aria-hidden={index !== step}
            className={index === step ? "block" : "hidden"}
          >
            {section.content}
          </div>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="mt-5 text-sm text-red-400"
        >
          {error}
        </p>
      )}

      <OnboardingNavigation
        back={step > 0 ? goToPreviousStep : undefined}
        next={
          step < sections.length - 1
            ? goToNextStep
            : undefined
        }
        last={step === sections.length - 1}
        disabled={isSaving}
        loadingLabel="Saving..."
      />
    </form>
  );
}

function nice(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function Choice({
  name,
  title,
  options,
  onChange,
  defaultValue,
}: ChoiceProps) {
  return (
    <fieldset>
      <legend className="text-2xl font-semibold">
        {title}
      </legend>

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
              defaultChecked={option === defaultValue}
              onChange={() => onChange?.(option)}
              className="mr-3 accent-[#a8ff2a]"
            />
            {nice(option)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Checks({
  name,
  title,
  options,
  onChange,
  selectedValues,
}: ChecksProps) {
  return (
    <fieldset>
      <legend className="text-2xl font-semibold">
        {title}
      </legend>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const controlled = selectedValues !== undefined;

          return (
            <label
              key={option}
              className="rounded-xl border border-white/10 bg-[#090c0a] p-4 has-[:checked]:border-acid"
            >
              <input
                type="checkbox"
                name={name}
                value={option}
                {...(controlled
                  ? {
                      checked: selectedValues.includes(option),
                    }
                  : {})}
                onChange={(event) =>
                  onChange?.(option, event.target.checked)
                }
                className="mr-3 accent-[#a8ff2a]"
              />
              {nice(option)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function NumberInput({
  name,
  label,
  min,
  max,
  optional,
}: {
  name: string;
  label: string;
  min: number;
  max: number;
  optional?: boolean;
}) {
  return (
    <label className="text-sm">
      {label}
      <input
        required={!optional}
        name={name}
        type="number"
        step="any"
        min={min}
        max={max}
        className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] p-3"
      />
    </label>
  );
}

function TextInput({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    <label className="text-sm">
      {label}
      <input
        name={name}
        type="text"
        className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] p-3"
      />
    </label>
  );
}

function TimeInput({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    <label className="text-sm">
      {label}
      <input
        name={name}
        type="time"
        className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] p-3"
      />
    </label>
  );
}

function YesNo({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    <label className="text-sm">
      {label}
      <select
        name={name}
        defaultValue="yes"
        className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] p-3"
      >
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </label>
  );
}
