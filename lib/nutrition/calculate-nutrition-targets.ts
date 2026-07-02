import type {
  NutritionCalculationInput,
  NutritionTargets,
} from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundToNearest(value: number, step: number) {
  return Math.round(value / step) * step;
}

export function calculateNutritionTargets(
  input: NutritionCalculationInput,
): NutritionTargets {
  const {
    age,
    heightCm,
    weightKg,
    biologicalSex,
    activityLevel,
    nutritionGoal,
    proteinPercentage,
    carbsPercentage,
    fatPercentage,
  } = input;

  const macroTotal =
    proteinPercentage + carbsPercentage + fatPercentage;

  if (macroTotal !== 100) {
    throw new Error("MACROS_MUST_TOTAL_100");
  }

  const sexOffset =
    biologicalSex === "male"
      ? 5
      : biologicalSex === "female"
        ? -161
        : -78;

  const estimatedBmr = Math.round(
    10 * weightKg + 6.25 * heightCm - 5 * age + sexOffset,
  );

  const activityFactors: Record<string, number> = {
    mostly_seated: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };

  const estimatedTdee = Math.round(
    estimatedBmr * (activityFactors[activityLevel] ?? 1.45),
  );

  const goalMultiplier =
    nutritionGoal === "lose_body_fat"
      ? 0.85
      : nutritionGoal === "gain_muscle"
        ? 1.1
        : nutritionGoal === "improve_workout_performance"
          ? 1.05
          : 1;

  const calculatedTarget = estimatedTdee * goalMultiplier;
  const targetCalories = roundToNearest(
    clamp(calculatedTarget, 1200, 6000),
    10,
  );

  const proteinGrams = Math.round(
    (targetCalories * (proteinPercentage / 100)) / 4,
  );
  const carbsGrams = Math.round(
    (targetCalories * (carbsPercentage / 100)) / 4,
  );
  const fatGrams = Math.round(
    (targetCalories * (fatPercentage / 100)) / 9,
  );

  const waterTargetMl = roundToNearest(
    clamp(weightKg * 35, 1500, 5000),
    100,
  );

  return {
    estimatedBmr,
    estimatedTdee,
    targetCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    waterTargetMl,
  };
}
