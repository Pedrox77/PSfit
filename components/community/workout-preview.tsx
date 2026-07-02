"use client";
import { createClient } from "@/lib/supabase/client";
import type { WorkoutReceipt } from "@/types/database";
import { useState } from "react";
export function WorkoutPreview({postId,receipt,username}:{postId:string;receipt:WorkoutReceipt;username:string}){const [done,setDone]=useState(false);async function copy(){const {error}=await createClient().rpc("copy_shared_workout",{p_post_id:postId});if(!error)setDone(true)}return <section className="m-4 rounded-2xl border border-aqua/20 bg-aqua/5 p-5"><h2 className="text-lg font-semibold">Workout preview</h2><p className="mt-2 text-sm text-muted">{receipt.exercises_completed} exercises · {receipt.sets_completed} sets · {receipt.duration_minutes} min</p><p className="mt-3 text-xs text-muted">Inspired by @{username}</p><button onClick={copy} disabled={done} className="mt-5 w-full rounded-full bg-acid py-2.5 text-sm font-bold text-ink">{done?"Added to your plan":"Save a copy to my plan"}</button></section>}
