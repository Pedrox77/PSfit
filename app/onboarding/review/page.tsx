import { OnboardingReview } from "@/components/onboarding/onboarding-review";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export const metadata={title:"Review your answers"};
export default async function Page(){const supabase=await createClient();const {data:auth}=await supabase.auth.getUser();if(!auth.user)redirect("/login");const [{data:training},{data:nutrition}]=await Promise.all([supabase.from("training_preferences").select("*").eq("user_id",auth.user.id).maybeSingle(),supabase.from("nutrition_preferences").select("*").eq("user_id",auth.user.id).maybeSingle()]);return <OnboardingShell step={4} total={5} title="Review your answers" description="Make sure this still reflects your goals, schedule, preferences and safety needs."><OnboardingReview training={training} nutrition={nutrition}/></OnboardingShell>}
