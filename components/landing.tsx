"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe2,
  Menu,
  Orbit,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useState } from "react";
import { PsfitLogo } from "./brand/psfit-logo";
import { PricingSection } from "./billing/pricing-section";
import { LanguageSelector } from "./language-selector";
import { Hero3DCards } from "./landing/hero-3d-cards";
import { Progress } from "./ui";

const featureLinks = [
  "Adaptive Training",
  "Smart Nutrition",
  "Real-Life Mode",
  "Progress Tracking",
  "Recovery",
  "PSFIT Twin",
];
const featureLinksPt = [
  "Treino adaptativo",
  "Nutrição inteligente",
  "Modo Vida Real",
  "Acompanhamento de progresso",
  "Recuperação",
  "PSFIT Twin",
];
const situations = [
  [
    "Only 20 minutes available",
    "A focused 12-minute strength block replaces the full session.",
    "12 min · 3 movements",
  ],
  [
    "Training away from home",
    "The same movement goals are rebuilt for a hotel room.",
    "24 min · bodyweight",
  ],
  [
    "Low energy today",
    "Volume lowers while the habit and key movement pattern stay intact.",
    "RPE 6 · reduced volume",
  ],
  [
    "No access to equipment",
    "Equipment-dependent exercises switch to matched alternatives.",
    "No equipment needed",
  ],
];
const impacts = [
  [
    "train one extra day",
    "One additional weekly workout could improve projected consistency by 12%.",
    "+12% consistency",
  ],
  [
    "sleep one extra hour",
    "A steadier sleep window may improve readiness before high-volume sessions.",
    "Readiness trend ↑",
  ],
  [
    "reach the protein goal",
    "Reaching your protein range adds a positive recovery signal to this scenario.",
    "Recovery support ↑",
  ],
  [
    "walk 2,000 more steps",
    "Two thousand additional daily steps may support your activity target.",
    "Weekly activity ↑",
  ],
  [
    "complete a Minimum Win",
    "A Minimum Win today protects continuity without forcing a full session.",
    "Momentum protected",
  ],
];

const landingCopy = {
  pt: {
    how: "Como funciona",
    features: "Recursos",
    pricing: "Planos",
    community: "Comunidade",
    start: "Começar",
    eyebrow: "Feito para rotinas reais",
    powered: "Impulsionado por inteligência adaptativa",
    line1: "Sua evolução não deveria estar",
    accent: "dividida em vários aplicativos.",
    line3: "",
    mobile: "Sua evolução.",
    mobileAccent: "Tudo em um só lugar.",
    tagline: "Treinos personalizados, alimentação, recuperação e progresso em uma única plataforma.",
    description:
      "O PSFIT reúne o que você precisa para evoluir com consistência, respeitando sua rotina e seus objetivos.",
    free: "Começar gratuitamente",
    explore: "Conhecer o PSFIT Pro",
  },
  en: {
    how: "How It Works",
    features: "Features",
    pricing: "Pricing",
    community: "Community",
    start: "Get started",
    eyebrow: "Built for real routines",
    powered: "Powered by adaptive intelligence",
    line1: "Training, nutrition and",
    accent: "real-life progress.",
    line3: "In one adaptive system.",
    mobile: "Your fitness.",
    mobileAccent: "Adapted to real life.",
    tagline: "Your plan should change when your day changes.",
    description:
      "PSFIT adapts your workouts, nutrition and recovery to your schedule, energy and available equipment — while PSFIT Twin shows where your current habits may take you.",
    free: "Start for free",
    explore: "Explore PSFIT Twin",
  },
  es: {
    how: "Cómo funciona",
    features: "Funciones",
    pricing: "Planes",
    community: "Comunidad",
    start: "Comenzar",
    eyebrow: "Creado para rutinas reales",
    powered: "Impulsado por inteligencia adaptativa",
    line1: "Entrenamiento, nutrición y",
    accent: "progreso en la vida real.",
    line3: "En un sistema adaptativo.",
    mobile: "Tu fitness.",
    mobileAccent: "Adaptado a la vida real.",
    tagline: "Tu plan debe cambiar cuando cambia tu día.",
    description:
      "PSFIT adapta tus entrenamientos, nutrición y recuperación a tu horario, energía y equipo disponible, mientras PSFIT Twin muestra adónde pueden llevarte tus hábitos actuales.",
    free: "Comenzar gratis",
    explore: "Explorar PSFIT Twin",
  },
} as const;

export default function Landing() {
  const locale = useLocale();
  const copy =
    landingCopy[locale as keyof typeof landingCopy] ?? landingCopy.pt;
  const shownFeatureLinks = locale === "pt" ? featureLinksPt : featureLinks;
  const shownSituations =
    locale === "pt"
      ? [
          [
            "Só tenho 20 minutos",
            "Um bloco focado de força de 12 minutos substitui a sessão completa.",
            "12 min · 3 movimentos",
          ],
          [
            "Treino fora de casa",
            "Os mesmos objetivos de movimento são adaptados para o espaço disponível.",
            "24 min · peso corporal",
          ],
          [
            "Pouca energia hoje",
            "O volume diminui, preservando o hábito e o movimento principal.",
            "RPE 6 · volume reduzido",
          ],
          [
            "Sem acesso a equipamentos",
            "Exercícios que exigem equipamentos são trocados por alternativas equivalentes.",
            "Nenhum equipamento necessário",
          ],
        ]
      : locale === "es"
        ? [
            [
              "Solo tengo 20 minutos",
              "Un bloque de fuerza enfocado de 12 minutos reemplaza la sesión completa.",
              "12 min · 3 movimientos",
            ],
            [
              "Entreno fuera de casa",
              "Los mismos objetivos se adaptan al espacio disponible.",
              "24 min · peso corporal",
            ],
            [
              "Poca energía hoy",
              "El volumen disminuye, preservando el hábito y el movimiento principal.",
              "RPE 6 · volumen reducido",
            ],
            [
              "Sin acceso a equipamiento",
              "Los ejercicios se cambian por alternativas equivalentes.",
              "Sin equipamiento",
            ],
          ]
        : situations;
  const shownImpacts =
    locale === "pt"
      ? [
          [
            "treinar mais um dia",
            "Um treino semanal adicional pode melhorar a consistência projetada em 12%.",
            "+12% de consistência",
          ],
          [
            "dormir uma hora a mais",
            "Uma rotina de sono mais estável pode melhorar a prontidão.",
            "Prontidão em alta",
          ],
          [
            "atingir a meta de proteína",
            "Atingir sua faixa de proteína adiciona um sinal positivo de recuperação.",
            "Apoio à recuperação",
          ],
          [
            "caminhar mais 2.000 passos",
            "Dois mil passos diários adicionais podem apoiar sua meta de atividade.",
            "Atividade em alta",
          ],
          [
            "concluir uma Vitória Mínima",
            "Uma Vitória Mínima protege a continuidade sem exigir uma sessão completa.",
            "Ritmo protegido",
          ],
        ]
      : locale === "es"
        ? [
            [
              "entrenar un día más",
              "Un entrenamiento semanal adicional podría mejorar la constancia proyectada un 12%.",
              "+12% de constancia",
            ],
            [
              "dormir una hora más",
              "Una rutina de sueño más estable puede mejorar tu preparación.",
              "Preparación en alza",
            ],
            [
              "alcanzar la meta de proteína",
              "Alcanzar tu rango de proteína añade una señal positiva de recuperación.",
              "Apoyo a la recuperación",
            ],
            [
              "caminar 2.000 pasos más",
              "Dos mil pasos diarios adicionales pueden apoyar tu meta de actividad.",
              "Actividad en alza",
            ],
            [
              "completar una Victoria Mínima",
              "Una Victoria Mínima protege la continuidad sin exigir una sesión completa.",
              "Ritmo protegido",
            ],
          ]
        : impacts;
  const [menu, setMenu] = useState(false);
  const [features, setFeatures] = useState(false);
  const [situation, setSituation] = useState(0);
  const [impact, setImpact] = useState(0);

  return (
    <div className="overflow-hidden bg-ink">
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-[max(.75rem,env(safe-area-inset-top))] sm:px-4 sm:pt-4">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between rounded-2xl border border-white/[.09] bg-ink/80 px-4 shadow-2xl backdrop-blur-xl sm:px-5">
          <PsfitLogo />
          <nav className="hidden items-center gap-1 rounded-full border border-white/[.08] bg-[#050705] p-1.5 xl:flex">
            <NavLink href="#how">{copy.how}</NavLink>
            <div className="relative">
              <button
                onClick={() => setFeatures(!features)}
                aria-expanded={features}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs text-muted hover:text-paper"
              >
                {copy.features} <ChevronDown size={13} />
              </button>
              <AnimatePresence>
                {features && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute left-0 top-12 w-56 rounded-2xl border border-white/10 bg-surface p-2 shadow-2xl"
                  >
                    {shownFeatureLinks.map((item) => (
                      <a
                        onClick={() => setFeatures(false)}
                        key={item}
                        href={item === "PSFIT Twin" ? "#twin" : "#features"}
                        className="block rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-white/[.05] hover:text-paper"
                      >
                        {item}
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <NavLink href="#twin">PSFIT Twin</NavLink>
            <NavLink href="#pricing">{copy.pricing}</NavLink>
            <NavLink href="#community">{copy.community}</NavLink>
            <NavLink href="/signup">{copy.start}</NavLink>
          </nav>
          <div className="hidden items-center gap-2 text-xs sm:flex">
            <Globe2 size={15} className="text-muted" />
            <LanguageSelector />
          </div>
          <button
            onClick={() => setMenu(true)}
            aria-label={locale === "pt" ? "Abrir menu" : "Open menu"}
            className="sm:hidden"
          >
            <Menu />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] overflow-y-auto bg-ink px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:hidden"
          >
            <div className="flex justify-between">
              <PsfitLogo />
              <button onClick={() => setMenu(false)} aria-label={locale === "pt" ? "Fechar menu" : "Close menu"}>
                <X />
              </button>
            </div>
            <nav className="mt-20 space-y-1">
              {[
                copy.how,
                copy.features,
                "PSFIT Twin",
                copy.pricing,
                copy.community,
              ].map((item, index) => (
                <a
                  onClick={() => setMenu(false)}
                  key={item}
                  href={["#how","#features","#twin","#pricing","#community"][index]}
                  className="block border-b border-white/10 py-4 font-display text-2xl"
                >
                  {item}
                </a>
              ))}
            </nav>
            <Link
              href="/signup"
              className="mt-10 block rounded-full bg-acid py-4 text-center font-bold text-ink"
            >
              {copy.free}
            </Link>
            <div className="mt-8 flex items-center gap-3 text-sm">
              <Globe2 size={17} />
              <LanguageSelector />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        <section
          className="relative min-h-[900px] px-4 pb-20 pt-32 sm:min-h-[980px] sm:px-5 sm:pb-28 sm:pt-40"
          id="how"
        >
          <div className="hero-dot-grid absolute inset-0 opacity-25" />
          <div className="absolute left-1/2 top-[48%] h-[520px] w-[700px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-acid/10 blur-[150px]" />
          <div className="absolute right-[12%] top-[58%] h-[280px] w-[280px] rounded-full bg-aqua/10 blur-[130px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_18%,#030504_84%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-ink" />
          <span className="absolute left-[16%] top-[42%] size-1 animate-pulse rounded-full bg-acid/70 shadow-[0_0_15px_rgba(168,255,42,.5)]" />
          <span className="absolute right-[18%] top-[35%] size-1 rounded-full bg-aqua/70 shadow-[0_0_15px_rgba(53,217,245,.45)]" />
          <div className="relative z-10 mx-auto text-center">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs tracking-wide text-muted"
            >
              <span className="text-acid">✦</span> {copy.eyebrow}{" "}
              <span className="mx-2 text-white/20">·</span> {copy.powered}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mx-auto mt-7 hidden max-w-5xl font-display text-[clamp(3.7rem,7vw,7.4rem)] font-medium leading-[.9] tracking-[-.065em] sm:block"
            >
              {copy.line1}
              <br />
              <span className="text-acid">{copy.accent}</span>
              <br />
              {copy.line3}
            </motion.h1>
            <h1 className="mx-auto mt-7 font-display text-[clamp(3rem,14vw,3.7rem)] font-medium leading-[.94] tracking-[-.06em] sm:hidden">
              {copy.mobile}
              <br />
              <span className="text-acid">{copy.mobileAccent}</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl font-serif text-2xl italic text-[#c5cbc7] sm:text-3xl">
              {copy.tagline}
            </p>
            <p className="mx-auto mt-6 max-w-[680px] text-sm leading-7 text-muted sm:text-base">
              {copy.description}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-acid px-6 py-3.5 text-sm font-bold text-ink transition hover:bg-[#86E817] hover:shadow-[0_0_28px_rgba(168,255,42,.22)]"
              >
                {copy.free}{" "}
                <ArrowRight
                  className="transition group-hover:translate-x-1"
                  size={16}
                />
              </Link>
              <Link
                href="/twin"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-acid/35 bg-ink px-6 py-3.5 text-sm font-semibold hover:border-acid"
              >
                <Orbit size={16} className="text-acid" />
                {copy.explore}
              </Link>
            </div>
          </div>
          <Hero3DCards locale={locale} />
        </section>

        <section
            className="relative z-30 mx-auto max-w-7xl px-4 py-20 sm:px-5 sm:py-28"
          id="features"
        >
          <div className="text-center">
            <p className="eyebrow">
              {locale === "pt"
                ? "Modo Vida Real"
                : locale === "es"
                  ? "Modo Vida Real"
                  : "Real-Life Mode"}
            </p>
            <h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-medium tracking-tight sm:text-6xl">
              {locale === "pt"
                ? "Um sistema fitness feito para dias imperfeitos."
                : locale === "es"
                  ? "Un sistema fitness creado para días imperfectos."
                  : "A fitness system built around imperfect days."}
            </h2>
          </div>
          <div className="mt-14 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
            <div className="space-y-2">
              {shownSituations.map(([name], i) => (
                <button
                  onClick={() => setSituation(i)}
                  key={name}
                  className={`w-full rounded-2xl border p-5 text-left transition ${situation === i ? "border-acid bg-acid text-ink" : "border-white/[.09] bg-surface text-muted hover:text-paper"}`}
                >
                  <span className="mr-4 text-xs opacity-60">0{i + 1}</span>
                  <span className="font-semibold">{name}</span>
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={situation}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[2rem] border border-white/[.09] bg-raised p-7 sm:p-10"
              >
                <p className="text-xs uppercase tracking-[.2em] text-acid">
                  {locale === "pt"
                    ? "Plano adaptado instantaneamente"
                    : locale === "es"
                      ? "Plan adaptado al instante"
                      : "Plan adapted instantly"}
                </p>
                <h3 className="mt-7 font-display text-3xl font-medium sm:text-4xl">
                  {shownSituations[situation][1]}
                </h3>
                <div className="mt-10 rounded-2xl border border-white/10 bg-surface p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {locale === "pt"
                        ? "Plano ajustado de hoje"
                        : locale === "es"
                          ? "Plan ajustado de hoy"
                          : "Today’s adjusted plan"}
                    </span>
                    <Zap size={18} className="text-acid" />
                  </div>
                  <p className="mt-6 text-2xl font-semibold">
                    {shownSituations[situation][2]}
                  </p>
                  <Progress value={72} />
                  <p className="mt-4 text-xs text-muted">
                    {locale === "pt"
                      ? "Objetivo preservado · Intensidade recalibrada"
                      : locale === "es"
                        ? "Objetivo preservado · Intensidad recalibrada"
                        : "Training purpose preserved · Intensity recalibrated"}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        <section
          id="twin"
          className="border-y border-white/[.07] bg-raised py-20 sm:py-28"
        >
          <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <p className="eyebrow">
                PSFIT Twin ·{" "}
                {locale === "pt"
                  ? "Cenário ao vivo"
                  : locale === "es"
                    ? "Escenario en vivo"
                    : "Live scenario"}
              </p>
              <h2 className="mt-5 font-display text-3xl font-medium tracking-tight sm:text-5xl">
                {locale === "pt"
                  ? "O que muda se eu..."
                  : locale === "es"
                    ? "Qué cambia si yo..."
                    : "What changes if I..."}
              </h2>
              <p className="mt-5 leading-7 text-muted">
                {locale === "pt"
                  ? "Explore como um comportamento pode afetar sua direção. Feito para informar decisões, nunca prometer resultados."
                  : locale === "es"
                    ? "Explora cómo un comportamiento puede afectar tu dirección. Creado para informar decisiones, nunca prometer resultados."
                    : "Explore how one behavior might affect your direction. Built to inform decisions, never promise outcomes."}
              </p>
              <div className="mt-8 space-y-2">
                {shownImpacts.map(([name], i) => (
                  <button
                    onClick={() => setImpact(i)}
                    key={name}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm ${impact === i ? "border-acid bg-acid/10 text-paper" : "border-white/[.08] text-muted"}`}
                  >
                    <span>{name}</span>
                    {impact === i && <Check size={16} className="text-acid" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/[.09] bg-surface p-6 sm:p-10">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted">
                    {locale === "pt"
                      ? "Caminho otimizado"
                      : locale === "es"
                        ? "Camino optimizado"
                        : "Optimized Path"}
                  </p>
                  <p className="mt-2 font-display text-3xl">
                    {shownImpacts[impact][2]}
                  </p>
                </div>
                <Sparkles className="text-aqua" />
              </div>
              <Projection variant={impact} />
              <motion.p
                key={impact}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-7 text-lg leading-8"
              >
                {shownImpacts[impact][1]}
              </motion.p>
              <p className="mt-4 text-xs leading-5 text-muted">
                {locale === "pt"
                  ? "As projeções são estimativas informativas, não garantias ou orientação médica."
                  : locale === "es"
                    ? "Las proyecciones son estimaciones informativas, no garantías ni orientación médica."
                    : "Scenario projections are estimates based on available inputs. They are not guarantees or medical advice."}
              </p>
            </div>
          </div>
        </section>

        <section id="community" className="mx-auto max-w-7xl px-4 py-20 sm:px-5 sm:py-28">
          <div className="grid gap-px overflow-hidden rounded-[2rem] border border-white/[.08] bg-white/[.08] md:grid-cols-3">
            {(locale === "pt"
              ? [
                  [
                    "Treino",
                    "Planos progressivos que se adaptam ao tempo, equipamento e recuperação.",
                  ],
                  [
                    "Nutrição",
                    "Metas claras e alternativas úteis, sem complicação.",
                  ],
                  [
                    "Comunidade",
                    "Grupos privados unidos por objetivos compartilhados.",
                  ],
                ]
              : locale === "es"
                ? [
                    [
                      "Entrenamiento",
                      "Planes progresivos que se adaptan al tiempo, equipo y recuperación.",
                    ],
                    [
                      "Nutrición",
                      "Objetivos claros y alternativas útiles sin complicaciones.",
                    ],
                    [
                      "Comunidad",
                      "Grupos privados unidos por objetivos compartidos.",
                    ],
                  ]
                : [
                    [
                      "Training",
                      "Progressive plans that reshape around time, equipment and recovery.",
                    ],
                    [
                      "Nutrition",
                      "Clear targets and useful alternatives without spreadsheet fatigue.",
                    ],
                    [
                      "Community",
                      "Private Crews built around shared goals, not public performance.",
                    ],
                  ]
            ).map(([title, text]) => (
              <div className="bg-surface p-8 sm:p-10" key={title}>
                <p className="text-sm text-acid">{title}</p>
                <p className="mt-16 font-display text-2xl">{text}</p>
                <Link
                  href="/signup"
                  className="mt-7 inline-flex items-center gap-2 text-sm text-muted hover:text-paper"
                >
                  {locale === "pt"
                    ? "Explorar"
                    : locale === "es"
                      ? "Explorar"
                      : "Explore"}{" "}
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <PricingSection />
      </main>

      <footer className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-white/[.07] px-5 py-10 text-sm text-muted sm:flex-row sm:justify-between">
        <PsfitLogo />
        <div className="flex gap-5">
          <Link href="/privacy">{locale === "pt" ? "Privacidade" : "Privacy"}</Link>
          <Link href="/terms">{locale === "pt" ? "Termos" : "Terms"}</Link>
          <Link href="/pricing">{copy.pricing}</Link>
        </div>
      </footer>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="rounded-full px-4 py-2 text-xs text-muted transition hover:bg-white/[.05] hover:text-paper"
    >
      {children}
    </a>
  );
}
function Projection({ variant }: { variant: number }) {
  const lift = variant * 2;
  return (
    <div className="relative mt-7 h-64 border-b border-l border-white/10">
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <path
          d={`M0 85 C80 80 130 ${70 - lift} 190 ${55 - lift} S300 ${30 - lift} 420 8`}
          vectorEffect="non-scaling-stroke"
          fill="none"
          stroke="#35D9F5"
          strokeWidth="3"
        />
        <path
          d="M0 88 C100 84 180 80 260 70 S350 65 420 54"
          vectorEffect="non-scaling-stroke"
          fill="none"
          stroke="#777"
          strokeWidth="2"
          strokeDasharray="5 6"
        />
      </svg>
    </div>
  );
}
