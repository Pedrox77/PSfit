import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { PersonalizationChoice } from "@/components/onboarding/personalization-choice";
import { getCurrentUserEntitlements } from "@/lib/billing/current-entitlements";
export const metadata = { title: "Personalize PSFIT" };
export default async function Page() {
  const {entitlements}=await getCurrentUserEntitlements();
  return (
    <OnboardingShell
      step={2}
      total={4}
      title="How should PSFIT help you?"
      description="Choose the guidance you want now. You can change it later."
    >
      <PersonalizationChoice canUseNutrition={entitlements.canUseNutrition} />
    </OnboardingShell>
  );
}
