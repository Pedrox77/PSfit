import AppShell from "@/components/app-shell";
import { ManualWorkoutBuilder } from "@/components/training/manual-workout-builder";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { ExerciseCatalogRow } from "@/types/database";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

type SupportedLocale = "pt" | "en" | "es";

type ExerciseTranslationRow = {
  exercise_id: string;
  name: string;
  aliases: string[] | null;
  primary_muscle: string | null;
  secondary_muscles: string[] | null;
  equipment: string | null;
  instructions: string | null;
  safety_notes: string | null;
};

function normalizeLocale(locale: string): SupportedLocale {
  const language = locale.toLowerCase().split("-")[0];
  return language === "en" || language === "es" ? language : "pt";
}

export default async function NewWorkout() {
  const db = await createClient();
  const locale = normalizeLocale(await getLocale());
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [catalogResult, translationsResult] = await Promise.all([
    db.from("exercise_catalog").select("*").order("name"),
    db
      .from("exercise_catalog_translations")
      .select(
        "exercise_id,name,aliases,primary_muscle,secondary_muscles,equipment,instructions,safety_notes",
      )
      .eq("locale", locale),
  ]);

  if (catalogResult.error) {
    logSupabaseError("Exercise catalog", catalogResult.error);
  }
  if (translationsResult.error) {
    logSupabaseError("Exercise catalog translations", translationsResult.error);
  }

  const translations = (translationsResult.data ??
    []) as unknown as ExerciseTranslationRow[];
  const translationById = new Map(
    translations.map((translation) => [translation.exercise_id, translation]),
  );
  const catalog = (catalogResult.data ?? []) as unknown as ExerciseCatalogRow[];
  const translatedCatalog = catalog.map((exercise) => {
    const translation = translationById.get(exercise.id);

    return translation
      ? {
          ...exercise,
          name: translation.name || exercise.name,
          aliases: translation.aliases ?? exercise.aliases,
          primary_muscle:
            translation.primary_muscle ?? exercise.primary_muscle,
          secondary_muscles:
            translation.secondary_muscles ?? exercise.secondary_muscles,
          equipment: translation.equipment ?? exercise.equipment,
          instructions: translation.instructions ?? exercise.instructions,
          safety_notes: translation.safety_notes ?? exercise.safety_notes,
        }
      : exercise;
  });

  return (
    <AppShell>
      <ManualWorkoutBuilder catalog={translatedCatalog} />
    </AppShell>
  );
}
