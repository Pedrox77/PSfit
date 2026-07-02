"use client";
import { ArrowLeft,Bell,Search } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui";
export function MobileFeedHeader(){
  const t=useTranslations("Community");
  return <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[.06] bg-black/90 px-2 backdrop-blur-xl md:hidden">
    <div className="flex min-w-0 items-center">
      <Link href="/workouts" aria-label={t("backToWorkouts")} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted transition hover:bg-white/[.06] hover:text-acid">
        <ArrowLeft size={21}/>
      </Link>
      <Logo/>
    </div>
    <div className="flex items-center gap-1"><Link href="/community/explore" aria-label="Search" className="rounded-full p-2 text-muted"><Search size={20}/></Link><Link href="/community/activity" aria-label="Activity" className="relative rounded-full p-2 text-muted"><Bell size={20}/><i className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-acid"/></Link></div>
  </header>
}
