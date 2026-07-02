import { NextResponse } from "next/server";
import { z } from "zod";

import {
  nutritionAccessResponse,
  requireNutritionContext,
} from "@/lib/nutrition/server-access";

const customFoodSchema = z.object({
  name: z.string().trim().min(2).max(120),
  brand: z.string().trim().max(120).nullable().optional(),
  servingDescription: z.string().trim().min(1).max(120),
  servingSize: z.number().positive().max(10000),
  servingUnit: z.string().trim().min(1).max(20),
  calories: z.number().min(0).max(10000),
  proteinG: z.number().min(0).max(1000),
  carbsG: z.number().min(0).max(1000),
  fatG: z.number().min(0).max(1000),
});

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ");
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireNutritionContext();
    const input = customFoodSchema.parse(await request.json());

    const { data, error } = await supabase
      .from("user_foods")
      .insert({
        user_id: user.id,
        name: input.name,
        normalized_name: normalize(input.name),
        brand: input.brand || null,
        category: "custom",
        serving_description: input.servingDescription,
        serving_size: input.servingSize,
        serving_unit: input.servingUnit,
        calories: input.calories,
        protein_g: input.proteinG,
        carbs_g: input.carbsG,
        fat_g: input.fatG,
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    const access = nutritionAccessResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });

    console.error("[custom food]", error);
    return NextResponse.json(
      { ok: false, error: "Unable to create custom food." },
      { status: 400 },
    );
  }
}
