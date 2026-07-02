import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

const modes = ["automatic", "confirm", "manual"] as const;
export default async function TrainingSettings() {
  const t = await getTranslations("LoadProgression");
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await db
    .from("training_preferences")
    .select("load_progression_mode")
    .eq("user_id", user.id)
    .maybeSingle();
  async function save(form: FormData) {
    "use server";
    const mode = String(form.get("load_progression_mode"));
    if (!modes.includes(mode as (typeof modes)[number]))
      throw new Error("INVALID_LOAD_PROGRESSION_MODE");
    const client = await createClient();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) throw new Error("AUTH_REQUIRED");
    const { error } = await client
      .from("training_preferences")
      .update({ load_progression_mode: mode as (typeof modes)[number] })
      .eq("user_id", auth.user.id);
    if (error) throw error;
    revalidatePath("/settings/training");
  }
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">{t("title")}</p>
        <h1 className="mt-2 text-3xl font-semibold">{t("title")}</h1>
        <p className="mt-3 text-muted">{t("description")}</p>
        <form action={save} className="mt-7 space-y-3">
          {modes.map((mode) => (
            <label
              key={mode}
              className="block rounded-2xl border border-white/10 bg-raised p-4 has-[:checked]:border-acid"
            >
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  required
                  name="load_progression_mode"
                  value={mode}
                  defaultChecked={
                    (data?.load_progression_mode ?? "confirm") === mode
                  }
                  className="mt-1 accent-[#a8ff2a]"
                />
                <span>
                  <b>{t(mode)}</b>
                  <span className="mt-1 block text-sm text-muted">
                    {t(`${mode}Description`)}
                  </span>
                </span>
              </span>
            </label>
          ))}
          <button className="mt-4 rounded-full bg-acid px-6 py-3 font-bold text-ink">
            Salvar
          </button>
        </form>
      </div>
    </AppShell>
  );
}
