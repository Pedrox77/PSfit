import { NextResponse } from "next/server";
import { z } from "zod";

import { calculateNutritionTargets } from "@/lib/nutrition/calculate-nutrition-targets";
import {
  nutritionAccessResponse,
  requireNutritionContext,
} from "@/lib/nutrition/server-access";

const setupSchema = z
  .object({
    currentDailyCalories: z.number().int().min(500).max(10000).nullable(),
    dailyWaterMl: z.number().int().min(0).max(15000),
    proteinPercentage: z.number().int().min(0).max(100),
    carbsPercentage: z.number().int().min(0).max(100),
    fatPercentage: z.number().int().min(0).max(100),
  })
  .refine(
    (value) =>
      value.proteinPercentage +
        value.carbsPercentage +
        value.fatPercentage ===
      100,
    {
      message: "MACROS_MUST_TOTAL_100",
      path: ["proteinPercentage"],
    },
  );

function errorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "INVALID_NUTRITION_SETUP";
  }

  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const value = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    return [value.message, value.details, value.hint, value.code]
      .filter((item): item is string => typeof item === "string" && item.length > 0)
      .join(" | ");
  }

  return "Unable to save nutrition setup.";
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireNutritionContext();
    const input = setupSchema.parse(await request.json());

    const { data: preferences, error: preferencesError } = await supabase
      .from("nutrition_preferences")
      .select(
        "age,height_cm,current_weight_kg,biological_sex,activity_level,nutrition_goal",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (preferencesError) throw preferencesError;

    if (!preferences) {
      return NextResponse.json(
        {
          ok: false,
          error: "Complete your nutrition onboarding first.",
          errorCode: "NUTRITION_ONBOARDING_REQUIRED",
        },
        { status: 409 },
      );
    }

    const age = Number(preferences.age);
    const heightCm = Number(preferences.height_cm);
    const weightKg = Number(preferences.current_weight_kg);

    if (
      !Number.isFinite(age) ||
      age <= 0 ||
      !Number.isFinite(heightCm) ||
      heightCm <= 0 ||
      !Number.isFinite(weightKg) ||
      weightKg <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Complete age, height and current weight in the nutrition onboarding.",
          errorCode: "NUTRITION_PROFILE_INCOMPLETE",
        },
        { status: 409 },
      );
    }

    const targets = calculateNutritionTargets({
      age,
      heightCm,
      weightKg,
      biologicalSex: preferences.biological_sex as
        | "female"
        | "male"
        | "prefer_not_to_say",
      activityLevel: String(preferences.activity_level ?? ""),
      nutritionGoal: String(preferences.nutrition_goal ?? ""),
      currentDailyCalories: input.currentDailyCalories,
      dailyWaterMl: input.dailyWaterMl,
      proteinPercentage: input.proteinPercentage,
      carbsPercentage: input.carbsPercentage,
      fatPercentage: input.fatPercentage,
    });

    const now = new Date().toISOString();

    const { error: preferencesSaveError } = await supabase
      .from("nutrition_preferences")
      .update({
        current_daily_calories: input.currentDailyCalories,
        daily_water_ml: input.dailyWaterMl,
        target_calories: targets.targetCalories,
        protein_percentage: input.proteinPercentage,
        carbs_percentage: input.carbsPercentage,
        fat_percentage: input.fatPercentage,
        protein_target_grams: targets.proteinGrams,
        carbs_target_grams: targets.carbsGrams,
        fat_target_grams: targets.fatGrams,
        water_target_ml: targets.waterTargetMl,
        nutrition_setup_completed: true,
        updated_at: now,
      })
      .eq("user_id", user.id);

    if (preferencesSaveError) throw preferencesSaveError;

    const { error: targetsSaveError } = await supabase
      .from("nutrition_targets")
      .upsert(
        {
          user_id: user.id,
          estimated_calories_min: targets.targetCalories,
          estimated_calories_max: targets.targetCalories,
          estimated_protein_min_g: targets.proteinGrams,
          estimated_protein_max_g: targets.proteinGrams,
          estimated_carbs_min_g: targets.carbsGrams,
          estimated_carbs_max_g: targets.carbsGrams,
          estimated_fat_min_g: targets.fatGrams,
          estimated_fat_max_g: targets.fatGrams,
          water_target_ml: targets.waterTargetMl,
          calculation_version: "nutrition-setup-v1",
          updated_at: now,
        },
        { onConflict: "user_id" },
      );

    if (targetsSaveError) throw targetsSaveError;

    return NextResponse.json({ ok: true, targets });
  } catch (error) {
    const access = nutritionAccessResponse(error);
    if (access) {
      return NextResponse.json(access.body, { status: access.status });
    }

    const message = errorMessage(error);
    console.error("[nutrition setup]", error);

    return NextResponse.json(
      { ok: false, error: message },
      { status: 400 },
    );
  }
}
