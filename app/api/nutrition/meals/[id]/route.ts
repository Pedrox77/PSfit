import { NextResponse } from "next/server";

import {
  nutritionAccessResponse,
  requireNutritionContext,
} from "@/lib/nutrition/server-access";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase, user } = await requireNutritionContext();

    const { error } = await supabase
      .from("nutrition_meals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const access = nutritionAccessResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });

    console.error("[delete nutrition meal]", error);
    return NextResponse.json(
      { ok: false, error: "Unable to delete meal." },
      { status: 400 },
    );
  }
}
