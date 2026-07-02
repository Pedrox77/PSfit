"use client";

import { ArrowLeft, ArrowRight, Droplets, Flame, PieChart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { calculateNutritionTargets } from "@/lib/nutrition/calculate-nutrition-targets";

type InitialPreferences = {
  age: number;
  heightCm: number;
  weightKg: number;
  biologicalSex: "female" | "male" | "prefer_not_to_say";
  activityLevel: string;
  nutritionGoal: string;
  currentDailyCalories: number | null;
  dailyWaterMl: number | null;
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
};

const presets = {
  balanced: { protein: 30, carbs: 40, fat: 30 },
  highProtein: { protein: 35, carbs: 35, fat: 30 },
  highCarb: { protein: 25, carbs: 50, fat: 25 },
} as const;

export function NutritionSetupFlow({
  initial,
}: {
  initial: InitialPreferences;
}) {
  const locale = useLocale();
  const t = useTranslations("NutritionSetup");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [unknownCalories, setUnknownCalories] = useState(
    initial.currentDailyCalories == null,
  );
  const [currentDailyCalories, setCurrentDailyCalories] = useState(
    initial.currentDailyCalories ?? 2200,
  );
  const [dailyWaterMl, setDailyWaterMl] = useState(initial.dailyWaterMl ?? 2000);
  const initialMacroTotal =
    initial.proteinPercentage +
    initial.carbsPercentage +
    initial.fatPercentage;

  const [proteinPercentage, setProteinPercentage] = useState(
    initialMacroTotal === 100 ? initial.proteinPercentage : 30,
  );
  const [carbsPercentage, setCarbsPercentage] = useState(
    initialMacroTotal === 100 ? initial.carbsPercentage : 40,
  );
  const [fatPercentage, setFatPercentage] = useState(
    initialMacroTotal === 100 ? initial.fatPercentage : 30,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const macroTotal = proteinPercentage + carbsPercentage + fatPercentage;

  const targets = useMemo(() => {
    if (macroTotal !== 100) return null;

    return calculateNutritionTargets({
      age: initial.age,
      heightCm: initial.heightCm,
      weightKg: initial.weightKg,
      biologicalSex: initial.biologicalSex,
      activityLevel: initial.activityLevel,
      nutritionGoal: initial.nutritionGoal,
      currentDailyCalories: unknownCalories ? null : currentDailyCalories,
      dailyWaterMl,
      proteinPercentage,
      carbsPercentage,
      fatPercentage,
    });
  }, [
    carbsPercentage,
    currentDailyCalories,
    dailyWaterMl,
    fatPercentage,
    initial,
    macroTotal,
    proteinPercentage,
    unknownCalories,
  ]);

  function validateCurrentStep() {
    if (step === 0 && !unknownCalories) {
      if (currentDailyCalories < 500 || currentDailyCalories > 10000) {
        setError(t("errors.calories"));
        return false;
      }
    }

    if (step === 1 && (dailyWaterMl < 0 || dailyWaterMl > 15000)) {
      setError(t("errors.water"));
      return false;
    }

    if (step === 2 && macroTotal !== 100) {
      setError(t("errors.macros"));
      return false;
    }

    setError("");
    return true;
  }

  function next() {
    if (!validateCurrentStep()) return;
    setStep((current) => Math.min(3, current + 1));
  }

  function back() {
    setError("");
    setStep((current) => Math.max(0, current - 1));
  }

  function applyPreset(preset: keyof typeof presets) {
    const values = presets[preset];
    setProteinPercentage(values.protein);
    setCarbsPercentage(values.carbs);
    setFatPercentage(values.fat);
    setError("");
  }

  async function start() {
    if (macroTotal !== 100) {
      setError(t("errors.macros"));
      return;
    }

    if (saving) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/nutrition/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentDailyCalories: unknownCalories ? null : currentDailyCalories,
          dailyWaterMl,
          proteinPercentage,
          carbsPercentage,
          fatPercentage,
        }),
      });

      const rawBody = await response.text();
      let result: { ok?: boolean; error?: string } = {};

      if (rawBody) {
        try {
          result = JSON.parse(rawBody) as {
            ok?: boolean;
            error?: string;
          };
        } catch {
          result = {
            ok: false,
            error: rawBody.slice(0, 300),
          };
        }
      }

      if (!response.ok || !result.ok) {
        setError(
          result.error ||
            `Unable to save nutrition setup (${response.status}).`,
        );
        return;
      }

      router.replace("/nutrition/meals");
    } catch {
      setError(t("errors.save"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index <= step ? "bg-acid" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      <div className="card overflow-hidden p-6 sm:p-8">
        {step === 0 && (
          <div>
            <Flame className="text-acid" size={30} />
            <p className="eyebrow mt-5">{t("step", { current: 1, total: 4 })}</p>
            <h1 className="mt-2 text-3xl font-semibold">{t("calories.title")}</h1>
            <p className="mt-3 text-muted">{t("calories.description")}</p>

            <label className="mt-7 block text-sm font-medium">
              {t("calories.label")}
              <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-[#101512] px-4 focus-within:border-acid/60">
                <input
                  type="number"
                  min={500}
                  max={10000}
                  disabled={unknownCalories}
                  value={currentDailyCalories}
                  onChange={(event) =>
                    setCurrentDailyCalories(Number(event.target.value || 0))
                  }
                  className="min-w-0 flex-1 bg-transparent py-4 text-2xl outline-none disabled:opacity-40"
                />
                <span className="text-muted">kcal</span>
              </div>
            </label>

            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 p-4">
              <input
                type="checkbox"
                checked={unknownCalories}
                onChange={(event) => setUnknownCalories(event.target.checked)}
                className="size-4 accent-[#a8ff2a]"
              />
              <span>{t("calories.unknown")}</span>
            </label>
          </div>
        )}

        {step === 1 && (
          <div>
            <Droplets className="text-aqua" size={30} />
            <p className="eyebrow mt-5">{t("step", { current: 2, total: 4 })}</p>
            <h1 className="mt-2 text-3xl font-semibold">{t("water.title")}</h1>
            <p className="mt-3 text-muted">{t("water.description")}</p>

            <label className="mt-7 block text-sm font-medium">
              {t("water.label")}
              <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-[#101512] px-4 focus-within:border-aqua/60">
                <input
                  type="number"
                  min={0}
                  max={15000}
                  step={100}
                  value={dailyWaterMl}
                  onChange={(event) => setDailyWaterMl(Number(event.target.value || 0))}
                  className="min-w-0 flex-1 bg-transparent py-4 text-2xl outline-none"
                />
                <span className="text-muted">ml</span>
              </div>
            </label>

            <p className="mt-3 text-sm text-aqua">
              {t("water.liters", { value: (dailyWaterMl / 1000).toFixed(1) })}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {[1000, 1500, 2000, 2500, 3000, 3500].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDailyWaterMl(value)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    dailyWaterMl === value
                      ? "border-aqua bg-aqua/10 text-aqua"
                      : "border-white/10 hover:border-white/25"
                  }`}
                >
                  {value} ml
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <PieChart className="text-acid" size={30} />
            <p className="eyebrow mt-5">{t("step", { current: 3, total: 4 })}</p>
            <h1 className="mt-2 text-3xl font-semibold">{t("macros.title")}</h1>
            <p className="mt-3 text-muted">{t("macros.description")}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <PresetButton onClick={() => applyPreset("balanced")}>
                {t("macros.presets.balanced")}
              </PresetButton>
              <PresetButton onClick={() => applyPreset("highProtein")}>
                {t("macros.presets.highProtein")}
              </PresetButton>
              <PresetButton onClick={() => applyPreset("highCarb")}>
                {t("macros.presets.highCarb")}
              </PresetButton>
            </div>

            <div className="mt-7 space-y-5">
              <MacroSlider
                label={t("macros.protein")}
                value={proteinPercentage}
                onChange={setProteinPercentage}
              />
              <MacroSlider
                label={t("macros.carbs")}
                value={carbsPercentage}
                onChange={setCarbsPercentage}
              />
              <MacroSlider
                label={t("macros.fat")}
                value={fatPercentage}
                onChange={setFatPercentage}
              />
            </div>

            <div
              className={`mt-6 rounded-2xl border p-4 text-center ${
                macroTotal === 100
                  ? "border-acid/30 bg-acid/5 text-acid"
                  : "border-red-400/30 bg-red-400/5 text-red-300"
              }`}
            >
              {t("macros.total")}: <strong>{macroTotal}%</strong>
            </div>
          </div>
        )}

        {step === 3 && targets && (
          <div>
            <p className="eyebrow">{t("step", { current: 4, total: 4 })}</p>
            <h1 className="mt-2 text-3xl font-semibold">{t("target.title")}</h1>
            <p className="mt-3 text-muted">{t("target.description")}</p>

            <div className="mt-7 rounded-3xl border border-acid/25 bg-acid/[.06] p-6 text-center">
              <p className="text-sm text-muted">{t("target.daily")}</p>
              <p className="mt-2 text-5xl font-semibold text-acid">
                {targets.targetCalories.toLocaleString(locale)}
              </p>
              <p className="mt-1 text-muted">kcal</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <TargetCard
                label={t("macros.protein")}
                value={`${targets.proteinGrams} g · ${proteinPercentage}%`}
              />
              <TargetCard
                label={t("macros.carbs")}
                value={`${targets.carbsGrams} g · ${carbsPercentage}%`}
              />
              <TargetCard
                label={t("macros.fat")}
                value={`${targets.fatGrams} g · ${fatPercentage}%`}
              />
              <TargetCard
                label={t("target.water")}
                value={`${targets.waterTargetMl.toLocaleString(locale)} ml`}
              />
            </div>

            <p className="mt-5 text-xs leading-5 text-muted">{t("target.disclaimer")}</p>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-red-400/25 bg-red-400/5 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            disabled={step === 0 || saving}
            className="flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm disabled:invisible"
          >
            <ArrowLeft size={16} /> {t("back")}
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-2 rounded-full bg-acid px-6 py-3 font-bold text-ink"
            >
              {t("continue")} <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={saving}
              className="rounded-full bg-acid px-7 py-3 font-bold text-ink disabled:opacity-60"
            >
              {saving ? t("saving") : t("start")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function PresetButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-white/10 px-4 py-2 text-sm transition hover:border-acid/50 hover:text-acid"
    >
      {children}
    </button>
  );
}

function MacroSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-[#101512] p-4">
      <span className="flex items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        <span className="rounded-full bg-white/[.06] px-3 py-1 text-sm">{value}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={70}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full accent-[#a8ff2a]"
      />
    </label>
  );
}

function TargetCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#101512] p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
