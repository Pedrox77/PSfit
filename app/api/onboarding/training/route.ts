import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeCoachingStyle, normalizePreferredTime } from "@/lib/training/preference-values";

const experienceLevels = ["beginner", "intermediate", "advanced"];
const coachingStyles = ["supportive", "direct", "educational", "competitive"];
const loadProgressionModes = ["automatic", "confirm", "manual"];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Your session has expired. Please sign in again." },
        { status: 401 },
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const primaryGoal = stringValue(body.primaryGoal ?? body.primary_goal);
    const experienceLevel = stringValue(body.experienceLevel ?? body.experience_level);
    const loadProgressionMode = stringValue(body.loadProgressionMode ?? body.load_progression_mode) || "confirm";
    const trainingLocation = stringValue(body.trainingLocation ?? body.training_location);
    const equipment = stringArray(body.equipment);
    const daysPerWeek = Number(body.daysPerWeek ?? body.days_per_week);
    const sessionDurationMinutes = Number(body.sessionDurationMinutes ?? body.session_duration_minutes);
    const preferredDays = stringArray(body.preferredDays ?? body.preferred_days);
    const rawPreferredTime = stringValue(body.preferredTime ?? body.preferred_time);
    const preferredTime = normalizePreferredTime(rawPreferredTime);
    const focusAreas = stringArray(body.focusAreas ?? body.focus_areas);
    const limitations = stringArray(body.limitations);
    const limitationNotes = stringValue(body.limitationNotes ?? body.limitation_notes);
    const coachingStyle = normalizeCoachingStyle(stringValue(body.coachingStyle ?? body.coaching_style));

    if (!primaryGoal) return invalid("Select your main training goal.");
    if (!experienceLevels.includes(experienceLevel)) return invalid("Select a valid training experience.");
    if (!loadProgressionModes.includes(loadProgressionMode)) return invalid("Select a valid load progression mode.");
    if (!trainingLocation) return invalid("Select where you train.");
    if (!Number.isInteger(daysPerWeek) || daysPerWeek < 2 || daysPerWeek > 7) {
      return invalid("Select between 2 and 7 training days.");
    }
    if (!Number.isFinite(sessionDurationMinutes) || sessionDurationMinutes < 10 || sessionDurationMinutes > 180) {
      return invalid("Select a valid session duration.");
    }
    if (!coachingStyle || !coachingStyles.includes(coachingStyle)) return invalid("Select a valid coaching style.");
    if (rawPreferredTime && !preferredTime) return invalid("Select a valid preferred time.");

    const { error: preferencesError } = await supabase
      .from("training_preferences")
      .upsert({
        user_id: user.id,
        primary_goal: primaryGoal,
        experience_level: experienceLevel,
        load_progression_mode: loadProgressionMode,
        training_location: trainingLocation,
        equipment,
        days_per_week: daysPerWeek,
        session_duration_minutes: sessionDurationMinutes,
        preferred_days: preferredDays,
        preferred_time: preferredTime || null,
        focus_areas: focusAreas,
        limitations,
        limitation_notes: limitationNotes || null,
        coaching_style: coachingStyle,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (preferencesError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Training preferences database error:", preferencesError);
      }
      return databaseError(preferencesError.message, "We couldn't save your training preferences.");
    }

    const { data: profile, error: profileReadError } = await supabase
      .from("profiles")
      .select("personalization_choice")
      .eq("id", user.id)
      .single();

    if (profileReadError && process.env.NODE_ENV === "development") {
      console.error("Training profile read error:", profileReadError);
    }

    const includesNutrition = profile?.personalization_choice === "both";
    const next = includesNutrition ? "/onboarding/nutrition" : "/onboarding/review";
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        onboarding_step: includesNutrition ? "nutrition" : "review",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileUpdateError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Training onboarding step update error:", profileUpdateError);
      }
      return databaseError(profileUpdateError.message, "We couldn't update your onboarding progress.");
    }

    return NextResponse.json({ ok: true, next });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Unexpected training onboarding error:", error);
    }
    return NextResponse.json(
      {
        ok: false,
        error: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : "We couldn't save your training preferences.",
      },
      { status: 500 },
    );
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(stringValue).filter(Boolean) : [];
}
function invalid(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}
function databaseError(technical: string, friendly: string) {
  return NextResponse.json(
    { ok: false, error: process.env.NODE_ENV === "development" ? technical : friendly },
    { status: 500 },
  );
}
