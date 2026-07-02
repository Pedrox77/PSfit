import AppShell from "@/components/app-shell";
import { ProFeatureGate } from "@/components/billing/pro-feature-gate";
import { getCurrentUserEntitlements } from "@/lib/billing/current-entitlements";

export default async function TwinLayout({children}:{children:React.ReactNode}) {
  const { entitlements } = await getCurrentUserEntitlements();
  if (!entitlements.canUseTwin) return <AppShell><ProFeatureGate feature="twin"/></AppShell>;
  return children;
}
