import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { calculateStreak } from "@/lib/training/streak";
import { logSupabaseError } from "@/lib/supabase/errors";
import { redirect } from "next/navigation";
import { Flame } from "lucide-react";

export default async function Momentum(){
  const db=await createClient();
  const{data:{user}}=await db.auth.getUser();
  if(!user)redirect("/login");
  const{data,error}=await db.from("workout_sessions").select("scheduled_date,status,duration_minutes").eq("user_id",user.id).order("scheduled_date");
  if(error)logSupabaseError("Momentum",error);
  const completed=(data??[]).filter(x=>x.status==="completed");
  const streak=calculateStreak(completed.map(x=>x.scheduled_date));
  const last30=new Date(Date.now()-30*86400000).toISOString().slice(0,10);
  const recent=completed.filter(x=>x.scheduled_date>=last30);
  return <AppShell><div className="space-y-7"><header><p className="eyebrow">Momentum</p><h1 className="mt-2 text-4xl font-semibold">Consistency built one session at a time.</h1></header>{completed.length?<><section className="rounded-3xl border border-warning/30 bg-warning/[.06] p-7"><Flame className="text-warning" size={40}/><p className="mt-5 text-sm text-muted">Current streak</p><p className="mt-2 text-5xl font-semibold">{streak.current} days</p><p className="mt-3 text-muted">Best streak: {streak.best} days · {streak.totalDays} total training days</p></section><div className="grid gap-4 sm:grid-cols-3"><Card label="Last 30 days" value={`${recent.length} sessions`}/><Card label="Training time" value={`${recent.reduce((n,x)=>n+Number(x.duration_minutes||0),0)} min`}/><Card label="Trained today" value={streak.trainedToday?"Yes":"Not yet"}/></div></>:<section className="card p-7"><h2 className="text-xl font-semibold">Your streak starts with your first completed workout.</h2><p className="mt-2 text-muted">Finish your first session to track consistency without artificial goals.</p><a href="/today" className="mt-5 inline-block rounded-full bg-acid px-5 py-3 font-bold text-ink">View today&apos;s workout</a></section>}</div></AppShell>
}
function Card({label,value}:{label:string;value:string}){return <section className="card p-5"><p className="text-sm text-muted">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p></section>}
