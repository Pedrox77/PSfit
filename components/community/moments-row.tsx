"use client";
import type { Story } from "@/types/database";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MomentAvatar } from "./moment-avatar";
import { MomentViewer } from "./moment-viewer";
export function MomentsRow({stories}:{stories:Story[]}){const [active,setActive]=useState<number|null>(null);return <section className="border-b border-white/[.07] bg-[#030504] px-4 py-4"><div className="flex gap-2 overflow-x-auto [scrollbar-width:none]"><Link href="/community/moments/create" className="w-[72px] shrink-0 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-dashed border-acid/60 bg-acid/5 text-acid"><Plus/></span><span className="mt-1 block text-[11px] text-muted">Your moment</span></Link>{stories.map((story,index)=><MomentAvatar key={story.id} story={story} onClick={()=>setActive(index)}/>)}</div>{!stories.length&&<p className="mt-3 text-xs text-muted">Your day deserves a place here.</p>}{active!==null&&<MomentViewer stories={stories} initialIndex={active} onClose={()=>setActive(null)}/>}</section>}
