"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { nutritionPreferencesSchema } from "@/lib/validations/nutrition-preferences";
import { usernameSchema } from "@/lib/validations/username";
import { getCurrentUserEntitlements } from "@/lib/billing/current-entitlements";

export type OnboardingResult = {
  ok: boolean;
  next?: string;
  error?: string;
  errorCode?: string;
};

const PROFESSIONAL_CARE_OPTIONS = [
  "no",
  "yes",
  "prefer_not_to_say",
] as const;

type ProfessionalCareAnswer =
  (typeof PROFESSIONAL_CARE_OPTIONS)[number];

async function context() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("[onboarding:auth]", error);
    throw error;
  }

  if (!data.user) {
    throw new Error("Authentication required");
  }

  return {
    supabase,
    user: data.user,
  };
}

function values(form: FormData, name: string) {
  return form.getAll(name).map(String);
}

function optionalTime(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function optionalDatabaseValue<T>(value: T): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value;
}

function normalizeProfessionalCareAnswer(
  value: unknown,
): ProfessionalCareAnswer {
  const normalized = String(value ?? "").trim();

  return PROFESSIONAL_CARE_OPTIONS.includes(
    normalized as ProfessionalCareAnswer,
  )
    ? (normalized as ProfessionalCareAnswer)
    : "no";
}

function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues?: unknown }).issues)
  ) {
    const issues = (
      error as {
        issues: Array<{
          message?: string;
          path?: Array<string | number>;
        }>;
      }
    ).issues;

    const firstIssue = issues[0];

    if (firstIssue?.message) {
      const field =
        firstIssue.path && firstIssue.path.length > 0
          ? `${firstIssue.path.join(".")}: `
          : "";

      return `${field}${firstIssue.message}`;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return String((error as { message: string }).message);
  }

  return fallback;
}

export async function ensureOnboardingProfile(): Promise<OnboardingResult> {
  try {
    const { user } = await context();

    const fullName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name.trim()
        : null;

    const { error } = await createAdminClient()
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: fullName || null,
          onboarding_step: "nickname",
          onboarding_completed: false,
        },
        {
          onConflict: "id",
          ignoreDuplicates: true,
        },
      );

    if (error) {
      throw error;
    }

    return {
      ok: true,
    };
  } catch (error: unknown) {
    console.error("[ensureOnboardingProfile]", error);

    return {
      ok: false,
      error: getErrorMessage(error, "PROFILE_BOOTSTRAP_FAILED"),
    };
  }
}

export async function saveNickname(
  form: FormData,
): Promise<OnboardingResult> {
  try {
    const candidate = usernameSchema.parse(
      String(form.get("username") ?? ""),
    );

    const { supabase } = await context();

    const { error } = await supabase.rpc("set_my_username", {
      candidate,
    });

    if (error) {
      throw error;
    }

    return {
      ok: true,
      next: "/onboarding/personalization",
    };
  } catch (error: unknown) {
    console.error("[saveNickname]", error);

    return {
      ok: false,
      error: getErrorMessage(
        error,
        "We couldn't save your nickname. Please try again.",
      ),
    };
  }
}

export async function savePersonalization(
  form: FormData,
): Promise<OnboardingResult> {
  try {
    const choice = String(form.get("choice") ?? "");

    if (!["workout", "nutrition", "both", "later"].includes(choice)) {
      return {
        ok: false,
        error: "Choose an option.",
      };
    }
    const { entitlements } = await getCurrentUserEntitlements();
    if (
      (choice === "nutrition" || choice === "both") &&
      !entitlements.canUseNutrition
    ) {
      return {
        ok: false,
        errorCode: "PRO_REQUIRED",
        error: "Nutrition is available with PSFIT Pro.",
      };
    }

    const { supabase, user } = await context();

    const next =
      choice === "later"
        ? "completed"
        : choice === "nutrition"
          ? "nutrition"
          : "training";

    const onboardingCompleted = choice === "later";

    const update: Record<string, unknown> = {
      personalization_choice: choice,
      onboarding_step: next,
      onboarding_completed: onboardingCompleted,
      onboarding_completed_at: onboardingCompleted
        ? new Date().toISOString()
        : null,
    };

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    return {
      ok: true,
      next: onboardingCompleted
        ? "/dashboard?welcome=true"
        : `/onboarding/${next}`,
    };
  } catch (error: unknown) {
    console.error("[savePersonalization]", error);

    return {
      ok: false,
      error: getErrorMessage(
        error,
        "We couldn't save your choice. Please try again.",
      ),
    };
  }
}

export async function saveNutrition(
  form: FormData,
): Promise<OnboardingResult> {
  try {
    const editingNutrition = form.get("edit_mode") === "true";
    const { entitlements } = await getCurrentUserEntitlements();
    if (!entitlements.canUseNutrition) {
      return {
        ok: false,
        errorCode: "PRO_REQUIRED",
        error: "Nutrition is available with PSFIT Pro.",
      };
    }
    const professionalCareAnswer =
      normalizeProfessionalCareAnswer(
        form.get("professional_care_answer"),
      );

    const selectedAllergies = values(form, "allergies");

    const normalizedAllergies = selectedAllergies.includes("none")
      ? ["none"]
      : selectedAllergies;

    const parsed = nutritionPreferencesSchema.parse({
      nutrition_goal: form.get("nutrition_goal"),
      age: form.get("age"),
      height_cm: form.get("height_cm"),
      current_weight_kg: form.get("current_weight_kg"),
      target_weight_kg: String(
        form.get("target_weight_kg") ?? "",
      ).trim(),
      biological_sex: form.get("biological_sex"),
      activity_level: form.get("activity_level"),
      eating_preferences: values(form, "eating_preferences"),
      allergies: normalizedAllergies,
      allergy_notes: String(
        form.get("allergy_notes") ?? "",
      ).trim(),
      meals_per_day: form.get("meals_per_day"),
      liked_foods: String(form.get("liked_foods") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      disliked_foods: String(form.get("disliked_foods") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      cooking_skill: form.get("cooking_skill"),
      preparation_time_minutes: form.get(
        "preparation_time_minutes",
      ),
      weekly_food_budget: String(
        form.get("weekly_food_budget") ?? "",
      ).trim(),
      breakfast_time: String(
        form.get("breakfast_time") ?? "",
      ).trim(),
      lunch_time: String(
        form.get("lunch_time") ?? "",
      ).trim(),
      dinner_time: String(
        form.get("dinner_time") ?? "",
      ).trim(),
      usual_training_time: String(
        form.get("usual_training_time") ?? "",
      ).trim(),
      eats_before_training:
        form.get("eats_before_training") === "yes",
      eats_after_training:
        form.get("eats_after_training") === "yes",
      professional_care_answer: professionalCareAnswer,
    });

    const { supabase, user } = await context();

    const { error: nutritionError } = await supabase
      .from("nutrition_preferences")
      .upsert(
        {
          user_id: user.id,
          ...parsed,

          target_weight_kg: optionalDatabaseValue(
            parsed.target_weight_kg,
          ),
          weekly_food_budget: optionalDatabaseValue(
            parsed.weekly_food_budget,
          ),

          breakfast_time: optionalTime(parsed.breakfast_time),
          lunch_time: optionalTime(parsed.lunch_time),
          dinner_time: optionalTime(parsed.dinner_time),
          usual_training_time: optionalTime(
            parsed.usual_training_time,
          ),

          professional_care_answer: professionalCareAnswer,
          requires_professional_care:
            professionalCareAnswer === "yes",
        },
        {
          onConflict: "user_id",
        },
      );

    if (nutritionError) {
      console.error(
        "[saveNutrition:nutrition_preferences]",
        nutritionError,
      );
      throw nutritionError;
    }

    if (!editingNutrition) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          onboarding_step: "review",
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("[saveNutrition:profiles]", profileError);
        throw profileError;
      }
    }

    return {
      ok: true,
      next: editingNutrition
        ? "/nutrition/setup"
        : "/onboarding/review",
    };
  } catch (error: unknown) {
    console.error("[saveNutrition]", error);

    return {
      ok: false,
      error: getErrorMessage(
        error,
        "We couldn't save your nutrition preferences.",
      ),
    };
  }
}

export async function beginGeneration(
  form: FormData,
): Promise<OnboardingResult> {
  try {
    if (form.get("safety_acknowledgement") !== "on") {
      return {
        ok: false,
        error: "Safety acknowledgement is required.",
      };
    }

    const { supabase, user } = await context();

    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_step: "generating",
      })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    return {
      ok: true,
      next: "/onboarding/generating",
    };
  } catch (error: unknown) {
    console.error("[beginGeneration]", error);

    return {
      ok: false,
      error: getErrorMessage(
        error,
        "We couldn't continue. Please try again.",
      ),
    };
  }
}
