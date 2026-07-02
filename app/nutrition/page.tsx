import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NutritionPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data } = await supabase
    .from("nutrition_preferences")
    .select("nutrition_setup_completed")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  redirect(data?.nutrition_setup_completed ? "/nutrition/meals" : "/nutrition/setup");
}
