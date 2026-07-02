import AppShell from "@/components/app-shell";
import { ProfileEditor } from "@/components/community/profile-editor";
import { createClient } from "@/lib/supabase/server";
import type { CommunityProfile } from "@/types/database";
import { redirect } from "next/navigation";
export const metadata = { title: "Edit profile" };
export default async function Page() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?redirectTo=/settings/profile");
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .single();
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-semibold">Edit profile</h1>
        <p className="mt-2 text-muted">
          Shape how you appear across PSFIT Community.
        </p>
        <section className="card mt-8 p-5 sm:p-7">
          <ProfileEditor profile={data as unknown as CommunityProfile} />
        </section>
      </div>
    </AppShell>
  );
}
