"use client";

import {
  Apple,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  FoodSearchResult,
  NutritionDayPayload,
  NutritionMeal,
} from "@/lib/nutrition/types";

const mealTypes = [
  "breakfast",
  "morning_snack",
  "lunch",
  "afternoon_snack",
  "dinner",
  "supper",
  "custom",
] as const;

const foodCategories = [
  "all",
  "sweets",
  "desserts",
  "beverages",
  "supplements",
  "custom",
] as const;

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function moveDate(value: string, amount: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  date.setDate(date.getDate() + amount);
  return localDateString(date);
}

function formatDate(value: string, locale: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(year, month - 1, day, 12));
}

export function MealsDashboard() {
  const locale = useLocale();
  const t = useTranslations("Meals");
  const foodT = useTranslations("FoodSearch");
  const waterT = useTranslations("WaterTracking");
  const [date, setDate] = useState(localDateString());
  const [day, setDay] = useState<NutritionDayPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMealForm, setShowMealForm] = useState(false);
  const [mealType, setMealType] = useState<(typeof mealTypes)[number]>("lunch");
  const [customMealName, setCustomMealName] = useState("");
  const [mealTime, setMealTime] = useState("");
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof foodCategories)[number]>("all");
  const [foods, setFoods] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [servings, setServings] = useState(1);
  const [customFoodOpen, setCustomFoodOpen] = useState(false);

  const loadDay = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/nutrition/day?date=${date}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as NutritionDayPayload & {
        error?: string;
      };

      if (!response.ok) throw new Error(result.error ?? t("errors.load"));
      setDay(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("errors.load"));
    } finally {
      setLoading(false);
    }
  }, [date, t]);

  useEffect(() => {
    void loadDay();
  }, [loadDay]);

  useEffect(() => {
    if (!selectedMealId) return;

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: query, category });
        const response = await fetch(`/api/nutrition/foods/search?${params}`);
        const result = (await response.json()) as {
          foods?: FoodSearchResult[];
          error?: string;
        };
        if (!response.ok) throw new Error(result.error ?? foodT("errors.search"));
        setFoods(result.foods ?? []);
      } catch (searchError) {
        setError(
          searchError instanceof Error ? searchError.message : foodT("errors.search"),
        );
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [category, foodT, query, selectedMealId]);

  const selectedMeal = useMemo(
    () => day?.meals.find((meal) => meal.id === selectedMealId) ?? null,
    [day, selectedMealId],
  );

  async function createMeal() {
    setError("");
    const response = await fetch("/api/nutrition/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        mealType,
        customName: mealType === "custom" ? customMealName : null,
        mealTime: mealTime || null,
      }),
    });
    const result = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !result.ok) {
      setError(result.error ?? t("errors.createMeal"));
      return;
    }
    setShowMealForm(false);
    setCustomMealName("");
    setMealTime("");
    await loadDay();
  }

  async function deleteMeal(id: string) {
    const response = await fetch(`/api/nutrition/meals/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError(t("errors.deleteMeal"));
      return;
    }
    await loadDay();
  }

  async function addFood() {
    if (!selectedMealId || !selectedFood || servings <= 0) return;

    const response = await fetch(`/api/nutrition/meals/${selectedMealId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        foodId: selectedFood.id,
        source: selectedFood.source,
        servings,
      }),
    });
    const result = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !result.ok) {
      setError(result.error ?? foodT("errors.add"));
      return;
    }

    setSelectedFood(null);
    setServings(1);
    setSelectedMealId(null);
    await loadDay();
  }

  async function removeFood(itemId: string) {
    const response = await fetch(`/api/nutrition/meal-items/${itemId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError(foodT("errors.remove"));
      return;
    }
    await loadDay();
  }

  async function addWater(amountMl: number) {
    const response = await fetch("/api/nutrition/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, amountMl }),
    });
    if (!response.ok) {
      setError(waterT("errors.add"));
      return;
    }
    await loadDay();
  }

  async function undoWater() {
    const latest = day?.waterLogs[0];
    if (!latest) return;
    const response = await fetch(`/api/nutrition/water/${latest.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError(waterT("errors.undo"));
      return;
    }
    await loadDay();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="mt-2 text-4xl font-semibold">{t("title")}</h1>
          <p className="mt-2 capitalize text-muted">{formatDate(date, locale)}</p>
        </div>
        <Link
          href="/nutrition/setup"
          className="rounded-full border border-white/10 px-4 py-2 text-sm hover:border-acid/40 hover:text-acid"
        >
          {t("editTargets")}
        </Link>
      </header>

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#090c0a] p-2">
        <button
          type="button"
          onClick={() => setDate((current) => moveDate(current, -1))}
          aria-label={t("previousDay")}
          className="grid size-10 place-items-center rounded-xl hover:bg-white/[.05]"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          onClick={() => setDate(localDateString())}
          className="rounded-full border border-white/10 px-4 py-2 text-sm"
        >
          {t("today")}
        </button>
        <button
          type="button"
          onClick={() => setDate((current) => moveDate(current, 1))}
          aria-label={t("nextDay")}
          className="grid size-10 place-items-center rounded-xl hover:bg-white/[.05]"
        >
          <ChevronRight />
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-400/25 bg-red-400/5 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading || !day ? (
        <div className="card p-8 text-center text-muted">{t("loading")}</div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <ProgressMetric
              label={t("calories")}
              current={Math.round(day.totals.calories)}
              target={day.targets.targetCalories}
              unit="kcal"
            />
            <ProgressMetric
              label={t("protein")}
              current={Math.round(day.totals.proteinG)}
              target={day.targets.proteinTargetG}
              unit="g"
            />
            <ProgressMetric
              label={t("carbs")}
              current={Math.round(day.totals.carbsG)}
              target={day.targets.carbsTargetG}
              unit="g"
            />
            <ProgressMetric
              label={t("fat")}
              current={Math.round(day.totals.fatG)}
              target={day.targets.fatTargetG}
              unit="g"
            />
            <ProgressMetric
              label={t("water")}
              current={Math.round(day.totals.waterMl)}
              target={day.targets.waterTargetMl}
              unit="ml"
              aqua
            />
          </section>

          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{waterT("title")}</h2>
                <p className="mt-1 text-sm text-muted">{waterT("description")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[200, 300, 500].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => void addWater(amount)}
                    className="rounded-full border border-aqua/25 px-4 py-2 text-sm text-aqua hover:bg-aqua/10"
                  >
                    +{amount} ml
                  </button>
                ))}
                {day.waterLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void undoWater()}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted"
                  >
                    {waterT("undo")}
                  </button>
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">{t("mealsTitle")}</h2>
                <p className="mt-1 text-sm text-muted">{t("mealsDescription")}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMealForm(true)}
                className="flex items-center gap-2 rounded-full bg-acid px-5 py-3 font-bold text-ink"
              >
                <Plus size={17} /> {t("addMeal")}
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {day.meals.length === 0 ? (
                <div className="card p-8 text-center">
                  <Apple className="mx-auto text-acid" />
                  <h3 className="mt-4 text-xl font-semibold">{t("emptyTitle")}</h3>
                  <p className="mt-2 text-muted">{t("emptyDescription")}</p>
                </div>
              ) : (
                day.meals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    label={
                      meal.meal_type === "custom"
                        ? meal.custom_name || t("mealTypes.custom")
                        : t(`mealTypes.${meal.meal_type}`)
                    }
                    onAdd={() => setSelectedMealId(meal.id)}
                    onDelete={() => void deleteMeal(meal.id)}
                    onRemoveItem={(id) => void removeFood(id)}
                    t={t}
                  />
                ))
              )}
            </div>
          </section>
        </>
      )}

      {showMealForm && (
        <Modal title={t("newMeal.title")} onClose={() => setShowMealForm(false)}>
          <label className="block text-sm">
            {t("newMeal.type")}
            <select
              value={mealType}
              onChange={(event) => setMealType(event.target.value as typeof mealType)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] p-3"
            >
              {mealTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`mealTypes.${type}`)}
                </option>
              ))}
            </select>
          </label>

          {mealType === "custom" && (
            <label className="mt-4 block text-sm">
              {t("newMeal.name")}
              <input
                value={customMealName}
                onChange={(event) => setCustomMealName(event.target.value)}
                maxLength={80}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] p-3"
              />
            </label>
          )}

          <label className="mt-4 block text-sm">
            {t("newMeal.time")}
            <input
              type="time"
              value={mealTime}
              onChange={(event) => setMealTime(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] p-3"
            />
          </label>

          <button
            type="button"
            onClick={() => void createMeal()}
            className="mt-6 w-full rounded-full bg-acid px-5 py-3 font-bold text-ink"
          >
            {t("newMeal.create")}
          </button>
        </Modal>
      )}

      {selectedMealId && selectedMeal && (
        <Modal
          title={foodT("title", {
            meal:
              selectedMeal.meal_type === "custom"
                ? selectedMeal.custom_name || t("mealTypes.custom")
                : t(`mealTypes.${selectedMeal.meal_type}`),
          })}
          wide
          onClose={() => {
            setSelectedMealId(null);
            setSelectedFood(null);
          }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={foodT("placeholder")}
              className="w-full rounded-2xl border border-white/10 bg-[#101512] py-4 pl-11 pr-4 outline-none focus:border-acid/50"
            />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {foodCategories.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
                  category === value
                    ? "border-acid bg-acid/10 text-acid"
                    : "border-white/10"
                }`}
              >
                {foodT(`categories.${value}`)}
              </button>
            ))}
          </div>

          <div className="mt-4 max-h-[48vh] space-y-2 overflow-y-auto pr-1">
            {searching ? (
              <p className="py-8 text-center text-muted">{foodT("searching")}</p>
            ) : foods.length === 0 ? (
              <p className="py-8 text-center text-muted">{foodT("empty")}</p>
            ) : (
              foods.map((food) => (
                <button
                  key={`${food.source}:${food.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedFood(food);
                    setServings(1);
                  }}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#090c0a] p-4 text-left hover:border-acid/30"
                >
                  <span className="min-w-0">
                    <strong className="block truncate">{food.name}</strong>
                    <span className="mt-1 block text-xs text-muted">
                      {food.servingDescription} · P {food.proteinG}g · C {food.carbsG}g · G {food.fatG}g
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold text-acid">{food.calories} kcal</span>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => setCustomFoodOpen(true)}
            className="mt-4 w-full rounded-full border border-white/10 px-5 py-3 text-sm hover:border-aqua/40 hover:text-aqua"
          >
            {foodT("createCustom")}
          </button>
        </Modal>
      )}

      {selectedFood && selectedMealId && (
        <Modal title={selectedFood.name} onClose={() => setSelectedFood(null)}>
          <p className="text-sm text-muted">{selectedFood.servingDescription}</p>
          <label className="mt-5 block text-sm">
            {foodT("servings")}
            <input
              type="number"
              min={0.1}
              max={100}
              step={0.1}
              value={servings}
              onChange={(event) => setServings(Number(event.target.value || 0))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] p-3 text-xl"
            />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <SmallMetric label="kcal" value={selectedFood.calories * servings} />
            <SmallMetric label="P" value={selectedFood.proteinG * servings} suffix="g" />
            <SmallMetric label="C" value={selectedFood.carbsG * servings} suffix="g" />
            <SmallMetric label="G" value={selectedFood.fatG * servings} suffix="g" />
          </div>
          <button
            type="button"
            onClick={() => void addFood()}
            className="mt-6 w-full rounded-full bg-acid px-5 py-3 font-bold text-ink"
          >
            {foodT("add")}
          </button>
        </Modal>
      )}

      {customFoodOpen && (
        <CustomFoodModal
          onClose={() => setCustomFoodOpen(false)}
          onCreated={async () => {
            setCustomFoodOpen(false);
            setQuery((current) => `${current} `);
          }}
          t={foodT}
        />
      )}
    </div>
  );
}

function ProgressMetric({
  label,
  current,
  target,
  unit,
  aqua = false,
}: {
  label: string;
  current: number;
  target: number | null;
  unit: string;
  aqua?: boolean;
}) {
  const locale = useLocale();
  const percentage = target ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div className="card p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold">
        {current.toLocaleString(locale)} / {target?.toLocaleString(locale) ?? "—"} {unit}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <span
          className={`block h-full rounded-full ${aqua ? "bg-aqua" : "bg-acid"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MealCard({
  meal,
  label,
  onAdd,
  onDelete,
  onRemoveItem,
  t,
}: {
  meal: NutritionMeal;
  label: string;
  onAdd: () => void;
  onDelete: () => void;
  onRemoveItem: (id: string) => void;
  t: ReturnType<typeof useTranslations<"Meals">>;
}) {
  const totals = meal.items.reduce(
    (sum, item) => ({
      calories: sum.calories + Number(item.calories || 0),
      protein: sum.protein + Number(item.protein_g || 0),
      carbs: sum.carbs + Number(item.carbs_g || 0),
      fat: sum.fat + Number(item.fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <article className="card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] p-5">
        <div>
          <h3 className="text-xl font-semibold">{label}</h3>
          <p className="mt-1 text-xs text-muted">
            {meal.meal_time ? meal.meal_time.slice(0, 5) : t("flexibleTime")} · {Math.round(totals.calories)} kcal
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 rounded-full bg-acid px-4 py-2 text-sm font-bold text-ink"
          >
            <Plus size={15} /> {t("addFood")}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={t("deleteMeal")}
            className="grid size-9 place-items-center rounded-full border border-white/10 text-muted hover:text-red-300"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {meal.items.length === 0 ? (
        <p className="p-5 text-sm text-muted">{t("emptyMeal")}</p>
      ) : (
        <div className="divide-y divide-white/[.06]">
          {meal.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{item.food_name_snapshot}</p>
                <p className="mt-1 text-xs text-muted">
                  {item.quantity}× {item.serving_description_snapshot ?? item.unit} · P {Number(item.protein_g).toFixed(1)}g · C {Number(item.carbs_g).toFixed(1)}g · G {Number(item.fat_g).toFixed(1)}g
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-semibold text-acid">{Math.round(Number(item.calories))} kcal</span>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  aria-label={t("removeFood")}
                  className="text-muted hover:text-red-300"
                >
                  <X size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-black/75 p-0 backdrop-blur-sm sm:place-items-center sm:p-5">
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#080b09] p-5 shadow-2xl sm:rounded-3xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}>
        <header className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full border border-white/10"
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

function SmallMetric({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 p-3 text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-semibold">{value.toFixed(1)}{suffix}</p>
    </div>
  );
}

function CustomFoodModal({
  onClose,
  onCreated,
  t,
}: {
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  t: ReturnType<typeof useTranslations<"FoodSearch">>;
}) {
  const [name, setName] = useState("");
  const [servingDescription, setServingDescription] = useState("100 g");
  const [servingSize, setServingSize] = useState(100);
  const [servingUnit, setServingUnit] = useState("g");
  const [calories, setCalories] = useState(0);
  const [proteinG, setProteinG] = useState(0);
  const [carbsG, setCarbsG] = useState(0);
  const [fatG, setFatG] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError("");
    const response = await fetch("/api/nutrition/custom-foods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        servingDescription,
        servingSize,
        servingUnit,
        calories,
        proteinG,
        carbsG,
        fatG,
      }),
    });
    const result = (await response.json()) as { ok?: boolean; error?: string };
    setSaving(false);
    if (!response.ok || !result.ok) {
      setError(result.error ?? t("errors.custom"));
      return;
    }
    await onCreated();
  }

  return (
    <Modal title={t("custom.title")} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("custom.name")} value={name} onChange={setName} />
        <Field label={t("custom.serving")} value={servingDescription} onChange={setServingDescription} />
        <NumberField label={t("custom.size")} value={servingSize} onChange={setServingSize} />
        <Field label={t("custom.unit")} value={servingUnit} onChange={setServingUnit} />
        <NumberField label={t("custom.calories")} value={calories} onChange={setCalories} />
        <NumberField label={t("custom.protein")} value={proteinG} onChange={setProteinG} />
        <NumberField label={t("custom.carbs")} value={carbsG} onChange={setCarbsG} />
        <NumberField label={t("custom.fat")} value={fatG} onChange={setFatG} />
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving || name.trim().length < 2}
        className="mt-5 w-full rounded-full bg-acid px-5 py-3 font-bold text-ink disabled:opacity-50"
      >
        {saving ? t("custom.saving") : t("custom.save")}
      </button>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] p-3"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-sm">
      {label}
      <input
        type="number"
        min={0}
        step="any"
        value={value}
        onChange={(event) => onChange(Number(event.target.value || 0))}
        className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] p-3"
      />
    </label>
  );
}
