import AppShell from "@/components/app-shell";
import { startWorkout } from "@/app/internal-actions";
import { SaveButton } from "@/components/internal-form";
import { createClient } from "@/lib/supabase/server";
import { calculateStreak } from "@/lib/training/streak";
import { logSupabaseError } from "@/lib/supabase/errors";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Flame,
  HeartPulse,
} from "lucide-react";
import { exerciseName,workoutFocus,workoutName } from "@/lib/i18n/workout-content";

type TodayWorkout = {
  id: string;
  name: string;
  name_key:string|null;
  focus: string | null;
  focus_key:string|null;
  estimated_minutes: number | null;
  scheduled_time: string | null;
  exercises: Array<{
    id: string;
    name: string;
    name_key:string|null;
  }>;
};

const localeMap = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
} as const;

function getFormattedLocale(locale: string) {
  return localeMap[
    locale as keyof typeof localeMap
  ] ?? "pt-BR";
}

function getWeekdayName(
  weekday: number,
  locale: string,
) {
  const referenceDate = new Date(
    Date.UTC(2024, 0, 7 + weekday),
  );

  return new Intl.DateTimeFormat(
    getFormattedLocale(locale),
    {
      weekday: "long",
      timeZone: "UTC",
    },
  ).format(referenceDate);
}

export default async function TodayPage() {
  const db = await createClient();
  const locale = await getLocale();
  const t = await getTranslations("Today");
  const contentT = await getTranslations("WorkoutContent");

  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const weekStart = new Date(now);
  weekStart.setDate(
    now.getDate() - now.getDay(),
  );
  weekStart.setHours(0, 0, 0, 0);

  const [
    profileResult,
    planResult,
    sessionResult,
    recoveryResult,
  ] = await Promise.all([
    db
      .from("profiles")
      .select("full_name,username")
      .eq("id", user.id)
      .maybeSingle(),

    db
      .from("workout_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle(),

    db
      .from("workout_sessions")
      .select(
        "id,workout_id,status,scheduled_date,duration_minutes,total_volume_kg",
      )
      .eq("user_id", user.id)
      .order("scheduled_date", {
        ascending: false,
      }),

    db
      .from("recovery_checkins")
      .select("readiness_score,recommendation")
      .eq("user_id", user.id)
      .eq("checkin_date", today)
      .maybeSingle(),
  ]);

  for (const [context, result] of [
    ["Profile", profileResult],
    ["Plan", planResult],
    ["Sessions", sessionResult],
    ["Recovery", recoveryResult],
  ] as const) {
    if (result.error) {
      logSupabaseError(context, result.error);
    }
  }

  const plan = planResult.data;

  const workoutResult = plan
    ? await db
        .from("workouts")
        .select(
          "id,name,name_key,focus,focus_key,estimated_minutes,scheduled_weekday,scheduled_time,exercises(id,name,name_key)",
        )
        .eq("plan_id", plan.id)
        .order("scheduled_weekday")
    : {
        data: [],
        error: null,
      };

  if (workoutResult.error) {
    logSupabaseError(
      "Workout schedule",
      workoutResult.error,
    );
  }

  const workouts = (workoutResult.data ??
    []) as unknown as Array<
    TodayWorkout & {
      scheduled_weekday: number;
    }
  >;

  const workout = workouts.find(
    (item) =>
      item.scheduled_weekday === now.getDay(),
  );

  const sessions = sessionResult.data ?? [];

  const todaySession = workout
    ? sessions.find(
        (item) =>
          item.workout_id === workout.id &&
          item.scheduled_date === today,
      )
    : null;

  const completedDates = sessions
    .filter(
      (item) => item.status === "completed",
    )
    .map((item) => item.scheduled_date);

  const streak = calculateStreak(
    completedDates,
    now,
  );

  const completedThisWeek = sessions.filter(
    (item) =>
      item.status === "completed" &&
      Date.parse(item.scheduled_date) >=
        weekStart.getTime(),
  ).length;

  const plannedThisWeek = workouts.length;

  const nextWorkout = workouts
    .filter(
      (item) =>
        item.scheduled_weekday !== now.getDay(),
    )
    .sort(
      (a, b) =>
        ((a.scheduled_weekday -
          now.getDay() +
          7) %
          7) -
        ((b.scheduled_weekday -
          now.getDay() +
          7) %
          7),
    )[0];

  const name = String(
    profileResult.data?.full_name ??
      profileResult.data?.username ??
      user.email?.split("@")[0] ??
      t("athleteFallback"),
  ).trim().split(/\s+/)[0] || t("athleteFallback");

  const formattedDate =
    new Intl.DateTimeFormat(
      getFormattedLocale(locale),
      {
        weekday: "long",
        day: "numeric",
        month: "long",
      },
    ).format(now);

  const nextWorkoutDay = nextWorkout
    ? getWeekdayName(
        nextWorkout.scheduled_weekday,
        locale,
      )
    : "";

  return (
    <AppShell>
      <div className="space-y-7">
        <header>
          <p className="eyebrow">
            {formattedDate}
          </p>

          <h1 className="mt-2 text-4xl font-semibold">
            {name
              ? t("helloName", { name })
              : t("hello")}
          </h1>

          <p className="mt-2 text-muted">
            {workout
              ? t("scheduledMessage")
              : t("recoveryMessage")}
          </p>
        </header>

        {workout ? (
          <section className="relative overflow-hidden rounded-3xl border border-acid/30 bg-gradient-to-br from-acid/[0.13] to-raised p-6 sm:p-8">
            <div className="absolute right-5 top-5 hidden text-acid/20 sm:block">
              <CalendarDays size={100} />
            </div>

            <p className="text-sm font-semibold text-acid">
              {t("todaysWorkout")}
            </p>

            <h2 className="mt-3 text-3xl font-semibold">
              {workoutName(contentT,workout.name_key,workout.name)}
            </h2>

            <p className="mt-3 text-muted">
              {t("exercises", {
                count: workout.exercises.length,
              })}

              {" · "}

              {workout.estimated_minutes
                ? t("minutes", {
                    count:
                      workout.estimated_minutes,
                  })
                : t("durationNotProvided")}

              {workout.scheduled_time
                ? ` · ${workout.scheduled_time.slice(
                    0,
                    5,
                  )}`
                : ""}
            </p>

            <p className="mt-1">
              {workoutFocus(contentT,workout.focus_key,workout.focus??"") ||
                t("muscleFocusNotProvided")}
            </p>

            <div className="mt-7">
              {todaySession ? (
                <a
                  href={`/workouts/session/${todaySession.id}`}
                  className="inline-block rounded-full bg-acid px-7 py-4 text-lg font-bold text-ink"
                >
                  {todaySession.status ===
                  "completed"
                    ? t("viewCompletedWorkout")
                    : t("continueWorkout")}
                </a>
              ) : (
                <form
                  action={startWorkout.bind(
                    null,
                    workout.id,
                    plan!.id,
                  )}
                >
                  <SaveButton>
                    {t("startWorkout")}
                  </SaveButton>
                </form>
              )}
            </div>
          </section>
        ) : (
          <section className="card p-7">
            <HeartPulse
              className="text-aqua"
              size={34}
            />

            <h2 className="mt-4 text-2xl font-semibold">
              {t("recoveryDayTitle")}
            </h2>

            <p className="mt-2 text-muted">
              {nextWorkout
                ? t("nextWorkoutScheduled", {
                    name: nextWorkout.name,
                    day: nextWorkoutDay,
                  })
                : t("noOtherWorkout")}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="/recovery"
                className="rounded-full bg-acid px-5 py-3 font-bold text-ink"
              >
                {t("completeCheckin")}
              </a>

              <a
                href="/training/new"
                className="rounded-full border border-white/10 px-5 py-3"
              >
                {t("createExtraWorkout")}
              </a>
            </div>
          </section>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <section className="card p-5">
            <Flame className="text-warning" />

            <p className="mt-4 text-sm text-muted">
              {t("currentStreak")}
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {t("days", {
                count: streak.current,
              })}
            </p>

            <p className="mt-2 text-xs text-muted">
              {t("bestStreak", {
                count: streak.best,
              })}

              {" · "}

              {streak.trainedToday
                ? t("workoutCompletedToday")
                : t(
                    "streakMayIncludeYesterday",
                  )}
            </p>
          </section>

          <section className="card p-5">
            <CheckCircle2 className="text-acid" />

            <p className="mt-4 text-sm text-muted">
              {t("weeklyProgress")}
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {t("completedOfPlanned", {
                completed: completedThisWeek,
                planned: plannedThisWeek,
              })}
            </p>

            <p className="mt-2 text-xs text-muted">
              {plannedThisWeek
                ? t("plannedCompleted", {
                    percent: Math.round(
                      (completedThisWeek /
                        plannedThisWeek) *
                        100,
                    ),
                  })
                : t("createSchedule")}
            </p>
          </section>

          <section className="card p-5">
            <HeartPulse className="text-aqua" />

            <p className="mt-4 text-sm text-muted">
              {t("todaysRecovery")}
            </p>

            <p className="mt-1 text-3xl font-semibold">
              {recoveryResult.data
                ? `${recoveryResult.data.readiness_score}/100`
                : t("noCheckin")}
            </p>

            <p className="mt-2 text-xs text-muted">
              {recoveryResult.data
                ?.recommendation ??
                t("checkinRecommendation")}
            </p>
          </section>
        </div>

        <section className="card p-5">
          <p className="text-sm text-muted">
            {t("recommendedNextAction")}
          </p>

          <p className="mt-2 font-semibold">
            {workout && !todaySession
              ? t("startWhenReady", {
                  name: workout.name,
                })
              : workout &&
                  todaySession?.status ===
                    "in_progress"
                ? t("continueSession", {
                    name: workout.name,
                  })
                : !recoveryResult.data
                  ? t("recordRecovery")
                  : nextWorkout
                    ? t("nextWorkout", {
                        name:
                          nextWorkout.name,
                        day: nextWorkoutDay,
                      })
                    : t("buildNextWeek")}
          </p>
        </section>
      </div>
    </AppShell>
  );
}
