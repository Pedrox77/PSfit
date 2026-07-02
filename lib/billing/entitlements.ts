export type BillingProfile = {
  plan: string | null;
  plan_status: string | null;
};

export type UserEntitlements = {
  isPro: boolean;
  maxActivePlans: number;
  maxWeeklyWorkouts: number;
  maxRecoveryCheckinsPerWeek: number;
  progressHistoryDays: number | null;
  canImportWorkoutPhoto: boolean;
  canUseTwin: boolean;
  canViewAdvancedProgress: boolean;
  canViewAdvancedRecovery: boolean;
  canUseAdaptiveInsights: boolean;
  canViewDetailedMuscleMap: boolean;
  canUseNutrition: boolean;
  canUseAdvancedRecovery: boolean;
  canUseAdvancedMomentum: boolean;
  canUseAutomaticLoadProgression: boolean;
  canUseAdvancedAnalytics: boolean;
};

export function hasActivePro(profile: BillingProfile | null | undefined) {
  return ["pro", "pro_mensal", "pro_anual"].includes(profile?.plan ?? "") &&
    (profile?.plan_status === "active" || profile?.plan_status === "trialing");
}

export function getUserEntitlements(profile: BillingProfile | null | undefined): UserEntitlements {
  const isPro = hasActivePro(profile);
  return {
    isPro,
    maxActivePlans: isPro ? Number.POSITIVE_INFINITY : 1,
    maxWeeklyWorkouts: isPro ? Number.POSITIVE_INFINITY : 3,
    maxRecoveryCheckinsPerWeek: isPro ? Number.POSITIVE_INFINITY : 1,
    progressHistoryDays: isPro ? null : 30,
    canImportWorkoutPhoto: isPro,
    canUseTwin: isPro,
    canViewAdvancedProgress: isPro,
    canViewAdvancedRecovery: isPro,
    canUseAdaptiveInsights: isPro,
    canViewDetailedMuscleMap: isPro,
    canUseNutrition: isPro,
    canUseAdvancedRecovery: isPro,
    canUseAdvancedMomentum: isPro,
    canUseAutomaticLoadProgression: isPro,
    canUseAdvancedAnalytics: isPro,
  };
}

export function requireActivePro(profile: BillingProfile | null | undefined) {
  if (!hasActivePro(profile)) throw new Error("PRO_REQUIRED");
}
