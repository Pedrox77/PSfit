import { NextResponse } from "next/server";
import { z } from "zod";

import {
  nutritionAccessResponse,
  requireNutritionContext,
} from "@/lib/nutrition/server-access";
import type {
  NutritionDayPayload,
  NutritionMeal,
  NutritionMealItem,
} from "@/lib/nutrition/types";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireNutritionContext();
    const date = dateSchema.parse(new URL(request.url).searchParams.get("date"));

    const [mealsResult, waterResult, preferencesResult] = await Promise.all([
      supabase
        .from("nutrition_meals")
        .select("id,meal_date,meal_type,custom_name,meal_time,notes,created_at")
        .eq("user_id", user.id)
        .eq("meal_date", date)
        .order("meal_time", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true }),
      supabase
        .from("water_intake_logs")
        .select("id,amount_ml,created_at")
        .eq("user_id", user.id)
        .eq("log_date", date)
        .order("created_at", { ascending: false }),
      supabase
        .from("nutrition_preferences")
        .select(
          "target_calories,protein_target_grams,carbs_target_grams,fat_target_grams,water_target_ml",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (mealsResult.error) throw mealsResult.error;
    if (waterResult.error) throw waterResult.error;
    if (preferencesResult.error) throw preferencesResult.error;

    const mealRows = mealsResult.data ?? [];
    const mealIds = mealRows.map((meal) => meal.id);

    const itemsResult = mealIds.length
      ? await supabase
          .from("nutrition_meal_items")
          .select(
            "id,meal_id,food_name_snapshot,serving_description_snapshot,quantity,unit,serving_multiplier,calories,protein_g,carbs_g,fat_g,created_at",
          )
          .eq("user_id", user.id)
          .in("meal_id", mealIds)
          .order("created_at", { ascending: true })
      : { data: [], error: null };

    if (itemsResult.error) throw itemsResult.error;

    const itemRows = (itemsResult.data ?? []) as NutritionMealItem[];
    const meals: NutritionMeal[] = mealRows.map((meal) => ({
      ...meal,
      items: itemRows.filter((item) => item.meal_id === meal.id),
    }));

    const totals = itemRows.reduce(
      (sum, item) => ({
        calories: sum.calories + Number(item.calories || 0),
        proteinG: sum.proteinG + Number(item.protein_g || 0),
        carbsG: sum.carbsG + Number(item.carbs_g || 0),
        fatG: sum.fatG + Number(item.fat_g || 0),
        waterMl: sum.waterMl,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, waterMl: 0 },
    );

    totals.waterMl = (waterResult.data ?? []).reduce(
      (sum, log) => sum + Number(log.amount_ml || 0),
      0,
    );

    const preferences = preferencesResult.data;

    const payload: NutritionDayPayload = {
      date,
      meals,
      waterLogs: waterResult.data ?? [],
      totals,
      targets: {
        targetCalories: preferences?.target_calories
          ? Number(preferences.target_calories)
          : null,
        proteinTargetG: preferences?.protein_target_grams
          ? Number(preferences.protein_target_grams)
          : null,
        carbsTargetG: preferences?.carbs_target_grams
          ? Number(preferences.carbs_target_grams)
          : null,
        fatTargetG: preferences?.fat_target_grams
          ? Number(preferences.fat_target_grams)
          : null,
        waterTargetMl: preferences?.water_target_ml
          ? Number(preferences.water_target_ml)
          : null,
      },
    };

    return NextResponse.json(payload);
  } catch (error) {
    const access = nutritionAccessResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });

    console.error("[nutrition day]", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load nutrition day." },
      { status: 400 },
    );
  }
}
