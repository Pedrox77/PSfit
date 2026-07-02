import AppShell from "@/components/app-shell";
import { NutritionProGate } from "@/components/billing/nutrition-pro-gate";
import { getCurrentUserEntitlements } from "@/lib/billing/current-entitlements";

export default async function NutritionLayout({children}:{children:React.ReactNode}) {
  const {entitlements}=await getCurrentUserEntitlements();
  if(!entitlements.canUseNutrition)return <AppShell><NutritionProGate/></AppShell>;
  return children;
}
