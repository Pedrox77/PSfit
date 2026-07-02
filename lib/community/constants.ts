export const FEED_PAGE_SIZE = 10;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const VIDEO_TYPES = ["video/mp4", "video/webm"] as const;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
export const COMMUNITY_BUCKET = "community-media";
export const MAX_STORY_VIDEO_BYTES = 25 * 1024 * 1024;

export const REPORT_REASONS = [
  "Spam", "Harassment", "Nudity", "Dangerous behavior",
  "Misinformation", "Hate speech", "Impersonation", "Other",
] as const;
