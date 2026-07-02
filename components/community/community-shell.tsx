import type { CommunityProfile } from "@/types/database";
import { CommunitySidebar } from "./community-sidebar";
import { MobileAppNavigation } from "./mobile-app-navigation";
import { UserSuggestions } from "./user-suggestions";

export function CommunityShell({ children, profile }: { children: React.ReactNode; profile?: CommunityProfile | null }) {
  return <div className="mx-auto min-h-screen max-w-[1480px] overflow-x-clip bg-black pb-24 md:grid md:grid-cols-[220px_minmax(0,660px)] md:gap-6 md:bg-transparent md:px-5 md:pb-8 xl:grid-cols-[220px_minmax(0,660px)_300px]">
    <CommunitySidebar profile={profile}/>
    <main className="min-w-0 border-white/[.09] md:border-x">{children}</main>
    <aside className="hidden py-6 xl:block"><UserSuggestions/><section className="mt-4 rounded-2xl border border-white/[.09] bg-[#090c0a] p-5"><p className="text-sm font-semibold">Community standard</p><p className="mt-2 text-xs leading-5 text-muted">Train honestly. Encourage generously. Report harmful content.</p></section></aside>
    <MobileAppNavigation profile={profile}/>
  </div>;
}
