import { NextResponse } from "next/server";
import { z } from "zod";

import {
  nutritionAccessResponse,
  requireNutritionContext,
} from "@/lib/nutrition/server-access";

const itemSchema = z.object({
  foodId: z.string().uuid(),
  source: z.enum(["catalog", "custom"]),
  servings: z.number().positive().max(100),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: mealId } = await params;
    const { supabase, user } = await requireNutritionContext();
    const input = itemSchema.parse(await request.json());

    const { data: meal, error: mealError } = await supabase
      .from("nutrition_meals")
      .select("id")
      .eq("id", mealId)
      .eq("user_id", user.id)
      .single();

    if (mealError || !meal) {
      return NextResponse.json(
        { ok: false, error: "Meal not found." },
        { status: 404 },
      );
    }

    const table = input.source === "catalog" ? "food_catalog" : "user_foods";
    let foodQuery = supabase
      .from(table)
      .select(
        "id,name,serving_description,serving_size,serving_unit,calories,protein_g,carbs_g,fat_g",
      )
      .eq("id", input.foodId);

    if (input.source === "custom") {
      foodQuery = foodQuery.eq("user_id", user.id);
    }

    const { data: food, error: foodError } = await foodQuery.single();

    if (foodError || !food) {
      return NextResponse.json(
        { ok: false, error: "Food not found." },
        { status: 404 },
      );
    }

    const factor = input.servings;
    const rounded = (value: unknown) =>
      Math.round(Number(value || 0) * factor * 100) / 100;

    const { data, error } = await supabase
      .from("nutrition_meal_items")
      .insert({
        user_id: user.id,
        meal_id: mealId,
        food_id: food.id,
        food_source: input.source,
        food_name_snapshot: food.name,
        serving_description_snapshot: food.serving_description,
        quantity: input.servings,
        unit: food.serving_unit,
        serving_multiplier: input.servings,
        calories: rounded(food.calories),
        protein_g: rounded(food.protein_g),
        carbs_g: rounded(food.carbs_g),
        fat_g: rounded(food.fat_g),
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, item: data });
  } catch (error) {
    const access = nutritionAccessResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });

    console.error("[add meal item]", error);
    return NextResponse.json(
      { ok: false, error: "Unable to add food." },
      { status: 400 },
    );
  }
}
