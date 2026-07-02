import AppShell from "@/components/app-shell";
import { CreateMenu } from "@/components/training/create-menu";
import { MobileBottomNavigation } from "@/components/training/mobile-bottom-navigation";
import { WorkoutStatRing } from "@/components/training/workout-stat-ring";
import { WorkoutSummaryCard } from "@/components/training/workout-summary-card";
import { WorkoutsMobileHeader } from "@/components/training/workouts-mobile-header";
import { WorkoutsWeekStrip } from "@/components/training/workouts-week-strip";
import { logSupabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import {
  buildWeek,
  decorativeProgress,
  parseDateKey,
  toDateKey,
} from "@/lib/training/workouts-dashboard";
import { calculateStreak } from "@/lib/training/streak";
import { CalendarDays, Dumbbell } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { exerciseName,workoutFocus,workoutName } from "@/lib/i18n/workout-content";

type WorkoutView = {
  id: string;
  name: string;
  focus: string | null;
  name_key:string|null;
  focus_key:string|null;
  estimated_minutes: number | null;
  scheduled_weekday: number | null;
  status:string;
  exercises: Array<{ id: string; name: string;name_key:string|null }>;
};

type SearchParams = Promise<{ date?: string; q?: string; generated?: string }>;

export default async function WorkoutsPage({ searchParams }: { searchParams: SearchParams }) {
  const { date, q = "", generated } = await searchParams;
  const selected = parseDateKey(date);
  const selectedKey = toDateKey(selected);
  const t = await getTranslations("Training");
  const contentT = await getTranslations("WorkoutContent");
  const locale = await getLocale();
  const dateLocale = locale.startsWith("en") ? "en-US" : locale.startsWith("es") ? "es-ES" : "pt-BR";
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  const { data: plan, error: planError } = await db.from("workout_plans").select("*").eq("user_id", user.id).eq("is_active", true).maybeSingle();
  if (planError) logSupabaseError("Active plan", planError);

  const [workoutResult, sessionResult] = await Promise.all([
    plan
      ? db.from("workouts").select("id,name,name_key,focus,focus_key,estimated_minutes,scheduled_weekday,status,exercises(id,name,name_key)").eq("plan_id", plan.id).order("position")
      : Promise.resolve({ data: [], error: null }),
    db.from("workout_sessions").select("id,status,scheduled_date,duration_minutes,total_volume_kg,calories,sets_completed,workout_id").eq("user_id", user.id).order("scheduled_date", { ascending: false }).limit(180),
  ]);
  if (workoutResult.error) logSupabaseError("Workouts", workoutResult.error);
  if (sessionResult.error) logSupabaseError("Sessions", sessionResult.error);

  const workouts = (workoutResult.data ?? []) as unknown as WorkoutView[];
  const sessions = sessionResult.data ?? [];
  const selectedSessions = sessions.filter((session) => session.scheduled_date === selectedKey);
  const sessionIds = selectedSessions.map((session) => session.id);
  const logResult = sessionIds.length
    ? await db.from("workout_set_logs").select("session_id,weight_kg,repetitions,is_completed").in("session_id", sessionIds).eq("is_completed", true)
    : { data: [], error: null };
  if (logResult.error) logSupabaseError("Daily sets", logResult.error);
  const logs = logResult.data ?? [];

  const query = q.trim().toLocaleLowerCase();
  const dayWorkouts = workouts.filter((workout) => workout.scheduled_weekday === selected.getDay()).filter((workout) => !query || workoutName(contentT,workout.name_key,workout.name).toLocaleLowerCase().includes(query) || workout.exercises.some((exercise) => exerciseName(contentT,exercise.name_key,exercise.name).toLocaleLowerCase().includes(query)));
  const duration = selectedSessions.reduce((sum, item) => sum + Number(item.duration_minutes || 0), 0);
  const calories = Math.round(selectedSessions.reduce((sum, item) => sum + Number(item.calories || 0), 0) || duration * 6);
  const volume = Math.round(selectedSessions.reduce((sum, item) => sum + Number(item.total_volume_kg || 0), 0) || logs.reduce((sum, item) => sum + Number(item.weight_kg || 0) * Number(item.repetitions || 0), 0));
  const sets = selectedSessions.reduce((sum, item) => sum + Number(item.sets_completed || 0), 0) || logs.length;
  const reps = logs.reduce((sum, item) => sum + Number(item.repetitions || 0), 0);
  const completedDates = sessions.filter((session) => session.status === "completed").map((session) => session.scheduled_date);
  const streak = calculateStreak(completedDates);
  const todayKey = toDateKey(new Date());
  const week = buildWeek(selected).map((day) => ({
    date: toDateKey(day),
    label: new Intl.DateTimeFormat(dateLocale, { weekday: "short" }).format(day).replace(".", ""),
    number: String(day.getDate()),
    isToday: toDateKey(day) === todayKey,
    hasWorkout: workouts.some((workout) => workout.scheduled_weekday === day.getDay()),
    completed: completedDates.includes(toDateKey(day)),
  }));
  const note = calories || volume || sets || reps ? t("recorded") : t("firstWorkout");

  return (
    <AppShell hideMobileHeader>
      <div className="mx-auto max-w-5xl space-y-6 pb-28 lg:pb-8">
        <WorkoutsMobileHeader title={t("screenTitle")} streak={streak.current} searchPlaceholder={t("searchPlaceholder")} defaultQuery={q} />
        <header className="hidden items-end justify-between gap-4 lg:flex">
          <div><p className="eyebrow">{t("eyebrow")}</p><h1 className="mt-2 text-4xl font-semibold">{t("screenTitle")}</h1></div>
          <CreateMenu />
        </header>

        <WorkoutsWeekStrip days={week} selectedDate={selectedKey} query={q} ariaLabel={t("weekNavigation")} />
        {generated==="1"&&<p role="status" className="rounded-2xl border border-acid/25 bg-acid/[.08] p-4 text-sm font-semibold text-acid">Seu treino foi criado com sucesso.</p>}

        <section className="grid grid-cols-4 gap-2 rounded-[28px] border border-white/[0.07] bg-black/20 px-2 py-5 sm:gap-5 sm:px-5">
          <WorkoutStatRing label={t("calories")} value={String(calories)} progress={decorativeProgress(calories, 500)} note={note} />
          <WorkoutStatRing label={t("volume")} value={String(volume)} progress={decorativeProgress(volume, 5000)} note={note} />
          <WorkoutStatRing label={t("sets")} value={String(sets)} progress={decorativeProgress(sets, 20)} note={note} />
          <WorkoutStatRing label={t("repetitions")} value={String(reps)} progress={decorativeProgress(reps, 200)} note={note} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div><p className="eyebrow">{t("selectedDate")}</p><h2 className="mt-1 text-2xl font-semibold">{new Intl.DateTimeFormat(dateLocale, { weekday: "long", day: "2-digit", month: "long" }).format(selected)}</h2></div>
            <CalendarDays className="hidden text-muted sm:block" />
          </div>

          {dayWorkouts.length ? dayWorkouts.map((workout) => {
            const session = selectedSessions.find((item) => item.workout_id === workout.id);
            const href = session ? `/workouts/session/${session.id}` : selectedKey === todayKey ? "/workouts/today" : null;
            return <WorkoutSummaryCard key={workout.id} title={workoutName(contentT,workout.name_key,workout.name)} duration={`${workout.estimated_minutes ?? "—"} ${t("min")}`} exercises={workout.exercises.map((exercise) => exerciseName(contentT,exercise.name_key,exercise.name))} exerciseCountLabel={t("exercises",{count:workout.exercises.length})} statusLabel={session?.status==="completed"?t("status.completed"):t("status.scheduled")} focus={workoutFocus(contentT,workout.focus_key,workout.focus??"")} href={href} openLabel={session ? t("openWorkout") : t("startWorkout")} createLabel={t("newWorkout")} />;
          }) : (
            <div className="rounded-[28px] border border-white/10 bg-[#070a08] p-7 text-center">
              <Dumbbell className="mx-auto text-muted" size={34} />
              <h2 className="mt-4 text-xl font-semibold">{query ? t("noSearchResults") : t("noWorkoutForDay")}</h2>
              <p className="mt-2 text-sm text-muted">{query ? t("tryAnotherSearch") : t("addWorkoutForDay")}</p>
              {!query&&<div className="mx-auto mt-6 flex max-w-md flex-col justify-center gap-3 sm:flex-row"><CreateMenu label={t("createWorkout")}/><Link href={`/workouts?date=${week[0].date}`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold">{t("viewFullWeek")}</Link></div>}
            </div>
          )}

          <CreateMenu variant="outline" label={t("newWorkout")} />
        </section>
      </div>
      <CreateMenu variant="fab" label={t("newWorkout")} />
      <MobileBottomNavigation />
    </AppShell>
  );
}
