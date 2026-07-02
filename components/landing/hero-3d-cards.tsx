"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Dumbbell, RefreshCw, Sparkles, Timer, TrendingUp } from "lucide-react";
import { useState } from "react";

export function Hero3DCards({locale="en"}:{locale?:string}) {
  const reduced = useReducedMotion();
  const [finePointer, setFinePointer] = useState(false);
  const x = useSpring(useMotionValue(0), { stiffness: 100, damping: 24 });
  const y = useSpring(useMotionValue(0), { stiffness: 100, damping: 24 });
  const rotateY = useTransform(x, [-1, 1], [-2, 2]);
  const rotateX = useTransform(y, [-1, 1], [2, -2]);

  function enter() {
    setFinePointer(window.matchMedia("(pointer:fine)").matches && !reduced);
  }
  function move(event: React.MouseEvent<HTMLDivElement>) {
    if (!finePointer) return;
    const box = event.currentTarget.getBoundingClientRect();
    x.set(((event.clientX - box.left) / box.width - 0.5) * 2);
    y.set(((event.clientY - box.top) / box.height - 0.5) * 2);
  }
  function leave() { x.set(0); y.set(0); }

  return (
    <motion.div
      onMouseEnter={enter}
      onMouseMove={move}
      onMouseLeave={leave}
      style={{ rotateX, rotateY, x: useTransform(x, [-1, 1], [-8, 8]), y: useTransform(y, [-1, 1], [-5, 5]), perspective: 1200 }}
      className="relative z-10 mx-auto mt-16 grid w-full max-w-6xl gap-5 md:mt-20 md:h-[530px] md:grid-cols-3 md:items-center md:[transform-style:preserve-3d]"
      aria-label="PSFIT product dashboard previews"
    >
      <FloatCard side="left" reduced={!!reduced}><WorkoutCard locale={locale}/></FloatCard>
      <FloatCard side="center" reduced={!!reduced}><PerformanceCard locale={locale}/></FloatCard>
      <FloatCard side="right" reduced={!!reduced}><TwinCard locale={locale}/></FloatCard>
    </motion.div>
  );
}

function FloatCard({ side, reduced, children }: { side: "left"|"center"|"right"; reduced: boolean; children: React.ReactNode }) {
  const left = side === "left", center = side === "center";
  return (
    <motion.article
      initial={reduced ? { opacity: 0 } : { opacity: 0, x: left ? -90 : center ? 0 : 90, y: center ? 70 : 45, scale: center ? .9 : .94, rotateY: left ? 18 : center ? 0 : -18, rotateZ: left ? -5 : center ? 0 : 5 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0, y: [0, center ? -7 : 6, 0], scale: 1, rotateY: left ? 10 : center ? 0 : -10, rotateZ: left ? -3 : center ? 0 : 3 }}
      transition={{ opacity: { duration: .75, delay: center ? .05 : left ? .2 : .34 }, x: { duration: .85, delay: center ? .05 : left ? .2 : .34, ease: [0.22,1,0.36,1] }, scale: { duration: .8 }, y: reduced ? { duration: 0 } : { duration: center ? 6.5 : 7.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: center ? .8 : 1.1 } }}
      whileHover={reduced ? undefined : { y: -8, rotateY: 0, rotateX: 0, rotateZ: 0, transition: { duration: .3 } }}
      className={`group relative rounded-[30px] border border-white/[.1] bg-[#090c0a] text-left shadow-[0_25px_70px_rgba(0,0,0,.6)] transition-colors hover:border-white/20 md:[transform-style:preserve-3d] ${center ? "z-20 p-6 shadow-[0_30px_90px_rgba(0,0,0,.75),0_0_55px_rgba(168,255,42,.08)] md:-mx-12 md:min-h-[500px] md:p-7" : "z-10 p-5 md:min-h-[410px] md:p-6"} ${left ? "md:translate-x-8" : side === "right" ? "md:-translate-x-8" : ""}`}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-[30px] opacity-[.025] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:8px_8px]" />
      <div className="relative">{children}</div>
    </motion.article>
  );
}

function text(locale:string,en:string,pt:string,es:string){return locale==="pt"?pt:locale==="es"?es:en}
function PerformanceCard({locale}:{locale:string}) {
  return <><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-acid">{text(locale,"Daily Performance","Desempenho diário","Rendimiento diario")}</p><h3 className="mt-2 font-display text-2xl">{text(locale,"Good morning, Alex","Bom dia, Alex","Buenos días, Alex")}</h3></div><Sparkles className="text-acid" size={19}/></div>
    <div className="mt-7 grid grid-cols-[110px_1fr] items-center gap-5"><div className="relative grid size-28 place-items-center rounded-full bg-[conic-gradient(#A8FF2A_0_84%,rgba(255,255,255,.07)_84%)]"><div className="grid size-[92px] place-items-center rounded-full bg-[#090c0a] text-center"><div><p className="text-3xl font-semibold">84</p><p className="text-[9px] text-muted">READINESS</p></div></div></div><div className="space-y-3"><Stat label="Momentum Score" value="91" tone="text-acid"/><Stat label="Weekly direction" value="Strong" tone="text-aqua"/></div></div>
    <div className="mt-6 rounded-2xl border border-white/[.08] bg-[#101512] p-4"><p className="text-[9px] tracking-widest text-muted">{text(locale,"TODAY’S WORKOUT","TREINO DE HOJE","ENTRENAMIENTO DE HOY")}</p><div className="mt-3 flex items-end justify-between"><div><p className="font-semibold">{text(locale,"Upper Body Strength","Força de superiores","Fuerza de torso")}</p><p className="mt-1 text-xs text-muted">48 min · 6 {text(locale,"exercises","exercícios","ejercicios")}</p></div><button className="rounded-full bg-acid px-4 py-2 text-xs font-bold text-[#030504]">{text(locale,"Start Workout","Iniciar treino","Iniciar entrenamiento")}</button></div></div>
    <div className="mt-5 grid grid-cols-2 gap-4"><Bar label="Calories" value="1,420 / 2,180" width="65%"/><Bar label="Protein" value="112 / 146g" width="77%"/></div>
    <p className="mt-6 rounded-xl bg-acid/[.07] p-3 text-xs text-acid">Your momentum is 8% stronger than last week.</p></>;
}
function WorkoutCard({locale}:{locale:string}) {
 return <><div className="flex justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-acid">{text(locale,"Adaptive Workout","Treino adaptativo","Entrenamiento adaptativo")}</p><h3 className="mt-3 font-display text-2xl">{text(locale,"Bench Press","Supino reto","Press de banca")}</h3><p className="mt-1 text-xs text-muted">{text(locale,"Set 3 of 4","Série 3 de 4","Serie 3 de 4")}</p></div><div className="grid size-10 place-items-center rounded-xl bg-acid/10"><Dumbbell className="text-acid" size={19}/></div></div>
  <div className="mt-7 grid grid-cols-2 gap-3"><Stat label="Suggested" value="72.5 kg" tone="text-acid"/><Stat label="Reps" value="8"/></div>
  <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[.08] p-4"><span className="flex items-center gap-2 text-xs text-muted"><Timer size={15}/>Rest Timer</span><span className="font-mono text-xl">01:24</span></div>
  <div className="mt-5"><div className="flex justify-between text-[10px] text-muted"><span>LOAD PROGRESSION</span><span className="text-acid">+6%</span></div><svg viewBox="0 0 260 65" className="mt-2 w-full"><path d="M2 58 C40 55 55 49 82 51 S125 37 151 39 S190 28 218 25 S244 13 258 8" fill="none" stroke="#A8FF2A" strokeWidth="2.5"/><path d="M2 58 C40 55 55 49 82 51 S125 37 151 39 S190 28 218 25 S244 13 258 8 V65 H2Z" fill="url(#loadFade)"/><defs><linearGradient id="loadFade" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#A8FF2A" stopOpacity=".16"/><stop offset="1" stopColor="#A8FF2A" stopOpacity="0"/></linearGradient></defs></svg></div>
  <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-white/10 py-2.5 text-xs"><RefreshCw size={13}/>Replace exercise</button></>;
}
function TwinCard({locale}:{locale:string}) {
 return <><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-aqua">PSFIT Twin</p><h3 className="mt-3 font-display text-2xl">{text(locale,"Your next 12 weeks","Suas próximas 12 semanas","Tus próximas 12 semanas")}</h3></div><TrendingUp className="text-aqua" size={19}/></div>
  <div className="mt-7 h-32 border-b border-l border-white/[.08]"><svg viewBox="0 0 280 120" preserveAspectRatio="none" className="size-full"><path d="M0 106 C55 101 87 88 128 84 S203 66 280 52" fill="none" stroke="#727973" strokeWidth="2" strokeDasharray="5 5"/><path d="M0 106 C48 97 89 82 127 72 S200 41 280 18" fill="none" stroke="#35D9F5" strokeWidth="3"/></svg></div>
  <div className="mt-3 flex gap-4 text-[9px]"><span className="text-muted">● Current Path</span><span className="text-aqua">● Optimized Path</span></div>
  <p className="mt-6 text-sm leading-6">Optimized habits could bring your goal closer.</p><div className="mt-4 flex flex-wrap gap-2">{["+1 weekly workout","+45 min sleep","Protein goal"].map(x=><span key={x} className="rounded-full border border-aqua/15 bg-aqua/[.06] px-2.5 py-1 text-[9px] text-aqua">{x}</span>)}</div><p className="mt-5 text-[9px] leading-4 text-muted">Scenario estimates are informational and not guaranteed outcomes.</p></>;
}
function Stat({label,value,tone=""}:{label:string;value:string;tone?:string}){return <div className="rounded-xl border border-white/[.07] bg-white/[.02] p-3"><p className="text-[9px] text-muted">{label}</p><p className={`mt-1 font-semibold ${tone}`}>{value}</p></div>}
function Bar({label,value,width}:{label:string;value:string;width:string}){return <div><div className="flex justify-between gap-2 text-[9px]"><span className="text-muted">{label}</span><span>{value}</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[.07]"><div className="h-full rounded-full bg-acid" style={{width}}/></div></div>}
