import { createClient } from "@/lib/supabase/server";
import {
  generateDefaultWorkoutPlan,
  type TrainingInput,
} from "./generate-default-workout";
import { buildTrainingSchedule } from "@/lib/training/schedule";
import { getUserEntitlements } from "@/lib/billing/entitlements";

export type GenerationStep =
  | "authentication"
  | "profile"
  | "preferences"
  | "workout"
  | "nutrition"
  | "finalizing";

type PersonalizationChoice =
  | "workout"
  | "nutrition"
  | "both"
  | "later";

export class PlanGenerationError extends Error {
  constructor(
    public step: GenerationStep,
    message: string,
  ) {
    super(message);
    this.name = "PlanGenerationError";
  }
}

export interface GenerationResult {
  ok: true;
  next: string;
  generated: {
    workout: boolean;
    nutrition: boolean;
  };
  warnings: string[];
}

export async function generateInitialPlan(): Promise<GenerationResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new PlanGenerationError(
      "authentication",
      "Your session has expired. Please sign in again.",
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id,personalization_choice,onboarding_step,onboarding_completed,plan,plan_status",
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new PlanGenerationError(
      "profile",
      profileError?.message ?? "Profile not found.",
    );
  }

  const choice = String(
    profile.personalization_choice,
  ) as PersonalizationChoice;

  const validChoices: PersonalizationChoice[] = [
    "workout",
    "nutrition",
    "both",
    "later",
  ];

  if (!validChoices.includes(choice)) {
    throw new PlanGenerationError(
      "profile",
      "Invalid personalization choice.",
    );
  }

  if (choice === "later") {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_step: "completed",
        onboarding_completed: true,
        onboarding_completed_at: now,
        updated_at: now,
      })
      .eq("id", user.id);

    if (error) {
      throw new PlanGenerationError(
        "finalizing",
        error.message,
      );
    }

    return {
      ok: true,
      next: "/dashboard?welcome=true",
      generated: {
        workout: false,
        nutrition: false,
      },
      warnings: [],
    };
  }

  const wantsWorkout =
    choice === "workout" || choice === "both";

  const wantsNutrition =
    choice === "nutrition" || choice === "both";
  if (
    wantsNutrition &&
    !getUserEntitlements(profile).canUseNutrition
  ) {
    throw new PlanGenerationError(
      "nutrition",
      "PRO_REQUIRED",
    );
  }

  const [
    { data: training, error: trainingError },
    { data: nutrition, error: nutritionError },
  ] = await Promise.all([
    wantsWorkout
      ? supabase
          .from("training_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),

    wantsNutrition
      ? supabase
          .from("nutrition_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),
  ]);

  if (trainingError || nutritionError) {
    throw new PlanGenerationError(
      "preferences",
      (trainingError ?? nutritionError)?.message ??
        "Preferences unavailable.",
    );
  }

  const warnings: string[] = [];

  let workoutGenerated = false;
  let nutritionGenerated = false;

  let trainingPlan: Record<string, unknown> | null = null;
  let nutritionGuidance: Record<string, unknown> | null =
    null;

  /*
   * =========================================================
   * WORKOUT GENERATION
   * =========================================================
   */

  if (wantsWorkout) {
    if (!training) {
      warnings.push(
        "Complete your training preferences to build a workout plan.",
      );
    } else {
      try {
        const input =
          training as unknown as TrainingInput;

        const plan = generateDefaultWorkoutPlan(input);
        const schedule = buildTrainingSchedule(input.days_per_week, input.preferred_days);
        const now = new Date().toISOString();

        const { error: deactivateError } = await supabase
          .from("workout_plans")
          .update({
            is_active: false,
            updated_at: now,
          })
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (deactivateError) {
          throw deactivateError;
        }

        const { data: savedPlan, error: planError } =
          await supabase
            .from("workout_plans")
            .upsert(
              {
                user_id: user.id,
                name: "Meu plano inicial PSFIT",
                goal: input.primary_goal,
                experience_level:
                  input.experience_level,
                days_per_week: input.days_per_week,
                session_duration:
                  input.session_duration_minutes,
                is_active: true,
                source: "onboarding",
                updated_at: now,
              },
              {
                onConflict: "user_id,source",
              },
            )
            .select("id")
            .single();

        if (planError || !savedPlan) {
          throw (
            planError ??
            new Error(
              "Workout plan was not returned.",
            )
          );
        }

        for (const [
          workoutPosition,
          workout,
        ] of plan.entries()) {
          const { data: savedWorkout, error: workoutError } =
            await supabase
              .from("workouts")
              .upsert(
                {
                  plan_id: savedPlan.id,
                  user_id: user.id,
                  name: workout.name,
                  name_key: workout.name_key,

                  // A coluna focus foi criada como text.
                  focus: workout.focus.join(","),
                  focus_key: workout.focus_key,
                  scheduled_weekday: schedule[workoutPosition],

                  position: workoutPosition,
                  updated_at: now,
                },
                {
                  onConflict: "plan_id,position",
                },
              )
              .select("id")
              .single();

          if (workoutError || !savedWorkout) {
            throw (
              workoutError ??
              new Error("Workout was not returned.")
            );
          }

          for (const [
            exercisePosition,
            exercise,
          ] of workout.exercises.entries()) {
            const { error: exerciseError } =
              await supabase
                .from("exercises")
                .upsert(
                  {
                    workout_id: savedWorkout.id,

                    // Não colocar user_id nesta tabela.
                    name: exercise.name,
                    name_key: exercise.name_key,
                    sets: exercise.sets,
                    repetitions:
                      exercise.repetitions,
                    load_guidance:
                      exercise.load_guidance,

                    position: exercisePosition,
                    updated_at: now,
                  },
                  {
                    onConflict:
                      "workout_id,position",
                  },
                );

            if (exerciseError) {
              throw exerciseError;
            }
          }
        }

        const limitations = Array.isArray(
          input.limitations,
        )
          ? input.limitations
          : [];

        trainingPlan = {
          plan_id: savedPlan.id,
          days_per_week: input.days_per_week,
          session_minutes:
            input.session_duration_minutes,
          workouts: plan.map(
            (workout) => workout.name,
          ),
          safety_note: limitations.includes(
            "no_limitations",
          )
            ? null
            : "Interrompa movimentos que aumentem a dor e procure orientação qualificada.",
        };

        workoutGenerated = true;
      } catch (error) {
        if (choice === "workout") {
          throw new PlanGenerationError(
            "workout",
            messageOf(error),
          );
        }

        warnings.push(
          "Your workout plan could not be prepared yet.",
        );
      }
    }
  }

  /*
   * =========================================================
   * NUTRITION GENERATION
   * =========================================================
   */

  if (wantsNutrition) {
    if (!nutrition) {
      if (choice === "nutrition") {
        throw new PlanGenerationError(
          "nutrition",
          "Nutrition preferences were not found.",
        );
      }

      warnings.push(
        "Complete your nutrition preferences to estimate nutrition targets.",
      );
    } else {
      const weight = Number(
        nutrition.current_weight_kg,
      );

      const hasValidWeight =
        Number.isFinite(weight) && weight > 0;

      const requiresProfessionalCare = Boolean(
        nutrition.requires_professional_care,
      );

      if (!hasValidWeight) {
        warnings.push(
          "Complete your body information to estimate nutrition targets.",
        );
      }

      try {
        if (hasValidWeight) {
          const activityMultipliers: Record<
            string,
            number
          > = {
            mostly_seated: 28,
            lightly_active: 30,
            moderately_active: 33,
            very_active: 36,
            extremely_active: 39,
          };

          const activityLevel = String(
            nutrition.activity_level ?? "",
          );

          const multiplier =
            activityMultipliers[activityLevel] ?? 31;

          const midpoint = Math.round(
            weight * multiplier,
          );

          const { error: nutritionTargetError } =
            await supabase
              .from("nutrition_targets")
              .upsert(
                {
                  user_id: user.id,

                  estimated_calories_min:
                    requiresProfessionalCare
                      ? null
                      : Math.max(
                          1200,
                          midpoint - 150,
                        ),

                  estimated_calories_max:
                    requiresProfessionalCare
                      ? null
                      : midpoint + 150,

                  estimated_protein_min_g:
                    requiresProfessionalCare
                      ? null
                      : Math.round(weight * 1.4),

                  estimated_protein_max_g:
                    requiresProfessionalCare
                      ? null
                      : Math.round(weight * 1.8),

                  estimated_carbs_min_g:
                    requiresProfessionalCare
                      ? null
                      : Math.round(weight * 2.5),

                  estimated_carbs_max_g:
                    requiresProfessionalCare
                      ? null
                      : Math.round(weight * 4),

                  estimated_fat_min_g:
                    requiresProfessionalCare
                      ? null
                      : Math.round(weight * 0.7),

                  estimated_fat_max_g:
                    requiresProfessionalCare
                      ? null
                      : Math.round(weight),

                  water_target_ml: Math.round(
                    weight * 35,
                  ),

                  calculation_version:
                    "onboarding-v1",

                  updated_at:
                    new Date().toISOString(),
                },
                {
                  onConflict: "user_id",
                },
              );

          if (nutritionTargetError) {
            throw nutritionTargetError;
          }

          nutritionGenerated = true;
        }

        nutritionGuidance = {
          targets_available: nutritionGenerated,
          preference:
            nutrition.eating_preferences ?? null,
          message: requiresProfessionalCare
            ? "General, non-restrictive guidance only. Consult a qualified professional."
            : hasValidWeight
              ? "Estimated ranges prepared from your answers."
              : "Complete body information to receive estimated ranges.",
        };
      } catch (error) {
        if (choice === "nutrition") {
          throw new PlanGenerationError(
            "nutrition",
            messageOf(error),
          );
        }

        warnings.push(
          "Nutrition targets could not be estimated yet.",
        );
      }
    }
  }

  /*
   * =========================================================
   * FINALIZATION
   * =========================================================
   */

  if (
    !workoutGenerated &&
    !nutritionGenerated &&
    choice !== "nutrition"
  ) {
    throw new PlanGenerationError(
      "finalizing",
      "No selected resource could be generated.",
    );
  }

  if (
    choice === "nutrition" &&
    nutrition &&
    !nutritionGenerated &&
    Number(nutrition.current_weight_kg) > 0
  ) {
    throw new PlanGenerationError(
      "nutrition",
      "Nutrition targets could not be generated.",
    );
  }

  const { error: summaryError } = await supabase
    .from("initial_plans")
    .upsert(
      {
        user_id: user.id,
        training_plan: trainingPlan,
        nutrition_guidance: nutritionGuidance,

        first_recommendation: workoutGenerated
          ? "Revise sua primeira semana e ajuste movimentos que causem desconforto."
          : "Revise suas orientações gerais de nutrição.",

        dashboard_config: {
          show_training: workoutGenerated,
          show_nutrition: wantsNutrition,
          nutrition_setup_incomplete:
            wantsNutrition && !nutritionGenerated,
        },
      },
      {
        onConflict: "user_id",
      },
    );

  if (summaryError) {
    throw new PlanGenerationError(
      "finalizing",
      summaryError.message,
    );
  }

  const completedAt = new Date().toISOString();

  const { error: completeError } = await supabase
    .from("profiles")
    .update({
      onboarding_step: "completed",
      onboarding_completed: true,
      onboarding_completed_at: completedAt,
      updated_at: completedAt,
    })
    .eq("id", user.id);

  if (completeError) {
    throw new PlanGenerationError(
      "finalizing",
      completeError.message,
    );
  }

  return {
    ok: true,
    next: "/dashboard?welcome=true",
    generated: {
      workout: workoutGenerated,
      nutrition: nutritionGenerated,
    },
    warnings,
  };
}

function messageOf(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    return String(
      (error as { message?: unknown }).message ??
        "Unknown database error",
    );
  }

  return String(error ?? "Unknown database error");
}
