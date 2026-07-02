export type DisplayValueGroup =
  | "goals"
  | "levels"
  | "status"
  | "visibility"
  | "postTypes"
  | "activityLevels"
  | "equipment"
  | "nutritionGoals";

export const displayValueKeys: Record<
  DisplayValueGroup,
  Readonly<Record<string, string>>
> = {
  goals: {
    build_muscle: "buildMuscle",
    lose_fat: "loseFat",
    lose_body_fat: "loseFat",
    improve_fitness: "improveFitness",
    increase_strength: "increaseStrength",
    maintain_weight: "maintainWeight",
    general_health: "generalHealth",
  },
  levels: {
    beginner: "beginner",
    intermediate: "intermediate",
    advanced: "advanced",
  },
  status: {
    scheduled: "scheduled",
    completed: "completed",
    missed: "missed",
    in_progress: "inProgress",
  },
  visibility: {
    public: "public",
    followers: "followers",
    private: "private",
  },
  postTypes: {
    daily_life: "dailyLife",
    verified_workout: "verifiedWorkout",
    workout: "workout",
    progress: "progress",
    meal: "meal",
    photo: "photo",
    carousel: "carousel",
    video: "video",
    achievement: "achievement",
    text: "text",
  },
  activityLevels: {
    lightly_active: "lightlyActive",
    moderately_active: "moderatelyActive",
    very_active: "veryActive",
  },
  equipment: {
    full_gym: "fullGym",
    bodyweight_only: "bodyweightOnly",
  },
  nutritionGoals: {
    no_specific_preference: "noSpecificPreference",
    high_protein: "highProtein",
    balanced: "balanced",
  },
};

export function friendlyFallback(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function displayValueKey(
  group: DisplayValueGroup,
  value: string,
) {
  return displayValueKeys[group][value] ?? null;
}

const localizedValues = {
  pt: {
    build_muscle: "Ganhar massa muscular",
    lose_fat: "Perder gordura",
    lightly_active: "Levemente ativo",
    moderately_active: "Moderadamente ativo",
    very_active: "Muito ativo",
  },
  en: {
    build_muscle: "Build muscle",
    lose_fat: "Lose fat",
    lightly_active: "Lightly active",
    moderately_active: "Moderately active",
    very_active: "Very active",
  },
  es: {
    build_muscle: "Ganar masa muscular",
    lose_fat: "Perder grasa",
    lightly_active: "Actividad ligera",
    moderately_active: "Actividad moderada",
    very_active: "Actividad alta",
  },
} as const;

export function localizedDisplayValue(
  value: string,
  locale: string,
) {
  const language =
    locale.startsWith("en") ? "en" : locale.startsWith("es") ? "es" : "pt";
  return (
    localizedValues[language][
      value as keyof (typeof localizedValues)[typeof language]
    ] ?? friendlyFallback(value)
  );
}
