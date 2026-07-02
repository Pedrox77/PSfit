import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export default async function Page(){const supabase=await createClient();const {data:auth}=await supabase.auth.getUser();if(!auth.user)redirect("/login");const {data}=await supabase.from("profiles").select("onboarding_step,onboarding_completed").eq("id",auth.user.id).maybeSingle();if(data?.onboarding_completed)redirect("/dashboard");redirect(`/onboarding/${data?.onboarding_step??"nickname"}`)}
