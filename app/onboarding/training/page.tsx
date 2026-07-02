import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { TrainingQuestionnaire } from "@/components/onboarding/training-questionnaire";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export const metadata={title:"Training preferences"};
export default async function Page(){const supabase=await createClient();const {data:auth}=await supabase.auth.getUser();if(!auth.user)redirect("/login");const {data}=await supabase.from("profiles").select("personalization_choice").eq("id",auth.user.id).single();if(!["workout","both"].includes(String(data?.personalization_choice)))redirect("/onboarding/personalization");return <OnboardingShell step={3} total={5} title="Build training around your real week" description="Your answers stay private and can be changed later."><TrainingQuestionnaire/></OnboardingShell>}
