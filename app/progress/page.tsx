import AppShell from "@/components/app-shell";
import { Field, SaveButton } from "@/components/internal-form";
import { ProgressCharts } from "@/components/progress-charts";
import { ProgressPhoto } from "@/components/progress-photo";
import { FormModal } from "@/components/form-modal";
import { createClient } from "@/lib/supabase/server";
import { saveProgress } from "../internal-actions";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { formatNumber } from "@/lib/i18n/formatters";
import { getCurrentUserEntitlements } from "@/lib/billing/current-entitlements";
export default async function Progress({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const t = await getTranslations("Progress");
  const locale = await getLocale();
  const { entitlements } = await getCurrentUserEntitlements();
  const historySince = entitlements.progressHistoryDays
    ? new Date(Date.now()-entitlements.progressHistoryDays*86400000).toISOString().slice(0,10)
    : "1970-01-01";
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const [entries, sessions, logs] = await Promise.all([
    db
      .from("progress_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("recorded_at", historySince)
      .order("recorded_at"),
    db
      .from("workout_sessions")
      .select("scheduled_date,total_volume_kg")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("scheduled_date", historySince)
      .order("scheduled_date"),
    db
      .from("workout_set_logs")
      .select("weight_kg,exercise_id,created_at,exercises(name)")
      .eq("user_id", user.id)
      .eq("completed", true)
      .gte("created_at", `${historySince}T00:00:00Z`)
      .order("created_at"),
  ]);
  for (const r of [entries, sessions, logs])
    if (r.error)
      console.error({
        message: r.error.message,
        code: r.error.code,
        details: r.error.details,
        hint: r.error.hint,
      });
  const data = entries.data ?? [],
    first = data[0],
    last = data.at(-1);
  const strengthMap = new Map<string, { name: string; weight: number }>();
  const firstLoads = new Map<string, number>();
  for (const row of logs.data ?? []) {
    const ex = row.exercises as unknown as { name: string } | null,
      key = row.exercise_id,
      current = strengthMap.get(key),
      weight = Number(row.weight_kg || 0);
    if (weight > 0 && !firstLoads.has(key)) firstLoads.set(key, weight);
    if (!current || weight > current.weight)
      strengthMap.set(key, { name: ex?.name ?? t("exerciseFallback"), weight });
  }
  const increased = [...strengthMap.entries()].filter(([key, item]) => item.weight > (firstLoads.get(key) ?? item.weight)).length;
  const last28 = Date.now() - 28 * 86400000;
  const trainingDays = new Set((sessions.data ?? []).filter((item) => Date.parse(item.scheduled_date) >= last28).map((item) => item.scheduled_date)).size;
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="mt-2 text-4xl font-semibold">
            {t("title")}
          </h1>
        </div>
        {(await searchParams).saved && (
          <p className="rounded-xl bg-acid/10 p-3 text-acid">
            {t("saved")}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card
            t={t("weightTrend")}
            v={
              first?.weight_kg != null && last?.weight_kg != null
                ? `${formatNumber(last.weight_kg-first.weight_kg,locale,{minimumFractionDigits:1,maximumFractionDigits:1})} kg`
                : t("noComparison")
            }
          />
          <Card
            t={t("strengthProgress")}
            v={t("exercisesImproved",{count:increased})}
          />
          <Card
            t={t("bodyMeasurements")}
            v={t("records",{count:data.filter((x) => x.waist_cm || x.chest_cm || x.hip_cm).length})}
          />
          <Card t={t("frequency")} v={t("daysPerWeek",{count:formatNumber(trainingDays/4,locale,{maximumFractionDigits:1})})} />
          <Card t={t("trackedRecords")} v={t("highestLoads",{count:strengthMap.size})} />
        </div>
        {!data.length && (
          <p className="card p-6 text-muted">
            {t("firstMeasurementHint")}
          </p>
        )}
        <ProgressCharts
          points={data.map((x) => ({
            date: x.recorded_at,
            weight: x.weight_kg,
            waist: x.waist_cm,
            chest: x.chest_cm,
            arm: x.arm_cm,
            thigh: x.thigh_cm,
            hip: x.hip_cm,
          }))}
          volume={(sessions.data ?? []).map((x) => ({
            date: x.scheduled_date,
            volume: Number(x.total_volume_kg),
          }))}
          strength={[...strengthMap.values()]}
        />
        <FormModal button={t("addMeasurement")} title={t("newRecord")}>
          <form
            action={saveProgress}
            className="card grid gap-4 p-6 md:grid-cols-3"
          >
            <Field name="recorded_at" label={t("date")} type="date" required />
            <Field name="weight_kg" label={t("bodyWeight")} required />
            <Field name="body_fat_percentage" label={t("bodyFat")} />
            <Field name="waist_cm" label={t("waist")} />
            <Field name="chest_cm" label={t("chest")} />
            <Field name="arm_cm" label={t("arms")} />
            <Field name="thigh_cm" label={t("thighs")} />
            <Field name="hip_cm" label={t("hips")} />
            <Field name="notes" label={t("notes")} type="text" />
            <ProgressPhoto userId={user.id} />
            <div className="self-end">
              <SaveButton>{t("saveRecord")}</SaveButton>
            </div>
          </form>
        </FormModal>
      </div>
    </AppShell>
  );
}
function Card({ t, v }: { t: string; v: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-muted">{t}</p>
      <p className="mt-3 text-xl font-semibold">{v}</p>
    </div>
  );
}
