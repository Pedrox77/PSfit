"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { manualWorkoutSchema } from "@/lib/validations/workout";
import {
  generateDefaultWorkoutPlan,
  type TrainingInput,
} from "@/lib/onboarding/generate-default-workout";
import { buildTrainingSchedule } from "@/lib/training/schedule";
import { normalizeCoachingStyle, normalizePreferredTime } from "@/lib/training/preference-values";
import { importedWorkoutSchema } from "@/lib/validations/workout";
import { getUserEntitlements } from "@/lib/billing/entitlements";

async function auth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("plan,plan_status").eq("id",user.id).single();
  if (profileError) throw profileError;
  return { supabase, user, entitlements: getUserEntitlements(profile) };
}
function fail(error: {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}): never {
  console.error({
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
  throw new Error(error.message);
}
const numberOrNull = (value: FormDataEntryValue | null) =>
  value === null || value === "" ? null : Number(value);

export async function saveProgress(form: FormData) {
  const { supabase, user } = await auth();
  const { error } = await supabase.from("progress_entries").upsert(
    {
      user_id: user.id,
      recorded_at: String(form.get("recorded_at")),
      weight_kg: numberOrNull(form.get("weight_kg")),
      body_fat_percentage: numberOrNull(form.get("body_fat_percentage")),
      waist_cm: numberOrNull(form.get("waist_cm")),
      chest_cm: numberOrNull(form.get("chest_cm")),
      arm_cm: numberOrNull(form.get("arm_cm")),
      thigh_cm: numberOrNull(form.get("thigh_cm")),
      hip_cm: numberOrNull(form.get("hip_cm")),
      notes: String(form.get("notes") || ""),
      photo_path: String(form.get("photo_path") || "") || null,
    },
    { onConflict: "user_id,recorded_at" },
  );
  if (error) fail(error);
  revalidatePath("/progress");
  redirect("/progress?saved=1");
}
export async function saveRecovery(form: FormData) {
  const { supabase, user, entitlements } = await auth();
  const checkinDate=String(form.get("checkin_date"));
  const target=new Date(`${checkinDate}T12:00:00Z`),day=target.getUTCDay();
  const start=new Date(target);start.setUTCDate(target.getUTCDate()-((day+6)%7));
  const end=new Date(start);end.setUTCDate(start.getUTCDate()+6);
  const {count,error:countError}=await supabase.from("recovery_checkins").select("id",{count:"exact",head:true}).eq("user_id",user.id).gte("checkin_date",start.toISOString().slice(0,10)).lte("checkin_date",end.toISOString().slice(0,10)).neq("checkin_date",checkinDate);
  if(countError)fail(countError);
  if((count??0)>=entitlements.maxRecoveryCheckinsPerWeek)throw new Error("RECOVERY_LIMIT_REACHED");
  const sleep = Number(form.get("sleep_hours")),
    quality = Number(form.get("sleep_quality"));
  const energy = Number(form.get("energy_level")),
    soreness = Number(form.get("muscle_soreness")),
    stress = Number(form.get("stress_level"));
  const score = Math.round(
    Math.min(sleep / 8, 1) * 20 +
      (quality / 5) * 20 +
      (energy / 5) * 25 +
      ((6 - soreness) / 5) * 20 +
      ((6 - stress) / 5) * 15,
  );
  const recommendation =
    score >= 80
      ? "Boa prontidão. Treino planejado liberado."
      : score >= 60
        ? "Prontidão moderada. Mantenha o treino, mas controle a intensidade."
        : score >= 40
          ? "Recuperação limitada. Reduza volume ou carga."
          : "Priorize descanso e recuperação.";
  const { error } = await supabase.from("recovery_checkins").upsert(
    {
      user_id: user.id,
      checkin_date: checkinDate,
      sleep_hours: sleep,
      sleep_quality: quality,
      energy_level: energy,
      muscle_soreness: soreness,
      stress_level: stress,
      has_pain: form.get("has_pain") === "on",
      pain_location: String(form.get("pain_location") || ""),
      notes: String(form.get("notes") || ""),
      readiness_score: score,
      recommendation,
    },
    { onConflict: "user_id,checkin_date" },
  );
  if (error) fail(error);
  revalidatePath("/recovery");
  redirect("/recovery?saved=1");
}
export async function startWorkout(workoutId: string, planId: string) {
  const { supabase, user } = await auth();
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing, error: lookupError } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("workout_id", workoutId)
    .eq("scheduled_date", today)
    .maybeSingle();
  if (lookupError) fail(lookupError);
  if (existing) redirect(`/workouts/session/${existing.id}`);
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      workout_id: workoutId,
      plan_id: planId,
      scheduled_date: today,
      status: "in_progress",
      started_at: new Date().toISOString(),
      completed_at: null,
      duration_minutes: null,
      total_volume_kg: 0,
      calories: null,
      perceived_effort: null,
      sets_completed: 0,
      exercises_completed: 0,
      notes: null,
    })
    .select("id")
    .single();
  if (error || !data)
    fail(error ?? { message: "Não foi possível iniciar o treino." });
  if (!data) throw new Error("Não foi possível iniciar o treino.");
  redirect(`/workouts/session/${data.id}`);
}

export async function saveManualWorkout(form: FormData) {
  const { supabase, user, entitlements } = await auth();
  const parsed = manualWorkoutSchema.parse(
    JSON.parse(String(form.get("payload"))),
  );
  let { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (planError) fail(planError);
  if (!plan) {
    const created = await supabase
      .from("workout_plans")
      .upsert(
        {
          user_id: user.id,
          name: "Meus treinos",
          goal: null,
          experience_level: null,
          days_per_week: 2,
          session_duration: parsed.estimated_minutes,
          is_active: true,
          source: "manual",
        },
        { onConflict: "user_id,source" },
      )
      .select("id")
      .single();
    if (created.error || !created.data)
      fail(created.error ?? { message: "Não foi possível criar o plano." });
    plan = created.data;
  }
  const {count:allWorkouts,error:allError}=await supabase.from("workouts").select("id",{count:"exact",head:true}).eq("plan_id",plan.id);
  if(allError)fail(allError);
  if((allWorkouts??0)>=entitlements.maxWeeklyWorkouts)throw new Error("WEEKLY_WORKOUT_LIMIT_REACHED");
  const { data: positions, error: positionError } = await supabase
    .from("workouts")
    .select("position")
    .eq("plan_id", plan.id)
    .order("position", { ascending: false })
    .limit(1);
  if (positionError) fail(positionError);
  const position = (positions?.[0]?.position ?? -1) + 1;
  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      plan_id: plan.id,
      name: parsed.name,
      description: parsed.description,
      focus: parsed.focus,
      estimated_minutes: parsed.estimated_minutes,
      difficulty: parsed.difficulty,
      scheduled_weekday: parsed.scheduled_weekday,
      scheduled_time: parsed.scheduled_time,
      status: "scheduled",
      is_custom: true,
      position,
    })
    .select("id")
    .single();
  if (error || !workout)
    fail(error ?? { message: "Não foi possível salvar o treino." });
  const rows = parsed.exercises.map((exercise, index) => ({
    ...exercise,
    workout_id: workout.id,
    position: index,
    primary_muscles: [],
    secondary_muscles: [],
    equipment: null,
    video_url: null,
    video_thumbnail_url: null,
    muscle_group: null,
  }));
  const inserted = await supabase.from("exercises").insert(rows);
  if (inserted.error) {
    await supabase.from("workouts").delete().eq("id", workout.id);
    fail(inserted.error);
  }
  revalidatePath("/workouts");
  redirect("/workouts?saved=1");
}

export async function buildPsfitPlan(form: FormData) {
  const { supabase, user, entitlements } = await auth();
  const input = JSON.parse(String(form.get("payload"))) as TrainingInput;
  const preferredTime=normalizePreferredTime(input.preferred_time);
  const coachingStyle=normalizeCoachingStyle(input.coaching_style);
  if(!Number.isInteger(input.days_per_week)||input.days_per_week<2||input.days_per_week>6)throw new Error("Escolha entre 2 e 6 dias por semana.");
  if(!Array.isArray(input.preferred_days)||new Set(input.preferred_days).size!==input.days_per_week)throw new Error("Selecione exatamente a quantidade de dias definida.");
  if(!input.primary_goal||!input.experience_level||!input.training_location||!input.equipment?.length)throw new Error("Preencha todas as informações obrigatórias.");
  if(input.preferred_time&&!preferredTime)throw new Error("Informe um horário válido no formato HH:MM.");
  if(!coachingStyle)throw new Error("Selecione um estilo de orientação válido.");
  if(input.days_per_week>entitlements.maxWeeklyWorkouts)throw new Error("WEEKLY_WORKOUT_LIMIT_REACHED");
  const generated = generateDefaultWorkoutPlan(input),
    schedule = buildTrainingSchedule(input.days_per_week, input.preferred_days),
    now = new Date().toISOString();
  const previousPreference=await supabase.from("training_preferences")
    .select("*").eq("user_id",user.id).maybeSingle();
  if(previousPreference.error)fail(previousPreference.error);
  const saved = await supabase
    .from("workout_plans")
    .insert(
      {
        user_id: user.id,
        name: "Plano PSFIT",
        goal: input.primary_goal,
        experience_level: input.experience_level,
        days_per_week: input.days_per_week,
        session_duration: input.session_duration_minutes,
        is_active: false,
        source: `builder:${crypto.randomUUID()}`,
        updated_at: now,
      },
    )
    .select("id")
    .single();
  if (saved.error || !saved.data)
    fail(saved.error ?? { message: "Não foi possível salvar o plano." });
  try {
  const {data:catalog,error:catalogError}=await supabase
    .from("exercise_catalog")
    .select("id,name,slug,primary_muscle,secondary_muscles,equipment,video_url,thumbnail_url");
  if(catalogError)fail(catalogError);
  const catalogRows=catalog??[];
  const slugByKey:Record<string,string>={
    push_up:"flexao",machine_chest_press:"supino-reto",
    resistance_band_row:"remada-baixa",seated_cable_row:"remada-baixa",
    dumbbell_lateral_raise:"desenvolvimento-halteres",bench_squat:"agachamento-livre",
    leg_press:"leg-press",hip_thrust:"elevacao-pelvica",dead_bug:"prancha",
    bird_dog:"prancha",controlled_mobility_flow:"mobilidade-quadril",
    hip_shoulder_mobility:"mobilidade-quadril",low_impact_interval_walk:"caminhada",
    supported_lunge:"agachamento-livre",cable_band_accessory:"remada-baixa",
    light_conditioning:"caminhada",
  };
  const catalogFor=(key:string,focus:string[])=>{
    const exact=catalogRows.find(item=>item.slug===slugByKey[key]);
    if(exact)return exact;
    const normalizedFocus=focus.map(value=>value.toLocaleLowerCase());
    return [...catalogRows]
      .sort((a,b)=>Number(Boolean(b.video_url))-Number(Boolean(a.video_url)))
      .find(item=>normalizedFocus.some(value=>item.primary_muscle.toLocaleLowerCase().includes(value)))
      ??catalogRows[0]??null;
  };
  for (const [position, workout] of generated.entries()) {
    const result = await supabase
      .from("workouts")
      .upsert(
        {
          plan_id: saved.data.id,
          user_id: user.id,
          name: workout.name,
          description: null,
          focus: workout.focus.join(", "),
          estimated_minutes: input.session_duration_minutes,
          difficulty: input.experience_level,
          scheduled_weekday: schedule[position],
          scheduled_time: preferredTime,
          status: "scheduled",
          is_custom: false,
          position,
          updated_at: now,
        },
        { onConflict: "plan_id,position" },
      )
      .select("id")
      .single();
    if (result.error || !result.data)
      fail(result.error ?? { message: "Falha ao salvar treino." });
    const rows = workout.exercises.map((x, i) => {
      const catalogExercise=catalogFor(x.name_key,workout.focus);
      if(!catalogExercise)throw new Error(`Nenhum exercício do catálogo disponível para ${x.name_key}.`);
      return {
      workout_id: result.data.id,
      name: catalogExercise.name,
      name_key: x.name_key,
      sets: x.sets,
      repetitions: x.repetitions,
      load_guidance: x.load_guidance,
      position: i,
      primary_muscles: [catalogExercise.primary_muscle].filter(Boolean),
      secondary_muscles: catalogExercise.secondary_muscles??[],
      rest_seconds: 60,
      muscle_group: catalogExercise.primary_muscle??workout.focus[0]??null,
      equipment: catalogExercise.equipment,
      suggested_weight_kg: null,
      catalog_exercise_id: catalogExercise.id,
      notes: null,
      video_url: catalogExercise.video_url,
      video_thumbnail_url: catalogExercise.thumbnail_url,
    }});
    const clean = await supabase
      .from("exercises")
      .delete()
      .eq("workout_id", result.data.id);
    if (clean.error) fail(clean.error);
    if(rows.length===0)throw new Error("O treino gerado não possui exercícios.");
    const ex = await supabase.from("exercises").insert(rows).select("id");
    if (ex.error) fail(ex.error);
    if((ex.data?.length??0)!==rows.length)throw new Error("Nem todos os exercícios foram salvos.");
  }
  const preference = await supabase
    .from("training_preferences")
    .upsert(
      {
        ...input,
        user_id: user.id,
        preferred_time: preferredTime,
        coaching_style: coachingStyle,
      },
      { onConflict: "user_id" },
    );
  if (preference.error) fail(preference.error);
  const activate=await supabase.from("workout_plans")
    .update({is_active:true,updated_at:now}).eq("id",saved.data.id);
  if(activate.error)fail(activate.error);
  const deactivate=await supabase.from("workout_plans")
    .update({is_active:false,updated_at:now})
    .eq("user_id",user.id).eq("is_active",true).neq("id",saved.data.id);
  if(deactivate.error)fail(deactivate.error);
  } catch (error) {
    const rollback=await supabase.from("workout_plans").delete().eq("id",saved.data.id);
    if(rollback.error)console.error("[PSFIT TRAINING ROLLBACK]",{message:rollback.error.message,code:rollback.error.code});
    const preferenceRollback=previousPreference.data
      ? await supabase.from("training_preferences").update(previousPreference.data).eq("user_id",user.id)
      : await supabase.from("training_preferences").delete().eq("user_id",user.id);
    if(preferenceRollback.error)console.error("[PSFIT TRAINING PREFERENCE ROLLBACK]",{message:preferenceRollback.error.message,code:preferenceRollback.error.code});
    throw error;
  }
  revalidatePath("/workouts");
  revalidatePath("/workouts/today");
  const dateInBahia=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bahia",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const firstDate=new Date(`${dateInBahia}T12:00:00-03:00`);
  const delta=(schedule[0]-firstDate.getDay()+7)%7;
  firstDate.setDate(firstDate.getDate()+delta);
  redirect(`/workouts?generated=1&date=${firstDate.toISOString().slice(0,10)}`);
}
export async function saveImportedWorkout(form: FormData) {
  const parsed = importedWorkoutSchema.safeParse(
    JSON.parse(String(form.get("payload"))),
  );
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);
  const { supabase, user, entitlements } = await auth();
  if(!entitlements.canImportWorkoutPhoto)throw new Error("PRO_REQUIRED");
  let { data: plan } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!plan) {
    const created = await supabase
      .from("workout_plans")
      .upsert(
        {
          user_id: user.id,
          name: "Treinos importados",
          goal: null,
          experience_level: null,
          days_per_week: 2,
          session_duration: Number(form.get("minutes")),
          is_active: true,
          source: "import",
        },
        { onConflict: "user_id,source" },
      )
      .select("id")
      .single();
    if (created.error || !created.data)
      fail(created.error ?? { message: "Falha ao criar plano." });
    plan = created.data;
  }
  const { data: positions } = await supabase
    .from("workouts")
    .select("position")
    .eq("plan_id", plan.id)
    .order("position", { ascending: false })
    .limit(1);
  const workout = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      plan_id: plan.id,
      name: parsed.data.title || "Treino importado",
      description: null,
      focus: "",
      difficulty: null,
      estimated_minutes: Number(form.get("minutes")),
      scheduled_weekday: Number(form.get("day")),
      scheduled_time: null,
      status: "scheduled",
      is_custom: true,
      position: (positions?.[0]?.position ?? -1) + 1,
    })
    .select("id")
    .single();
  if (workout.error || !workout.data)
    fail(workout.error ?? { message: "Falha ao salvar treino." });
  const catalogResult = await supabase
    .from("exercise_catalog")
    .select("id,name,aliases");
  const catalog = (catalogResult.data ?? []) as Array<{
    id: string;
    name: string;
    aliases: string[];
  }>;
  const rows = parsed.data.exercises.map((exercise, position) => {
    const normalized = exercise.name.toLowerCase();
    const match = catalog.find(
      (item) =>
        item.name.toLowerCase() === normalized ||
        item.aliases.some((alias) => alias.toLowerCase() === normalized),
    );
    return {
      workout_id: workout.data.id,
      catalog_exercise_id: match?.id ?? null,
      name: exercise.name,
      muscle_group: null,
      primary_muscles: [],
      secondary_muscles: [],
      equipment: null,
      sets: exercise.sets ?? 1,
      repetitions: exercise.repetitions ?? "Revisar",
      suggested_weight_kg: null,
      rest_seconds: exercise.rest_seconds ?? 0,
      position,
      load_guidance: exercise.load_guidance,
      notes: exercise.notes,
      video_url: null,
      video_thumbnail_url: null,
    };
  });
  const exerciseResult = await supabase.from("exercises").insert(rows);
  if (exerciseResult.error) fail(exerciseResult.error);
  redirect("/workouts?imported=1");
}
