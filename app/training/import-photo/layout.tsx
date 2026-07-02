import AppShell from "@/components/app-shell";
import { ProGate } from "@/components/billing/pro-gate";
import { getCurrentUserEntitlements } from "@/lib/billing/current-entitlements";

export default async function ImportLayout({children}:{children:React.ReactNode}) {
  const { entitlements } = await getCurrentUserEntitlements();
  if (!entitlements.canImportWorkoutPhoto) return <AppShell><ProGate title="Photo import is a Pro feature" description="Turn a photo of your workout sheet into an editable workout." feature="Smart workout-sheet analysis"/></AppShell>;
  return children;
}
