import AppShell from "@/components/app-shell";
import { SaveButton } from "@/components/internal-form";
import { startWorkout } from "@/app/internal-actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { exerciseName,workoutFocus,workoutName } from "@/lib/i18n/workout-content";
type TodayExercise={id:string;name:string;name_key:string|null;sets:number|null;repetitions:string|null;rest_seconds:number|null;load_guidance:string|null;video_thumbnail_url:string|null;catalog_exercise_id:string|null};
export default async function TodayWorkout(){
 const contentT=await getTranslations("WorkoutContent");
 const db=await createClient();const{data:{user}}=await db.auth.getUser();if(!user)redirect("/login");
 const day=new Date().getDay(),date=new Date().toISOString().slice(0,10);
 const{data:plan,error:planError}=await db.from("workout_plans").select("id").eq("user_id",user.id).eq("is_active",true).maybeSingle();
 if(planError)console.error({message:planError.message,code:planError.code,details:planError.details,hint:planError.hint});
 const result=plan?await db.from("workouts").select("*,exercises(*)").eq("plan_id",plan.id).eq("scheduled_weekday",day).maybeSingle():{data:null,error:null};
 if(result.error)console.error({message:result.error.message,code:result.error.code,details:result.error.details,hint:result.error.hint});
 if(!result.data||!plan){const{data:future}=plan?await db.from("workouts").select("name,scheduled_weekday").eq("plan_id",plan.id):{data:[]};const next=(future??[]).sort((a,b)=>((a.scheduled_weekday-day+7)%7)-((b.scheduled_weekday-day+7)%7))[0];return <AppShell><div className="card p-8"><h1 className="text-3xl font-semibold">Hoje é dia de recuperação</h1><p className="mt-3 text-muted">{next?`Próximo treino: ${next.name}.`:"Nenhum treino está programado no plano ativo."}</p><a href="/training/new" className="mt-5 inline-block rounded-full bg-acid px-5 py-3 font-bold text-ink">Criar treino extra</a></div></AppShell>}
 const workout=result.data,exercises=(Array.isArray(workout.exercises)?workout.exercises:[])as TodayExercise[];
 const{data:session}=await db.from("workout_sessions").select("id,status").eq("user_id",user.id).eq("workout_id",workout.id).eq("scheduled_date",date).maybeSingle();
 const ids=exercises.map(x=>x.catalog_exercise_id).filter((x):x is string=>Boolean(x));const{data:media}=ids.length?await db.from("exercise_catalog").select("id,thumbnail_url").in("id",ids):{data:[]};
 return <AppShell><div className="space-y-6"><div><p className="eyebrow">Treino de hoje</p><h1 className="mt-2 text-4xl font-semibold">{workoutName(contentT,workout.name_key,workout.name)}</h1><p className="mt-2 text-muted">{workoutFocus(contentT,workout.focus_key,workout.focus||"Foco não informado")} · {workout.estimated_minutes||"—"} min · {exercises.length} exercícios</p></div><div className="space-y-3">{exercises.map(e=>{const thumb=e.video_thumbnail_url||media?.find(m=>m.id===e.catalog_exercise_id)?.thumbnail_url;return <div key={e.id} className="card flex gap-4 p-4">{thumb?<img src={thumb} alt="" className="h-20 w-20 rounded-xl object-cover"/>:<span className="grid h-20 w-20 place-items-center rounded-xl bg-white/5"><Dumbbell/></span>}<div><h2 className="font-semibold">{exerciseName(contentT,e.name_key,e.name)}</h2><p className="mt-2 text-sm text-muted">{e.sets} séries · {e.repetitions} repetições · {e.rest_seconds||"—"}s de descanso</p><p className="mt-1 text-sm">{e.load_guidance}</p></div></div>})}</div>{session?<a href={`/workouts/session/${session.id}`} className="inline-block rounded-full bg-acid px-5 py-3 font-bold text-ink">{session.status==="completed"?"Ver treino concluído":"Continuar treino"}</a>:<form action={startWorkout.bind(null,workout.id,plan.id)}><SaveButton>Iniciar treino</SaveButton></form>}</div></AppShell>
}
