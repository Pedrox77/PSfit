import { NutritionProGate } from "@/components/billing/nutrition-pro-gate";
import { NutritionQuestionnaire } from "@/components/onboarding/nutrition-questionnaire";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { getCurrentUserEntitlements } from "@/lib/billing/current-entitlements";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Nutrition preferences",
};

type PageProps = {
  searchParams: Promise<{
    edit?: string | string[];
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const editingNutrition = params.edit === "true";

  const { entitlements } = await getCurrentUserEntitlements();

  if (!entitlements.canUseNutrition) {
    return (
      <main className="grid min-h-screen place-items-center bg-ink p-5">
        <NutritionProGate />
      </main>
    );
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("personalization_choice")
    .eq("id", auth.user.id)
    .single();

  // During the original onboarding, nutrition still follows the selected
  // personalization choice. From /onboarding/nutrition?edit=true, the user can
  // configure nutrition directly without being sent back to personalization.
  if (
    !editingNutrition &&
    !["nutrition", "both"].includes(
      String(data?.personalization_choice),
    )
  ) {
    redirect("/onboarding/personalization");
  }

  const isCombinedOnboarding =
    data?.personalization_choice === "both";

  return (
    <OnboardingShell
      step={editingNutrition ? 1 : isCombinedOnboarding ? 4 : 3}
      total={editingNutrition ? 1 : isCombinedOnboarding ? 6 : 5}
      title={
        editingNutrition
          ? "Configure your nutrition"
          : "Shape your nutrition guidance"
      }
      description={
        editingNutrition
          ? "Tell PSFIT about your routine so it can estimate your nutrition targets."
          : "PSFIT estimates useful ranges and meal suggestions—not a medical diet."
      }
    >
      <NutritionQuestionnaire />
    </OnboardingShell>
  );
}
