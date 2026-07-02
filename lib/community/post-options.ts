import type {
  PostType,
  PostVisibility,
  TrainingVisualStyle,
} from "@/types/database";

export const POST_TYPE_OPTIONS = [
  { value: "daily_life", label: "Daily life" },
  { value: "workout", label: "Workout" },
  { value: "progress", label: "Progress" },
  { value: "meal", label: "Meal" },
  { value: "photo", label: "Photo" },
  { value: "carousel", label: "Carousel" },
  { value: "video", label: "Short video" },
  { value: "achievement", label: "Achievement" },
  { value: "text", label: "Text" },
  { value: "verified_workout", label: "Workout Receipt" },
] as const satisfies readonly {
  value: PostType;
  label: string;
}[];

export const POST_VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "followers", label: "Followers" },
  { value: "private", label: "Only me" },
] as const satisfies readonly {
  value: PostVisibility;
  label: string;
}[];

export const TRAINING_VISUAL_STYLE_OPTIONS = [
  { value: "photo_only", label: "Photo only" },
  { value: "photo_stats", label: "Photo + stats" },
  { value: "photo_body_map", label: "Photo + body map" },
  { value: "full_carousel", label: "Full training carousel" },
  { value: "stats_only", label: "Stats only" },
] as const satisfies readonly {
  value: TrainingVisualStyle;
  label: string;
}[];

export function isPostType(value: string): value is PostType {
  return POST_TYPE_OPTIONS.some((option) => option.value === value);
}

export function isPostVisibility(
  value: string,
): value is PostVisibility {
  return POST_VISIBILITY_OPTIONS.some(
    (option) => option.value === value,
  );
}

export function isTrainingVisualStyle(
  value: string,
): value is TrainingVisualStyle {
  return TRAINING_VISUAL_STYLE_OPTIONS.some(
    (option) => option.value === value,
  );
}
