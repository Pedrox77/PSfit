"use client";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Apple, Clock3, Dumbbell, Sparkles } from "lucide-react";
import { OptionCard } from "./option-card";
import { PsfitLoader } from "@/components/ui/psfit-loader";
const choices = [
  [
    "workout",
    "Personalized workouts",
    "Get a routine built around your goals, schedule, experience and available equipment.",
    Dumbbell,
  ],
  [
    "nutrition",
    "Nutrition guidance",
    "Receive calorie, macro and meal guidance based on your preferences and routine.",
    Apple,
  ],
  [
    "both",
    "Workouts and nutrition",
    "Build a complete plan combining training, recovery and nutrition.",
    Sparkles,
  ],
  [
    "later",
    "Set up later",
    "Explore PSFIT first and configure your plan whenever you are ready.",
    Clock3,
  ],
] as const;
export function PersonalizationChoice({canUseNutrition}:{canUseNutrition:boolean}) {
  const router = useRouter();
  const [choice, setChoice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!choice || isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch("/api/onboarding/personalization", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        next?: string;
        error?: string;
      };
      if (!response.ok || !result.ok) {
        setError(result.error ?? "We couldn't save your choice.");
        return;
      }
      router.push(result.next ?? "/onboarding/training");
      router.refresh();
    } catch {
      setError("We couldn't save your choice. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <form onSubmit={handleSubmit} noValidate>
      <input type="hidden" name="choice" value={choice} />
      <div className="grid gap-3 sm:grid-cols-2">
        {choices.map(([value, title, description, Icon]) => (
          <OptionCard
            key={value}
            title={title}
            description={description}
            icon={Icon}
            selected={choice === value}
            onClick={() => {
              if((value==="nutrition"||value==="both")&&!canUseNutrition){
                setChoice("");
                setError("Nutrition is available with PSFIT Pro.");
                return;
              }
              setError("");
              setChoice(value);
            }}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!choice || isSaving}
        className="mt-7 flex min-h-12 w-full items-center justify-center rounded-full bg-acid py-3 font-bold text-ink disabled:opacity-40"
      >
        {isSaving ? <PsfitLoader size="sm" label="" /> : "Continue"}
      </button>
    </form>
  );
}
