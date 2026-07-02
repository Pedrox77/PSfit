import "server-only";

import { getCurrentUserEntitlements } from "@/lib/billing/current-entitlements";
import { createClient } from "@/lib/supabase/server";

export class NutritionAccessError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorCode: "UNAUTHENTICATED" | "PRO_REQUIRED",
  ) {
    super(errorCode);
  }
}

export async function requireNutritionContext() {
  const access = await getCurrentUserEntitlements().catch(() => null);

  if (!access) {
    throw new NutritionAccessError(401, "UNAUTHENTICATED");
  }

  if (!access.entitlements.canUseNutrition) {
    throw new NutritionAccessError(403, "PRO_REQUIRED");
  }

  const supabase = await createClient();

  return {
    supabase,
    user: access.user,
    profile: access.profile,
    entitlements: access.entitlements,
  };
}

export function nutritionAccessResponse(error: unknown) {
  if (error instanceof NutritionAccessError) {
    return {
      status: error.status,
      body: {
        ok: false,
        errorCode: error.errorCode,
        error:
          error.errorCode === "PRO_REQUIRED"
            ? "Nutrition is available with PSFIT Pro."
            : "Authentication required.",
      },
    };
  }

  return null;
}
