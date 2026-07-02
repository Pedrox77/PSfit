import AppShell from "@/components/app-shell";
import { Field, SaveButton } from "@/components/internal-form";
import { FormModal } from "@/components/form-modal";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/errors";
import { saveRecovery } from "../internal-actions";
import { redirect } from "next/navigation";

export default async function Recovery({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const date = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const [checkins, training] = await Promise.all([
    db
      .from("recovery_checkins")
      .select("*")
      .eq("user_id", user.id)
      .gte("checkin_date", since)
      .order("checkin_date"),
    db
      .from("workout_sessions")
      .select("duration_minutes,total_volume_kg")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("scheduled_date", since),
  ]);
  if (checkins.error)
    logSupabaseError("Check-ins de recuperação", checkins.error);
  if (training.error) logSupabaseError("Carga de treinamento", training.error);
  const data = checkins.data ?? [],
    sessions = training.data ?? [];
  const today = data.find((item) => item.checkin_date === date);
  const averageSleep = data.length
    ? data.reduce((total, item) => total + item.sleep_hours, 0) / data.length
    : null;
  const volume = sessions.reduce(
    (total, item) => total + Number(item.total_volume_kg || 0),
    0,
  );
  const minutes = sessions.reduce(
    (total, item) => total + Number(item.duration_minutes || 0),
    0,
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <p className="eyebrow">Recuperação</p>
          <h1 className="mt-2 text-4xl font-semibold">Treine com contexto.</h1>
          <p className="mt-2 text-muted">
            Sono, energia e carga recente ajudam a calibrar o esforço de hoje.
          </p>
        </header>
        {(await searchParams).saved && (
          <p className="rounded-xl bg-acid/10 p-3 text-acid">Check-in salvo.</p>
        )}
        <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr_.85fr]">
          <section className="card flex items-center gap-6 p-6">
            <ReadinessGauge score={today?.readiness_score ?? null} />
            <div>
              <p className="text-sm text-muted">Prontidão de hoje</p>
              <p className="mt-2 font-semibold">
                {today?.recommendation ??
                  "Complete o check-in de hoje para receber uma recomendação."}
              </p>
              {today && (
                <p className="mt-2 text-xs text-muted">
                  Dor muscular: {today.muscle_soreness}/5 · Energia:{" "}
                  {today.energy_level}/5
                </p>
              )}
            </div>
          </section>
          <section className="rounded-2xl border border-aqua/20 bg-aqua/[.05] p-5">
            <p className="text-sm text-aqua">Sono · 7 dias</p>
            <p className="mt-4 text-3xl font-semibold">
              {averageSleep ? `${averageSleep.toFixed(1)} h` : "Sem dados"}
            </p>
            <p className="mt-2 text-xs text-muted">
              {data.length} check-ins incluídos
            </p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-raised p-5">
            <p className="text-sm text-muted">Carga · 7 dias</p>
            <p className="mt-4 text-2xl font-semibold">
              {sessions.length ? `${volume.toFixed(0)} kg` : "Sem treinos"}
            </p>
            <p className="mt-2 text-xs text-muted">
              {minutes} minutos concluídos
            </p>
          </section>
        </div>
        <FormModal
          button="Check-in diário"
          title="Como você está hoje?"
          autoOpen={!today}
        >
          <form action={saveRecovery} className="grid gap-4 md:grid-cols-3">
            <input type="hidden" name="checkin_date" value={date} />
            <Field name="sleep_hours" label="Horas de sono" required />
            <Field
              name="sleep_quality"
              label="Qualidade do sono (1–5)"
              required
            />
            <Field name="energy_level" label="Energia (1–5)" required />
            <Field name="muscle_soreness" label="Dor muscular (1–5)" required />
            <Field name="stress_level" label="Estresse (1–5)" required />
            <label className="flex items-center gap-2">
              <input type="checkbox" name="has_pain" /> Você está com dor?
            </label>
            <Field name="pain_location" label="Local da dor" type="text" />
            <Field name="notes" label="Observações" type="text" />
            <div className="self-end">
              <SaveButton>Salvar check-in</SaveButton>
            </div>
          </form>
        </FormModal>
      </div>
    </AppShell>
  );
}
function ReadinessGauge({ score }: { score: number | null }) {
  const value = score ?? 0;
  return (
    <div
      className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(#A8FF2A ${value * 3.6}deg, rgba(255,255,255,.08) 0)`,
      }}
    >
      <div className="grid h-24 w-24 place-items-center rounded-full bg-raised text-center">
        <span>
          <b className="text-2xl">{score ?? "—"}</b>
          <small className="block text-muted">de 100</small>
        </span>
      </div>
    </div>
  );
}
