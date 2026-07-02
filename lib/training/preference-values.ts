const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const LEGACY_TIMES: Record<string, string> = {
  morning: "08:00",
  afternoon: "15:00",
  evening: "19:00",
};

const COACHING_STYLES: Record<string, "direct" | "supportive" | "educational" | "competitive"> = {
  direct: "direct",
  motivational: "competitive",
  supportive: "supportive",
  technical: "educational",
  educational: "educational",
  competitive: "competitive",
};

export function normalizePreferredTime(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  const mapped = LEGACY_TIMES[normalized] ?? normalized.slice(0, 5);
  return TIME_PATTERN.test(mapped) ? mapped : null;
}

export function normalizeCoachingStyle(value: unknown) {
  return typeof value === "string" ? COACHING_STYLES[value] ?? null : null;
}

export function coachingStyleForForm(value: string | null | undefined) {
  if (value === "competitive") return "motivational";
  if (value === "educational") return "technical";
  return value === "direct" ? "direct" : "supportive";
}
