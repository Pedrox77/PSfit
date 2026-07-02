import type { TrainingStreak } from "@/types/database";
const day = (value: string) => value.slice(0, 10);
const difference = (a: string, b: string) => Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86400000);
export function calculateStreak(completedDates: string[], now = new Date()): TrainingStreak {
  const dates = Array.from(new Set(completedDates.map(day))).filter((date) => Date.parse(date) <= now.getTime()).sort();
  const today = now.toISOString().slice(0, 10), yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
  let best = 0, run = 0, previous = "";
  for (const date of dates) { run = previous && difference(date, previous) === 1 ? run + 1 : 1; best = Math.max(best, run); previous = date; }
  const end = dates.at(-1); let current = 0;
  if (end === today || end === yesterday) { current = 1; for (let i = dates.length - 1; i > 0 && difference(dates[i], dates[i - 1]) === 1; i--) current++; }
  return { current, best, totalDays: dates.length, trainedToday: dates.includes(today) };
}
