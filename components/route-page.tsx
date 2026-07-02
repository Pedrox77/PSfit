"use client";
import { useState } from "react";
import { ArrowRight, Check, ChevronRight, CirclePlus, Dumbbell, HeartPulse, Search, Users } from "lucide-react";
import AppShell from "./app-shell";
import { Button, Progress } from "./ui";

const content:Record<string,{title:string;sub:string;action?:string;cards:string[]}> = {
 workouts:{title:"Training",sub:"Plans that learn from every completed set.",action:"Create workout",cards:["Current plan","Workout history","Training volume"]},
 nutrition:{title:"Nutrition",sub:"Simple signals for calories, macros, protein and hydration.",action:"Log meal",cards:["Today’s targets","Recent meals","Smart alternatives"]},
 meals:{title:"Meals",sub:"Build a useful food history without spreadsheet overhead.",action:"Add meal",cards:["Breakfast","Lunch","Dinner"]},
 progress:{title:"Progress Lab",sub:"Connect body changes, strength and adherence over time.",action:"Log progress",cards:["Weight trend","Strength progress","Body measurements"]},
 recovery:{title:"Recovery",sub:"Check in quickly, then train with better context.",action:"Daily check-in",cards:["Readiness","Sleep trend","Training load"]},
 momentum:{title:"Momentum",sub:"Consistency measured by direction, not perfection.",cards:["7-day consistency","30-day momentum","Return strength"]},
 crews:{title:"Crews",sub:"Private groups for shared goals and thoughtful accountability.",action:"Create a Crew",cards:["Your Crews","Weekly challenges","Activity"]},
 challenges:{title:"Challenges",sub:"Choose goals that reinforce your own plan.",action:"Browse challenges",cards:["Active","Available","Completed"]},
 profile:{title:"Profile",sub:"Your physical context, preferences and coaching style.",action:"Edit profile",cards:["Personal details","Training profile","Coaching style"]},
 settings:{title:"Settings",sub:"Control notifications, privacy, integrations and billing.",cards:["Account","Privacy & data","Notifications"]},
 pricing:{title:"Choose your PSFIT plan",sub:"The essentials are free. Pro unlocks the full adaptive system.",cards:["PSFIT Free · R$ 0","PSFIT Pro Monthly · R$ 19.90/month","PSFIT Pro Yearly · R$ 149.90/year"]},
 privacy:{title:"Privacy at PSFIT",sub:"Your fitness data should remain yours.",cards:["Data we use","How it helps your experience","Your controls"]},
 terms:{title:"Terms of use",sub:"Clear expectations for using the PSFIT platform.",cards:["Using PSFIT","Subscriptions","Health disclaimer"]},
 notifications:{title:"Notifications",sub:"Useful nudges, kept under your control.",cards:["Today","This week","Preferences"]}
};

export default function RoutePage({slug}:{slug:string[]}){
 const key=slug[0], cfg=content[key]??{title:title(slug.at(-1)||"PSFIT"),sub:"A focused part of your adaptive fitness system.",cards:["Overview","Recent activity","Next action"]};
 const [toast,setToast]=useState("");
 return <AppShell><div><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">PSFIT · {key}</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">{cfg.title}</h1><p className="mt-3 text-muted">{cfg.sub}</p></div>{cfg.action&&<button onClick={()=>{setToast(`${cfg.action} flow opened`);setTimeout(()=>setToast(""),2400)}} className="flex items-center gap-2 self-start rounded-full bg-acid px-5 py-3 text-sm font-bold text-ink"><CirclePlus size={17}/>{cfg.action}</button>}</div>
  <div className="mt-9 grid gap-5 md:grid-cols-3">{cfg.cards.map((card,i)=><section key={card} className="card min-h-52 p-6"><div className="flex items-center justify-between"><span className="text-sm text-muted">{card}</span><ChevronRight size={17}/></div><p className="mt-10 text-3xl font-semibold">{i===0?"On track":i===1?"This week":"Ready"}</p><Progress value={[78,61,86][i]}/><p className="mt-4 text-sm leading-6 text-muted">{i===0?"Your current signals are moving in the intended direction.":i===1?"Review the latest entries and choose your next useful action.":"Everything is set for your next check-in."}</p></section>)}</div>
  <section className="card mt-5 p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">Next best action</h2><p className="mt-2 text-sm text-muted">A small step selected from your current plan.</p></div><Button href="/today">Go to Today <ArrowRight size={16}/></Button></div></section>
  {toast&&<div role="status" className="fixed bottom-5 right-5 rounded-xl bg-paper px-4 py-3 text-sm font-semibold text-ink shadow-xl">{toast}</div>}
 </div></AppShell>
}
const title=(s:string)=>s.split("-").map(x=>x[0]?.toUpperCase()+x.slice(1)).join(" ");
