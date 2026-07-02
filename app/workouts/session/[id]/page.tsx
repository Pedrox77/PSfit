import { WorkoutSession } from "@/components/training/workout-session";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type {
  ExerciseCatalogRow,
  ExerciseRow,
  WorkoutSessionRow,
  WorkoutSetLogRow,
} from "@/types/database";
import { getLocale,getTranslations } from "next-intl/server";
import { exerciseName,workoutName } from "@/lib/i18n/workout-content";
import { notFound, redirect } from "next/navigation";
import { getCurrentUserEntitlements } from "@/lib/billing/current-entitlements";
import type { LoadProgressionSuggestion } from "../load-progression-actions";

type SupportedLocale = "pt" | "en" | "es";

type SessionData = WorkoutSessionRow & {
  workouts: {
    id: string;
    name: string;
    name_key:string|null;
    focus_key:string|null;
    focus: string | null;
    exercises: ExerciseRow[];
  } | null;
};

type ExerciseTranslationRow = {
  exercise_id: string;
  locale: SupportedLocale;
  name: string;
  aliases: string[] | null;
  primary_muscle: string | null;
  secondary_muscles: string[] | null;
  equipment: string | null;
  instructions: string | null;
  safety_notes: string | null;
};

function getSupportedLocale(locale: string): SupportedLocale {
  if (locale === "en" || locale === "es") {
    return locale;
  }

  return "pt";
}

function getFallbackWorkoutName(locale: SupportedLocale) {
  if (locale === "en") {
    return "Workout";
  }

  if (locale === "es") {
    return "Entrenamiento";
  }

  return "Treino";
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  const db = await createClient();
  const locale = getSupportedLocale(await getLocale());
  const contentT=await getTranslations("WorkoutContent");
  const { entitlements } = await getCurrentUserEntitlements();

  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const result = await db
    .from("workout_sessions")
    .select("*,workouts(id,name,focus,exercises(*))")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (result.error) {
    logSupabaseError("Workout session", result.error);
  }

  if (!result.data) {
    notFound();
  }

  const session = result.data as unknown as SessionData;
  const originalExercises = session.workouts?.exercises ?? [];
  const exerciseIds = originalExercises.map(
    (exercise) => exercise.id,
  );

  const [
    logsResult,
    previousLogsResult,
    catalogResult,
    translationsResult,
    progressionResult,
  ] = await Promise.all([
    db
      .from("workout_set_logs")
      .select("*")
      .eq("session_id", id),

    exerciseIds.length > 0
      ? db
          .from("workout_set_logs")
          .select("*")
          .eq("user_id", user.id)
          .in("exercise_id", exerciseIds)
          .neq("session_id", id)
          .eq("completed", true)
          .order("created_at", {
            ascending: false,
          })
      : Promise.resolve({
          data: [],
          error: null,
        }),

    db
      .from("exercise_catalog")
      .select("*")
      .eq("is_active", true)
      .order("name"),

    db
      .from("exercise_catalog_translations")
      .select(
        "exercise_id,locale,name,aliases,primary_muscle,secondary_muscles,equipment,instructions,safety_notes",
      )
      .eq("locale", locale),
    exerciseIds.length
      ? db.from("load_progression_events").select("id,exercise_id,previous_weight,suggested_weight,progression_mode,status").eq("user_id",user.id).in("exercise_id",exerciseIds).in("status",["suggested","applied"]).order("created_at",{ascending:false})
      : Promise.resolve({data:[],error:null}),
  ]);

  if (logsResult.error) {
    logSupabaseError(
      "Workout set logs",
      logsResult.error,
    );
  }

  if (previousLogsResult.error) {
    logSupabaseError(
      "Previous workout loads",
      previousLogsResult.error,
    );
  }

  if (catalogResult.error) {
    logSupabaseError(
      "Exercise catalog",
      catalogResult.error,
    );
  }

  if (translationsResult.error) {
    logSupabaseError(
      "Exercise translations",
      translationsResult.error,
    );
  }

  const translations = (
    translationsResult.data ?? []
  ) as unknown as ExerciseTranslationRow[];

  const translationByExerciseId = new Map<
    string,
    ExerciseTranslationRow
  >(
    translations.map((translation) => [
      translation.exercise_id,
      translation,
    ]),
  );

  const catalogRows = (
    catalogResult.data ?? []
  ) as unknown as ExerciseCatalogRow[];

  const translatedCatalog: ExerciseCatalogRow[] =
    catalogRows.map((catalogItem) => {
      const translation =
        translationByExerciseId.get(catalogItem.id);

      if (!translation) {
        return catalogItem;
      }

      return {
        ...catalogItem,
        name: translation.name || catalogItem.name,
        aliases:
          translation.aliases ?? catalogItem.aliases,
        primary_muscle:
          translation.primary_muscle ??
          catalogItem.primary_muscle,
        secondary_muscles:
          translation.secondary_muscles ??
          catalogItem.secondary_muscles,
        equipment:
          translation.equipment ??
          catalogItem.equipment,
        instructions:
          translation.instructions ??
          catalogItem.instructions,
        safety_notes:
          translation.safety_notes ??
          catalogItem.safety_notes,
      };
    });

  const translatedExercises: ExerciseRow[] =
    originalExercises.map((exercise) => {
      if (!exercise.catalog_exercise_id) {
        return {...exercise,name:exerciseName(contentT,exercise.name_key,exercise.name)};
      }

      const translation = translationByExerciseId.get(
        exercise.catalog_exercise_id,
      );

      if (!translation) {
        return exercise;
      }

      return {
        ...exercise,
        name: translation.name || exercise.name,
        muscle_group:
          translation.primary_muscle ??
          exercise.muscle_group,
        primary_muscles: translation.primary_muscle
          ? [translation.primary_muscle]
          : exercise.primary_muscles,
        secondary_muscles:
          translation.secondary_muscles ??
          exercise.secondary_muscles,
        equipment:
          translation.equipment ??
          exercise.equipment,
      };
    });

  return (
    <WorkoutSession
      session={session}
      workoutName={
        (session.workouts?workoutName(contentT,session.workouts.name_key,session.workouts.name):null) ??
        getFallbackWorkoutName(locale)
      }
      exercises={[...translatedExercises].sort(
        (a, b) => a.position - b.position,
      )}
      logs={
        (logsResult.data ??
          []) as unknown as WorkoutSetLogRow[]
      }
      previousLogs={
        (previousLogsResult.data ??
          []) as unknown as WorkoutSetLogRow[]
      }
      catalog={translatedCatalog}
      detailedMuscleMap={entitlements.canViewDetailedMuscleMap}
      initialProgressions={(progressionResult.data??[]).map(event=>{
        const exercise=originalExercises.find(item=>item.id===event.exercise_id);
        return {id:event.id,exerciseId:event.exercise_id,exerciseName:exercise?.name??"Exercício",previousWeight:Number(event.previous_weight),suggestedWeight:Number(event.suggested_weight),mode:event.progression_mode as "automatic"|"confirm",status:event.status as LoadProgressionSuggestion["status"]};
      }) satisfies LoadProgressionSuggestion[]}
    />
  );
}
