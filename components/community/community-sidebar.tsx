"use client";

import { Logo } from "@/components/ui";
import type { CommunityProfile } from "@/types/database";
import { Activity,ArrowLeft,Bookmark,CircleEllipsis,Compass,Home,Plus,Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserAvatar } from "./user-avatar";

const links=[["/community/following","feed",Home],["/community/explore","explore",Compass],["/community/moments","moments",Sparkles],["/community/activity","activity",Activity],["/community/saved","saved",Bookmark]] as const;

export function CommunitySidebar({profile}:{profile?:CommunityProfile|null}){
  const pathname=usePathname();
  const t=useTranslations("Community");

  return <aside className="sticky top-0 hidden h-screen py-6 md:block">
    <Logo/>
    <Link href="/workouts" aria-label={t("backToWorkouts")} className="mt-6 flex items-center gap-2 rounded-xl border border-white/[.09] bg-[#090c0a] px-3 py-2.5 text-sm text-muted transition hover:border-acid/40 hover:bg-acid hover:text-ink">
      <ArrowLeft size={17}/>
      {t("backToWorkouts")}
    </Link>
    <nav className="mt-5 space-y-1">
      {links.map(([href,label,Icon])=>{
        const active=pathname===href||pathname.startsWith(`${href}/`);
        return <Link key={href} href={href} aria-current={active?"page":undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active?"bg-white/[.08] text-paper":"text-muted hover:bg-white/[.05] hover:text-paper"}`}><Icon size={19}/>{t(label)}</Link>;
      })}
      <Link href={`/u/${profile?.username??"me"}`} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted hover:bg-white/[.05] hover:text-paper"><UserAvatar src={profile?.avatar_url} name={profile?.full_name} username={profile?.username} size="xs"/>{t("profile")}</Link>
      <Link href="/settings/privacy" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted hover:bg-white/[.05] hover:text-paper"><CircleEllipsis size={19}/>{t("more")}</Link>
    </nav>
    <Link href="/community/create" className="mt-6 flex items-center justify-center gap-2 rounded-full bg-acid px-4 py-3 text-sm font-bold text-ink"><Plus size={17}/>{t("createPost")}</Link>
    <p className="absolute bottom-6 text-xs text-muted">PSFIT Community<br/>{t("tagline")}</p>
  </aside>
}
