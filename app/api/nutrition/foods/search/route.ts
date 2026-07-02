import { NextResponse } from "next/server";

import {
  nutritionAccessResponse,
  requireNutritionContext,
} from "@/lib/nutrition/server-access";
import type { FoodSearchResult } from "@/lib/nutrition/types";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ");
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireNutritionContext();
    const url = new URL(request.url);
    const query = normalize(url.searchParams.get("q") ?? "");
    const category = normalize(url.searchParams.get("category") ?? "");

    let catalogQuery = supabase
      .from("food_catalog")
      .select(
        "id,name,brand,category,serving_description,serving_size,serving_unit,calories,protein_g,carbs_g,fat_g,verified",
      )
      .limit(40);

    if (query) {
      catalogQuery = catalogQuery.ilike("normalized_name", `%${query}%`);
    }

    if (category && category !== "all") {
      catalogQuery = catalogQuery.eq("category", category);
    }

    const [catalogResult, customResult] = await Promise.all([
      catalogQuery.order("verified", { ascending: false }).order("name"),
      supabase
        .from("user_foods")
        .select(
          "id,name,brand,category,serving_description,serving_size,serving_unit,calories,protein_g,carbs_g,fat_g",
        )
        .eq("user_id", user.id)
        .ilike("normalized_name", query ? `%${query}%` : "%")
        .limit(20)
        .order("name"),
    ]);

    if (catalogResult.error) throw catalogResult.error;
    if (customResult.error) throw customResult.error;

    const catalog: FoodSearchResult[] = (catalogResult.data ?? []).map(
      (food) => ({
        id: food.id,
        source: "catalog",
        name: food.name,
        brand: food.brand,
        category: food.category,
        servingDescription: food.serving_description,
        servingSize: Number(food.serving_size),
        servingUnit: food.serving_unit,
        calories: Number(food.calories),
        proteinG: Number(food.protein_g),
        carbsG: Number(food.carbs_g),
        fatG: Number(food.fat_g),
        verified: Boolean(food.verified),
      }),
    );

    const custom: FoodSearchResult[] = (customResult.data ?? [])
      .filter((food) => !category || category === "all" || food.category === category)
      .map((food) => ({
        id: food.id,
        source: "custom",
        name: food.name,
        brand: food.brand,
        category: food.category,
        servingDescription: food.serving_description,
        servingSize: Number(food.serving_size),
        servingUnit: food.serving_unit,
        calories: Number(food.calories),
        proteinG: Number(food.protein_g),
        carbsG: Number(food.carbs_g),
        fatG: Number(food.fat_g),
        verified: false,
      }));

    return NextResponse.json({ ok: true, foods: [...custom, ...catalog] });
  } catch (error) {
    const access = nutritionAccessResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });

    console.error("[food search]", error);
    return NextResponse.json(
      { ok: false, error: "Unable to search foods." },
      { status: 400 },
    );
  }
}
