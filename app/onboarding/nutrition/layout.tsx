import { NutritionProGate } from "@/components/billing/nutrition-pro-gate";
import { getCurrentUserEntitlements } from "@/lib/billing/current-entitlements";

export default async function OnboardingNutritionLayout({children}:{children:React.ReactNode}) {
  const {entitlements}=await getCurrentUserEntitlements();
  if(!entitlements.canUseNutrition)return <main className="grid min-h-screen place-items-center bg-ink p-5"><NutritionProGate/></main>;
  return children;
}
