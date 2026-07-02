import { z } from "zod";
const optionalNumber=z.union([z.coerce.number().positive(),z.literal("").transform(()=>undefined)]).optional();
export const nutritionPreferencesSchema=z.object({
  nutrition_goal:z.string().min(1),age:z.coerce.number().int().min(13).max(120),
  height_cm:z.coerce.number().min(80).max(260),current_weight_kg:z.coerce.number().min(25).max(500),
  target_weight_kg:optionalNumber,biological_sex:z.enum(["female","male","prefer_not_to_say"]),
  activity_level:z.string().min(1),eating_preferences:z.array(z.string()).min(1),
  allergies:z.array(z.string()).min(1),allergy_notes:z.string().max(1000).optional(),
  meals_per_day:z.enum(["2","3","4","5","flexible"]),liked_foods:z.array(z.string()),
  disliked_foods:z.array(z.string()),cooking_skill:z.string().min(1),
  preparation_time_minutes:z.coerce.number().int().min(0).max(1440),weekly_food_budget:optionalNumber,
  breakfast_time:z.string().optional(),lunch_time:z.string().optional(),dinner_time:z.string().optional(),
  usual_training_time:z.string().optional(),eats_before_training:z.boolean(),eats_after_training:z.boolean(),
  professional_care_answer:z.enum(["no","yes","prefer_not_to_say"]),
});
export type NutritionPreferences=z.infer<typeof nutritionPreferencesSchema>;
