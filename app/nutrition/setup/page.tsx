import AppShell from "@/components/app-shell";
import { NutritionSetupFlow } from "@/components/nutrition/nutrition-setup-flow";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NutritionSetupPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data, error } = await supabase
    .from("nutrition_preferences")
    .select(
      "age,height_cm,current_weight_kg,biological_sex,activity_level,nutrition_goal,current_daily_calories,daily_water_ml,protein_percentage,carbs_percentage,fat_percentage",
    )
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) console.error("[nutrition setup page]", error);
  if (!data) redirect("/onboarding/nutrition?edit=true");

  return (
    <AppShell>
      <NutritionSetupFlow
        initial={{
          age: Number(data.age),
          heightCm: Number(data.height_cm),
          weightKg: Number(data.current_weight_kg),
          biologicalSex: data.biological_sex as
            | "female"
            | "male"
            | "prefer_not_to_say",
          activityLevel: String(data.activity_level ?? ""),
          nutritionGoal: String(data.nutrition_goal ?? ""),
          currentDailyCalories: data.current_daily_calories
            ? Number(data.current_daily_calories)
            : null,
          dailyWaterMl: data.daily_water_ml ? Number(data.daily_water_ml) : null,
          proteinPercentage: Number(data.protein_percentage ?? 30),
          carbsPercentage: Number(data.carbs_percentage ?? 40),
          fatPercentage: Number(data.fat_percentage ?? 30),
        }}
      />
    </AppShell>
  );
}
