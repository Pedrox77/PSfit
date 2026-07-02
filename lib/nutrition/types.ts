export type MacroDistribution = {
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
};

export type NutritionCalculationInput = MacroDistribution & {
  age: number;
  heightCm: number;
  weightKg: number;
  biologicalSex: "female" | "male" | "prefer_not_to_say";
  activityLevel: string;
  nutritionGoal: string;
  currentDailyCalories?: number | null;
  dailyWaterMl?: number | null;
};

export type NutritionTargets = {
  estimatedBmr: number;
  estimatedTdee: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterTargetMl: number;
};

export type FoodSearchResult = {
  id: string;
  source: "catalog" | "custom";
  name: string;
  brand: string | null;
  category: string;
  servingDescription: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  verified: boolean;
};

export type NutritionMealItem = {
  id: string;
  meal_id: string;
  food_name_snapshot: string;
  serving_description_snapshot: string | null;
  quantity: number;
  unit: string;
  serving_multiplier: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type NutritionMeal = {
  id: string;
  meal_date: string;
  meal_type: string;
  custom_name: string | null;
  meal_time: string | null;
  notes: string | null;
  items: NutritionMealItem[];
};

export type NutritionDayTotals = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
};

export type NutritionDayPayload = {
  date: string;
  meals: NutritionMeal[];
  waterLogs: Array<{
    id: string;
    amount_ml: number;
    created_at: string;
  }>;
  totals: NutritionDayTotals;
  targets: {
    targetCalories: number | null;
    proteinTargetG: number | null;
    carbsTargetG: number | null;
    fatTargetG: number | null;
    waterTargetMl: number | null;
  };
};
