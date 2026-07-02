import { CommunityShell } from "@/components/community/community-shell";
import { createClient } from "@/lib/supabase/server";
import type { CommunityProfile } from "@/types/database";
import { redirect } from "next/navigation";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?redirectTo=/community");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
  if (!profile?.username) redirect("/onboarding/nickname");
  return <CommunityShell profile={profile as unknown as CommunityProfile}>{children}</CommunityShell>;
}
