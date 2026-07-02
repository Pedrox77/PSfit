import { z } from "zod";
export const trainingPreferencesSchema = z.object({
  primary_goal: z.string().min(1),
  experience_level: z.enum(["beginner", "intermediate", "advanced"]),
  training_location: z.string().min(1),
  equipment: z.array(z.string()).min(1),
  days_per_week: z.coerce.number().int().min(2).max(7),
  session_duration_minutes: z.coerce
    .number()
    .refine((x) => [20, 30, 45, 60, 75].includes(x)),
  preferred_days: z.array(z.string()),
  preferred_time: z.string().min(1),
  focus_areas: z.array(z.string()).min(1),
  limitations: z.array(z.string()).min(1),
  limitation_notes: z.string().max(1000).optional(),
  coaching_style: z.enum([
    "supportive",
    "direct",
    "educational",
    "competitive",
  ]),
  load_progression_mode: z
    .enum(["automatic", "confirm", "manual"])
    .default("confirm"),
});
export type TrainingPreferences = z.infer<typeof trainingPreferencesSchema>;
