"use client";

import { buildPsfitPlan } from "@/app/internal-actions";
import { generateDefaultWorkoutPlan, type TrainingInput } from "@/lib/onboarding/generate-default-workout";
import { buildTrainingSchedule } from "@/lib/training/schedule";
import { coachingStyleForForm, normalizePreferredTime } from "@/lib/training/preference-values";
import type { TrainingPreferenceRow } from "@/types/database";
import { Activity, Dumbbell, HeartPulse, Home, MapPin, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

const goals = [
  ["muscle_gain","Ganhar massa muscular"],["fat_loss","Perder gordura"],
  ["conditioning","Melhorar condicionamento"],["strength","Ganhar força"],
  ["maintain","Manter a forma"],["mobility","Melhorar mobilidade"],
] as const;
const levels = [["beginner","Iniciante"],["intermediate","Intermediário"],["advanced","Avançado"]] as const;
const locations = [["gym","Academia"],["home","Casa"],["outdoor","Ao ar livre"]] as const;
const equipment = [
  ["full_gym","Academia completa"],["bodyweight","Peso corporal"],["dumbbells","Halteres"],
  ["barbell","Barra e anilhas"],["bands","Elásticos"],["machines","Máquinas"],
  ["cables","Cabos"],["bench","Banco"],["pull_up_bar","Barra fixa"],
  ["treadmill","Esteira"],["bike","Bicicleta"],
] as const;
const days = [["monday","Seg"],["tuesday","Ter"],["wednesday","Qua"],["thursday","Qui"],["friday","Sex"],["saturday","Sáb"],["sunday","Dom"]] as const;
const dayLong:Record<string,string>={monday:"Segunda-feira",tuesday:"Terça-feira",wednesday:"Quarta-feira",thursday:"Quinta-feira",friday:"Sexta-feira",saturday:"Sábado",sunday:"Domingo"};
const focuses = [
  ["full_body","Corpo inteiro"],["chest","Peito"],["back","Costas"],["shoulders","Ombros"],
  ["biceps","Bíceps"],["triceps","Tríceps"],["legs","Pernas"],["glutes","Glúteos"],
  ["hamstrings","Posteriores"],["calves","Panturrilhas"],["core","Core"],
] as const;
const limitations = [
  ["no_limitations","Nenhuma limitação"],["shoulder_discomfort","Ombro"],["elbow_discomfort","Cotovelo"],
  ["wrist_discomfort","Punho"],["lower_back_discomfort","Lombar"],["hip_discomfort","Quadril"],
  ["knee_discomfort","Joelho"],["ankle_discomfort","Tornozelo"],["other","Outra"],
] as const;
const coaching = [["direct","Direto"],["motivational","Motivador"],["supportive","Acolhedor"],["technical","Técnico"]] as const;
const workoutNames:Record<string,string>={
  full_body_a:"Corpo inteiro A",full_body_b:"Corpo inteiro B",upper:"Superiores",
  lower:"Inferiores",full_body:"Corpo inteiro",upper_a:"Superiores A",upper_b:"Superiores B",
  lower_a:"Inferiores A",lower_b:"Inferiores B",push:"Empurrar",pull:"Puxar",legs:"Pernas",
  push_a:"Empurrar A",pull_a:"Puxar A",legs_a:"Pernas A",push_b:"Empurrar B",
  pull_b:"Puxar B",legs_b:"Pernas B",mobility:"Mobilidade",conditioning:"Condicionamento",
};
const focusNames:Record<string,string>={
  chest_shoulders_triceps:"Peito, ombros e tríceps",back_biceps:"Costas e bíceps",
  legs_glutes_core:"Pernas, glúteos e core",chest_back_shoulders_arms:"Peito, costas, ombros e braços",
  mobility_core:"Mobilidade e core",cardio_full_body:"Cardio e corpo inteiro",full_body:"Corpo inteiro",
};

type BuilderInput=TrainingInput&{preferred_time?:string;limitation_notes?:string};

export function PlanBuilder({initial}:{initial:TrainingPreferenceRow|null}) {
  const [step,setStep]=useState(1);
  const [error,setError]=useState("");
  const [input,setInput]=useState<BuilderInput>({
    primary_goal:initial?.primary_goal??"muscle_gain",
    experience_level:initial?.experience_level??"beginner",
    training_location:initial?.training_location??"gym",
    equipment:initial?.equipment?.length?initial.equipment:["full_gym"],
    days_per_week:Math.min(6,Math.max(2,initial?.days_per_week??4)),
    session_duration_minutes:initial?.session_duration_minutes??45,
    preferred_days:initial?.preferred_days??[],
    preferred_time:normalizePreferredTime(initial?.preferred_time)??"",
    focus_areas:initial?.focus_areas?.length?initial.focus_areas:["full_body"],
    limitations:initial?.limitations?.length?initial.limitations:["no_limitations"],
    limitation_notes:initial?.limitation_notes??"",
    coaching_style:coachingStyleForForm(initial?.coaching_style),
  });
  const set=<K extends keyof BuilderInput>(key:K,value:BuilderInput[K])=>setInput(current=>({...current,[key]:value}));
  const toggle=(key:"equipment"|"focus_areas"|"limitations",value:string)=>{
    setInput(current=>{
      let values=current[key];
      if(key==="limitations"){
        if(value==="no_limitations") values=["no_limitations"];
        else values=[...values.filter(item=>item!=="no_limitations"),value];
      } else values=values.includes(value)?values.filter(item=>item!==value):[...values,value];
      if(key==="limitations"&&value!=="no_limitations"&&current[key].includes(value)) values=values.length?values:["no_limitations"];
      return {...current,[key]:values};
    });
  };
  const chooseDay=(value:string)=>{
    const selected=input.preferred_days??[];
    if(selected.includes(value)) set("preferred_days",selected.filter(day=>day!==value));
    else if(selected.length<input.days_per_week) set("preferred_days",[...selected,value]);
  };
  const validation=()=>{
    if(step===1&&(!input.primary_goal||!input.experience_level||!input.training_location||!input.equipment.length)) return "Preencha objetivo, experiência, local e equipamentos.";
    if(step===2&&(input.days_per_week<2||(input.preferred_days?.length??0)!==input.days_per_week)) return `Selecione exatamente ${input.days_per_week} dias da semana.`;
    if(step===3&&(!input.focus_areas.length||!input.limitations.length||!input.coaching_style)) return "Selecione suas prioridades, limitações e estilo de orientação.";
    return "";
  };
  const next=()=>{const message=validation();if(message)return setError(message);setError("");setStep(value=>Math.min(4,value+1));};
  const plan=useMemo(()=>generateDefaultWorkoutPlan(input),[input]);
  const schedule=buildTrainingSchedule(input.days_per_week,input.preferred_days);
  const labels=new Map<string,string>([...goals,...levels,...locations,...equipment]);

  return <div className="mx-auto max-w-5xl pb-24">
    <header className="text-center">
      <p className="eyebrow">TREINO PERSONALIZADO</p>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Treino personalizado</h1>
      <p className="mx-auto mt-3 max-w-xl text-muted">Responda algumas perguntas e receba uma rotina feita para você.</p>
    </header>
    <div className="mx-auto mt-8 max-w-3xl">
      <div className="flex items-center justify-between text-sm"><b className="text-acid">Etapa {step} de 4</b><span className="text-muted">{step*25}% concluído</span></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-acid transition-all duration-300" style={{width:`${step*25}%`}}/></div>
    </div>

    <section className="mx-auto mt-6 max-w-3xl rounded-[30px] border border-white/10 bg-[#090d0a] p-5 shadow-[0_28px_90px_rgba(0,0,0,.35)] sm:p-8">
      {step===1&&<Step title="Qual é o seu objetivo?" description="Essas informações ajudam o PSFIT a definir volume, intensidade e exercícios.">
        <ChoiceGroup label="Objetivo" options={goals} value={input.primary_goal} onChange={value=>set("primary_goal",value)} icon={<Sparkles size={17}/>}/>
        <ChoiceGroup label="Experiência" options={levels} value={input.experience_level} onChange={value=>set("experience_level",value)} icon={<Activity size={17}/>}/>
        <ChoiceGroup label="Local de treino" options={locations} value={input.training_location} onChange={value=>{set("training_location",value);if(value==="gym"&&!input.equipment.includes("full_gym"))set("equipment",[...input.equipment,"full_gym"])}} icon={<MapPin size={17}/>}/>
        <MultiChoice label="Equipamentos" options={equipment.filter(([value])=>value!=="full_gym"||input.training_location==="gym")} values={input.equipment} toggle={value=>toggle("equipment",value)}/>
      </Step>}
      {step===2&&<Step title="Como é sua semana?" description="Escolha quantos dias e quanto tempo você consegue treinar.">
        <ChoiceGroup label="Dias por semana" options={[2,3,4,5,6].map(value=>[String(value),`${value} dias`] as const)} value={String(input.days_per_week)} onChange={value=>{set("days_per_week",Number(value));set("preferred_days",(input.preferred_days??[]).slice(0,Number(value)))}}/>
        <ChoiceGroup label="Duração da sessão" options={[20,30,45,60,75,90].map(value=>[String(value),`${value} min`] as const)} value={String(input.session_duration_minutes)} onChange={value=>set("session_duration_minutes",Number(value))}/>
        <MultiChoice label={`Dias preferidos (${input.preferred_days?.length??0}/${input.days_per_week})`} options={days} values={input.preferred_days??[]} toggle={chooseDay}/>
        <label className="block"><span className="text-sm font-semibold">Horário aproximado</span><input type="time" value={input.preferred_time??""} onChange={event=>set("preferred_time",event.target.value)} className="field mt-2 max-w-xs"/></label>
      </Step>}
      {step===3&&<Step title="Personalize seu treino" description="Informe prioridades, limitações e o estilo de orientação desejado.">
        <MultiChoice label="Músculos prioritários" options={focuses} values={input.focus_areas} toggle={value=>toggle("focus_areas",value)}/>
        <MultiChoice label="Limitações ou dores" options={limitations} values={input.limitations} toggle={value=>toggle("limitations",value)}/>
        {input.limitations.includes("other")&&<label className="block"><span className="text-sm font-semibold">Conte um pouco mais (opcional)</span><input value={input.limitation_notes??""} onChange={event=>set("limitation_notes",event.target.value)} className="field mt-2" maxLength={300}/></label>}
        <p className="rounded-2xl border border-aqua/20 bg-aqua/[.06] p-4 text-sm text-aqua"><HeartPulse className="mr-2 inline" size={17}/>O PSFIT não substitui orientação médica ou profissional.</p>
        <ChoiceGroup label="Estilo de orientação" options={coaching} value={input.coaching_style} onChange={value=>set("coaching_style",value)}/>
      </Step>}
      {step===4&&<Step title="Confira sua semana" description="Revise sua rotina antes de criar o treino.">
        <dl className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-3">
          <Summary label="Objetivo" value={labels.get(input.primary_goal)??input.primary_goal}/><Summary label="Nível" value={labels.get(input.experience_level)??input.experience_level}/>
          <Summary label="Dias por semana" value={`${input.days_per_week} dias`}/><Summary label="Duração" value={`${input.session_duration_minutes} min`}/>
          <Summary label="Local" value={labels.get(input.training_location)??input.training_location}/><Summary label="Equipamentos" value={input.equipment.map(value=>labels.get(value)??value).join(", ")}/>
        </dl>
        <div className="grid gap-3 sm:grid-cols-2">{plan.map((workout,index)=>{
          const dayKey=input.preferred_days?.[index]??days.find((_,dayIndex)=>schedule[index]===(dayIndex+1)%7)?.[0]??"monday";
          return <article key={workout.name_key} className="rounded-2xl border border-white/10 bg-white/[.025] p-5 transition hover:border-acid/35">
            <div className="flex gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-acid/10 text-acid"><Dumbbell size={21}/></span><div><h3 className="font-semibold">{dayLong[dayKey]} — {workoutNames[workout.name_key]??workout.name}</h3><p className="mt-1 text-sm text-muted">{workout.exercises.length} exercícios · {input.session_duration_minutes} min</p></div></div>
            <p className="mt-4 text-sm"><span className="text-muted">Foco: </span>{focusNames[workout.focus_key]??workout.focus.join(", ")}</p>
          </article>})}</div>
      </Step>}
      {error&&<p role="alert" className="mt-5 text-sm text-red-300">{error}</p>}
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button type="button" disabled={step===1} onClick={()=>{setError("");setStep(value=>Math.max(1,value-1))}} className="min-h-12 rounded-full border border-white/15 px-6 font-semibold disabled:opacity-30">Voltar</button>
        {step<4?<button type="button" onClick={next} className="min-h-12 rounded-full bg-acid px-7 font-bold text-ink transition hover:brightness-110">Continuar</button>:<form action={buildPsfitPlan}><input type="hidden" name="payload" value={JSON.stringify(input)}/><BuildButton/></form>}
      </div>
    </section>
  </div>;
}

function Step({title,description,children}:{title:string;description:string;children:React.ReactNode}){return <div className="space-y-7"><div><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#aeb8b1]">{description}</p></div>{children}</div>}
function ChoiceGroup({label,options,value,onChange,icon}:{label:string;options:readonly(readonly[string,string])[];value:string;onChange:(value:string)=>void;icon?:React.ReactNode}){return <fieldset><legend className="mb-3 flex items-center gap-2 text-sm font-semibold">{icon}{label}</legend><div className="flex flex-wrap gap-2">{options.map(([key,text])=><button key={key} type="button" aria-pressed={value===key} onClick={()=>onChange(key)} className={`min-h-11 rounded-xl border px-4 text-sm font-medium transition ${value===key?"border-acid bg-acid text-ink":"border-white/15 bg-white/[.025] text-[#c7d0ca] hover:border-acid/60"}`}>{text}</button>)}</div></fieldset>}
function MultiChoice({label,options,values,toggle}:{label:string;options:readonly(readonly[string,string])[];values:string[];toggle:(value:string)=>void}){return <fieldset><legend className="mb-3 text-sm font-semibold">{label}</legend><div className="flex flex-wrap gap-2">{options.map(([key,text])=><button key={key} type="button" aria-pressed={values.includes(key)} onClick={()=>toggle(key)} className={`min-h-11 rounded-xl border px-4 text-sm transition ${values.includes(key)?"border-acid bg-acid/15 text-acid":"border-white/15 bg-white/[.025] text-[#c7d0ca] hover:border-acid/60"}`}>{text}</button>)}</div></fieldset>}
function Summary({label,value}:{label:string;value:string}){return <div><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>}
function BuildButton(){const{pending}=useFormStatus();return <button disabled={pending} className="flex min-h-12 min-w-52 items-center justify-center gap-2 rounded-full bg-acid px-7 font-bold text-ink transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{pending?<><span className="size-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink"/>Criando seu treino personalizado...</>:"Criar meu treino"}</button>}
