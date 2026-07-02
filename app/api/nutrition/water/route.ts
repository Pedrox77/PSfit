import { NextResponse } from "next/server";
import { z } from "zod";

import {
  nutritionAccessResponse,
  requireNutritionContext,
} from "@/lib/nutrition/server-access";

const waterSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amountMl: z.number().int().min(1).max(5000),
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireNutritionContext();
    const input = waterSchema.parse(await request.json());

    const { data, error } = await supabase
      .from("water_intake_logs")
      .insert({
        user_id: user.id,
        log_date: input.date,
        amount_ml: input.amountMl,
      })
      .select("id,amount_ml,created_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, log: data });
  } catch (error) {
    const access = nutritionAccessResponse(error);
    if (access) return NextResponse.json(access.body, { status: access.status });

    console.error("[water log]", error);
    return NextResponse.json(
      { ok: false, error: "Unable to register water." },
      { status: 400 },
    );
  }
}
