import type { WorkoutReceipt } from "@/types/database";
import { Activity, Dumbbell, Flame, Gauge, Repeat2, Timer, Trophy } from "lucide-react";

export function estimatedWorkoutCalories(receipt:WorkoutReceipt){
  if(receipt.calories)return {value:receipt.calories,estimated:false};
  return {value:Math.max(1,Math.round(receipt.duration_minutes*(4+receipt.effort*.55))),estimated:true};
}
export function TrainingStatsPanel({receipt}:{receipt:WorkoutReceipt}){
 const calories=estimatedWorkoutCalories(receipt);
 const metrics=[
  {label:"Energy",value:`${calories.value} kcal`,note:calories.estimated?"estimated":undefined,icon:Flame,accent:"acid"},
  {label:"Duration",value:formatDuration(receipt.duration_minutes),icon:Timer,accent:"aqua"},
  {label:"Volume",value:`${receipt.total_volume_kg.toLocaleString("en-US")} kg`,icon:Gauge,accent:"acid"},
  {label:"Exercises",value:String(receipt.exercises_completed),icon:Dumbbell,accent:"aqua"},
  {label:"Completed sets",value:String(receipt.sets_completed),icon:Repeat2,accent:"aqua"},
  ...(receipt.average_heart_rate?[{label:"Avg. heart rate",value:`${receipt.average_heart_rate} bpm`,icon:Activity,accent:"acid"}]:[]),
 ];
 return <section className="relative flex h-full min-h-[430px] flex-col overflow-hidden bg-[#050806] p-5">
  <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-acid/10 blur-3xl"/><div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-aqua/10 blur-3xl"/>
  <div className="relative"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-acid">Training Stats Panel</p><h3 className="mt-3 max-w-[85%] text-3xl font-semibold leading-tight">{receipt.title}</h3><p className="mt-2 text-xs text-muted">{new Date(receipt.completed_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p></div>
  <div className="relative mt-6 grid grid-cols-2 gap-2">{metrics.map(({label,value,note,icon:Icon,accent})=><div key={label} className="rounded-2xl border border-white/[.08] bg-white/[.035] p-3"><div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider text-muted">{label}</span><Icon size={14} className={accent==="acid"?"text-acid":"text-aqua"}/></div><p className="mt-2 text-lg font-semibold tabular-nums">{value}</p>{note&&<p className="text-[9px] text-muted">{note}</p>}<div className="mt-3 h-0.5 overflow-hidden rounded-full bg-white/[.07]"><span className={`block h-full ${accent==="acid"?"w-4/5 bg-acid":"w-3/5 bg-aqua"}`}/></div></div>)}</div>
  <div className="relative mt-auto flex items-center gap-2 pt-5"><span className="rounded-full border border-acid/20 bg-acid/[.06] px-3 py-1.5 text-xs text-acid">+{receipt.momentum_score} momentum</span>{receipt.personal_records>0&&<span className="flex items-center gap-1 rounded-full border border-aqua/20 bg-aqua/[.06] px-3 py-1.5 text-xs text-aqua"><Trophy size={12}/>{receipt.personal_records} PR</span>}</div>
 </section>
}
function formatDuration(minutes:number){const hours=Math.floor(minutes/60);const rest=minutes%60;return hours?`${hours}h ${String(rest).padStart(2,"0")}m`:`${minutes} min`}
