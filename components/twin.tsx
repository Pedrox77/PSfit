"use client";
import { useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppShell from "./app-shell";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "next-intl";
export type TwinBaseline = {
  weight: number | null;
  workoutsPerWeek: number;
  sleepHours: number | null;
  weeklyVolume: number;
  proteinTarget: number | null;
  readiness: number | null;
};
export default function Twin({ baseline }: { baseline: TwinBaseline }) {
  const locale = useLocale();
  const pt = locale === "pt";
  const [workouts, setWorkouts] = useState(0),
    [sleep, setSleep] = useState(0),
    [protein, setProtein] = useState(0),
    [steps, setSteps] = useState(0),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState("");
  const hasData =
    baseline.weight !== null ||
    baseline.workoutsPerWeek > 0 ||
    baseline.sleepHours !== null ||
    baseline.weeklyVolume > 0;
  const data = useMemo(
    () =>
      Array.from({ length: 13 }, (_, week) => {
        const adherence = Math.min(
            1,
            (baseline.workoutsPerWeek + workouts) /
              Math.max(3, baseline.workoutsPerWeek || 3),
          ),
          recovery = Math.min(1, ((baseline.sleepHours ?? 7) + sleep / 60) / 8),
          nutrition = Math.min(
            1,
            ((baseline.proteinTarget ?? 0) + protein) /
              Math.max(1, baseline.proteinTarget ?? 120),
          ),
          adjustment =
            adherence * 0.45 +
            recovery * 0.3 +
            nutrition * 0.15 +
            Math.min(steps / 5000, 0.1);
        return {
          week: `S${week}`,
          current:
            100 +
            week *
              (baseline.workoutsPerWeek * 0.18 +
                (baseline.readiness ?? 50) / 500),
          adjusted:
            100 +
            week *
              (baseline.workoutsPerWeek * 0.18 +
                (baseline.readiness ?? 50) / 500 +
                adjustment * 0.35),
          conservative:
            100 +
            week *
              (baseline.workoutsPerWeek * 0.12 +
                (baseline.readiness ?? 50) / 800),
        };
      }),
    [baseline, workouts, sleep, protein, steps],
  );
  async function save() {
    setSaving(true);
    setMessage("");
    const db = createClient();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) {
      setMessage(pt ? "Sua sessão expirou." : "Your session expired.");
      setSaving(false);
      return;
    }
    const { error } = await db.from("twin_scenarios").insert({
      user_id: user.id,
      name: `${pt ? "Cenário" : "Scenario"} ${new Date().toLocaleDateString(locale)}`,
      assumptions: {
        extra_workouts: workouts,
        extra_sleep_minutes: sleep,
        extra_protein_g: protein,
        extra_steps: steps,
        baseline,
      },
      projection: data,
    });
    if (error) {
      console.error({
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      setMessage(error.message);
    } else setMessage(pt ? "Cenário salvo." : "Scenario saved.");
    setSaving(false);
  }
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="eyebrow">{pt ? "Gêmeo digital" : "Digital twin"}</p>
          <h1 className="mt-2 text-4xl font-semibold">
            {pt ? "Explore caminhos, não promessas." : "Explore directions, not promises."}
          </h1>
        </div>
        {!hasData ? (
          <div className="card p-7 text-muted">
            {pt ? "Registre treinos, sono ou progresso para criar uma projeção baseada nos seus dados." : "Log workouts, sleep or progress to create a projection based on your data."}
          </div>
        ) : (
          <>
            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
              <section className="card p-6">
                <h2 className="text-xl font-semibold">
                  {pt ? "Trajetórias relativas · 12 semanas" : "Relative trajectories · 12 weeks"}
                </h2>
                <div className="mt-5 h-80">
                  <ResponsiveContainer>
                    <LineChart data={data}>
                      <CartesianGrid stroke="rgba(255,255,255,.08)" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        dataKey="current"
                        name={pt ? "Trajetória atual" : "Current trajectory"}
                        stroke="#A8FF2A"
                      />
                      <Line
                        dataKey="adjusted"
                        name={pt ? "Cenário ajustado" : "Adjusted scenario"}
                        stroke="#35D9F5"
                      />
                      <Line
                        dataKey="conservative"
                        name={pt ? "Conservador" : "Conservative"}
                        stroke="#8D978F"
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section className="card space-y-5 p-6">
                <Range
                  label={pt ? "Treinos por semana" : "Weekly workouts"}
                  value={workouts}
                  set={setWorkouts}
                  max={3}
                />
                <Range
                  label={pt ? "Minutos adicionais de sono" : "Additional sleep minutes"}
                  value={sleep}
                  set={setSleep}
                  max={120}
                />
                <Range
                  label={pt ? "Proteína adicional (g)" : "Additional protein (g)"}
                  value={protein}
                  set={setProtein}
                  max={80}
                />
                <Range
                  label={pt ? "Passos adicionais" : "Additional steps"}
                  value={steps}
                  set={setSteps}
                  max={10000}
                />
                <button
                  onClick={save}
                  disabled={saving}
                  className="w-full rounded-full bg-acid py-3 font-bold text-ink disabled:opacity-50"
                >
                  {saving ? (pt ? "Salvando..." : "Saving...") : (pt ? "Salvar cenário" : "Save scenario")}
                </button>
                {message && <p className="text-sm">{message}</p>}
              </section>
            </div>
            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
              <section className="card p-6">
                <h2 className="text-xl font-semibold">
                  {pt ? "Por que esta projeção mudou?" : "Why did this projection change?"}
                </h2>
                <ul className="mt-4 space-y-2 text-sm text-muted">
                  {workouts > 0 && (
                    <li>
                      +{workouts} {pt ? `treino${workouts > 1 ? "s" : ""} por semana` : `workout${workouts > 1 ? "s" : ""} per week`}
                    </li>
                  )}
                  {sleep > 0 && <li>+{sleep} {pt ? "minutos de sono" : "minutes of sleep"}</li>}
                  {protein > 0 && <li>+{protein} g {pt ? "de proteína" : "of protein"}</li>}
                  {steps > 0 && (
                    <li>+{steps.toLocaleString(locale)} {pt ? "passos por dia" : "steps per day"}</li>
                  )}
                  {!workouts && !sleep && !protein && !steps && (
                    <li>{pt ? "Os controles ainda refletem sua trajetória atual." : "The controls still reflect your current trajectory."}</li>
                  )}
                </ul>
              </section>
              <section className="card p-6 text-sm text-muted">
                <p>
                  {pt ? "Peso mais recente: " : "Latest weight: "}
                  {baseline.weight !== null
                    ? `${baseline.weight} kg`
                    : (pt ? "não registrado" : "not recorded")}
                </p>
                <p className="mt-2">
                  {pt ? "Treinos por semana: " : "Workouts per week: "}{baseline.workoutsPerWeek.toFixed(1)}
                </p>
                <p className="mt-2">
                  {pt ? "Média de sono: " : "Average sleep: "}
                  {baseline.sleepHours !== null
                    ? `${baseline.sleepHours.toFixed(1)} h`
                    : (pt ? "não registrada" : "not recorded")}
                </p>
              </section>
            </div>
          </>
        )}
        <p className="text-sm text-muted">
          {pt ? "Projeções educativas baseadas nos registros enviados. Elas não substituem orientação profissional." : "Educational projections based on submitted records. They do not replace professional guidance."}
        </p>
      </div>
    </AppShell>
  );
}
function Range({
  label,
  value,
  set,
  max,
}: {
  label: string;
  value: number;
  set: (n: number) => void;
  max: number;
}) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between">
        <span>{label}</span>
        <b className="text-acid">+{value}</b>
      </span>
      <input
        type="range"
        min="0"
        max={max}
        step={max > 500 ? 500 : max > 100 ? 10 : 1}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="mt-3 w-full accent-[#A8FF2A]"
      />
    </label>
  );
}
