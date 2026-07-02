import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getUserEntitlements } from "./entitlements";

export async function getCurrentUserEntitlements() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) throw new Error("UNAUTHENTICATED");
  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("id,plan,plan_status").eq("id", auth.user.id).single();
  if (profileError) throw profileError;
  return { user: auth.user, profile, entitlements: getUserEntitlements(profile) };
}
