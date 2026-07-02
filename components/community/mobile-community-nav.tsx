"use client";
import { Activity, Compass, Home, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function MobileCommunityNav({ username }: { username: string }) {
  const path=usePathname(); const items=[["/community","Home",Home],["/community/explore","Explore",Compass],["/community/create","Create",Plus],["/community/activity","Activity",Activity],[`/u/${username}`,"Profile",UserRound]] as const;
  return <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/[.09] bg-[#030504]/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">{items.map(([href,label,Icon],i)=><Link key={href} href={href} aria-label={label} className={`flex flex-col items-center gap-1 text-[10px] ${i===2?"text-ink":"text-muted"} ${path===href?"text-paper":""}`}><span className={i===2?"-mt-5 grid h-12 w-12 place-items-center rounded-full bg-acid shadow-[0_0_24px_rgba(168,255,42,.25)]":""}><Icon size={i===2?22:20}/></span>{label}</Link>)}</nav>;
}
