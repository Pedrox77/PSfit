import { NextResponse } from "next/server";
import { z } from "zod";

import {
  nutritionAccessResponse,
  requireNutritionContext,
} from "@/lib/nutrition/server-access";

const mealSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum([
    "breakfast",
    "morning_snack",
    "lunch",
    "afternoon_snack",
    "dinner",
    "supper",
    "custom",
  ]),
  customName: z.string().trim().max(80).nullable().optional(),
  mealTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable()
    .optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireNutritionContext();
    const input = mealSchema.parse(await request.json());

    const { data, error } = await supabase
      .from("nutrition_meals")
      .insert({
        user_id: user.id,
        meal_date: input.date,
        meal_type: input.mealType,
        custom_name:
          input.mealType === "custom" ? input.customName || "Meal" : null,
        meal_time: input.mealTime || null,
        notes: input.notes || null,
      })
      .select("id,meal_date,meal_type,custom_name,meal_time,notes")
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, meal: data });
  } catch (error) {
    const access = nutritionAccessResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });

    console.error("[create nutrition meal]", error);
    return NextResponse.json(
      { ok: false, error: "Unable to create meal." },
      { status: 400 },
    );
  }
}
