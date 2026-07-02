"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type LoadProgressionSuggestion = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  previousWeight: number;
  suggestedWeight: number;
  mode: "automatic" | "confirm";
  status: "suggested" | "applied" | "rejected" | "reverted";
};

function plannedRepetitions(value: string | null) {
  const match = value?.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function nextWeight(
  weight: number,
  equipment: string | null,
  muscles: string[],
  name: string,
) {
  const lower = [...muscles, name].join(" ").toLowerCase();
  const lowerOrCompound =
    /perna|leg|quad|glute|squat|agach|deadlift|terra|press/.test(lower);
  const increase = weight * (lowerOrCompound ? 0.05 : 0.025);
  const step = /halter|dumbbell/.test((equipment ?? "").toLowerCase())
    ? 1
    : 0.5;
  return Math.min(weight * 1.1, Math.ceil((weight + increase) / step) * step);
}

async function authenticated() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("AUTH_REQUIRED");
  return { supabase, user: data.user };
}

export async function processLoadProgressions(
  sessionId: string,
): Promise<LoadProgressionSuggestion[]> {
  const { supabase, user } = await authenticated();
  const { data: preference } = await supabase
    .from("training_preferences")
    .select("load_progression_mode,limitations")
    .eq("user_id", user.id)
    .maybeSingle();
  const mode = preference?.load_progression_mode ?? "confirm";
  if (mode === "manual") return [];
  if ((preference?.limitations ?? []).some((item: string) => item !== "no_limitations"))
    return [];

  const today = new Date().toISOString().slice(0, 10);
  const { data: recovery } = await supabase
    .from("recovery_checkins")
    .select("has_pain,readiness_score")
    .eq("user_id", user.id)
    .eq("checkin_date", today)
    .maybeSingle();
  if (recovery?.has_pain || Number(recovery?.readiness_score ?? 100) < 40)
    return [];

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .select("id,completed_at,workout_id,status")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .single();
  if (sessionError || !session)
    throw sessionError ?? new Error("SESSION_NOT_FOUND");
  const { data: exercises, error: exerciseError } = await supabase
    .from("exercises")
    .select("id,name,sets,repetitions,equipment,primary_muscles,muscle_group")
    .eq("workout_id", session.workout_id);
  if (exerciseError) throw exerciseError;
  const { data: logs, error: logsError } = await supabase
    .from("workout_set_logs")
    .select("exercise_id,set_number,weight_kg,repetitions,completed")
    .eq("session_id", sessionId)
    .eq("user_id", user.id);
  if (logsError) throw logsError;

  const suggestions: LoadProgressionSuggestion[] = [];
  for (const exercise of exercises ?? []) {
    const completed = (logs ?? []).filter(
      (log) => log.exercise_id === exercise.id && log.completed,
    );
    const plannedSets = Math.max(1, Number(exercise.sets ?? 1));
    const plannedReps = plannedRepetitions(exercise.repetitions);
    if (
      completed.length < plannedSets ||
      !plannedReps ||
      completed.some((log) => Number(log.repetitions ?? 0) < plannedReps)
    )
      continue;
    const previousWeight = Math.max(
      0,
      ...completed.map((log) => Number(log.weight_kg ?? 0)),
    );
    if (
      previousWeight <= 0 ||
      /peso corporal|bodyweight/.test((exercise.equipment ?? "").toLowerCase())
    )
      continue;
    const { data: existing } = await supabase
      .from("load_progression_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("exercise_id", exercise.id)
      .gte("created_at", session.completed_at ?? new Date(0).toISOString())
      .limit(1);
    if (existing?.length) continue;
    const suggestedWeight = nextWeight(
      previousWeight,
      exercise.equipment,
      exercise.primary_muscles ?? [exercise.muscle_group ?? ""],
      exercise.name,
    );
    const applied = mode === "automatic";
    const { data: event, error: eventError } = await supabase
      .from("load_progression_events")
      .insert({
        user_id: user.id,
        exercise_id: exercise.id,
        previous_weight: previousWeight,
        suggested_weight: suggestedWeight,
        applied_weight: applied ? suggestedWeight : null,
        progression_mode: mode,
        reason: "Todas as séries e repetições planejadas foram concluídas.",
        status: applied ? "applied" : "suggested",
        ...(applied ? { applied_at: new Date().toISOString() } : {}),
      })
      .select("id,status")
      .single();
    if (eventError) throw eventError;
    if (applied)
      await supabase
        .from("exercises")
        .update({ suggested_weight_kg: suggestedWeight })
        .eq("id", exercise.id)
        .eq("workout_id", session.workout_id);
    suggestions.push({
      id: event.id,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      previousWeight,
      suggestedWeight,
      mode,
      status: event.status as "suggested" | "applied",
    });
  }
  revalidatePath(`/workouts/session/${sessionId}`);
  return suggestions;
}

export async function decideLoadProgression(eventId: string, apply: boolean) {
  const { supabase, user } = await authenticated();
  const { data: event, error } = await supabase
    .from("load_progression_events")
    .select("*")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .eq("status", "suggested")
    .single();
  if (error || !event) throw error ?? new Error("SUGGESTION_NOT_FOUND");
  if (apply) {
    await supabase
      .from("exercises")
      .update({ suggested_weight_kg: event.suggested_weight })
      .eq("id", event.exercise_id);
    await supabase
      .from("load_progression_events")
      .update({
        status: "applied",
        applied_weight: event.suggested_weight,
        applied_at: new Date().toISOString(),
      })
      .eq("id", event.id)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("load_progression_events")
      .update({ status: "rejected" })
      .eq("id", event.id)
      .eq("user_id", user.id);
  }
  return { ok: true };
}

export async function revertLoadProgression(eventId: string) {
  const { supabase, user } = await authenticated();
  const { data: event, error } = await supabase
    .from("load_progression_events")
    .select("*")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .eq("status", "applied")
    .single();
  if (error || !event) throw error ?? new Error("PROGRESSION_NOT_FOUND");
  await supabase
    .from("exercises")
    .update({ suggested_weight_kg: event.previous_weight })
    .eq("id", event.exercise_id);
  await supabase
    .from("load_progression_events")
    .update({ status: "reverted" })
    .eq("id", event.id)
    .eq("user_id", user.id);
  return { ok: true };
}
