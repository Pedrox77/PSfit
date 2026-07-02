const DAYS: Record<string, number> = {
  domingo: 0, sunday: 0, segunda: 1, monday: 1, terca: 2, tuesday: 2,
  quarta: 3, wednesday: 3, quinta: 4, thursday: 4, sexta: 5, friday: 5,
  sabado: 6, saturday: 6,
};
const DEFAULTS: Record<number, number[]> = {
  2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 5, 6],
  6: [1, 2, 3, 4, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6],
};
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export function weekdayNumber(value: string): number | null {
  return DAYS[normalize(value)] ?? null;
}

export function buildTrainingSchedule(daysPerWeek: number, preferredDays?: string[] | null): number[] {
  const count = Math.max(2, Math.min(7, Math.round(daysPerWeek)));
  const preferred = Array.from(new Set((preferredDays ?? []).map(weekdayNumber).filter((day): day is number => day !== null)));
  const fallback = DEFAULTS[count] ?? DEFAULTS[3];
  return [...preferred, ...fallback.filter((day) => !preferred.includes(day))].slice(0, count);
}
