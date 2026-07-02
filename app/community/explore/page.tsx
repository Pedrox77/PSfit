import { ExploreFilters } from "@/components/community/explore-filters";
import { FeedList } from "@/components/community/feed-list";
import { FeedNavigationTabs } from "@/components/community/feed-navigation-tabs";
import { FeedTabs } from "@/components/community/feed-tabs";
import { MobileFeedHeader } from "@/components/community/mobile-feed-header";
import { getFeed,getPeopleSuggestions } from "@/lib/community/feed";
import { createClient } from "@/lib/supabase/server";
export const metadata={title:"Explorar comunidade"};
export default async function Page(){const [{posts,nextCursor},supabase,suggestions]=await Promise.all([getFeed("explore"),createClient(),getPeopleSuggestions()]);const {data}=await supabase.auth.getUser();return <><MobileFeedHeader/><FeedNavigationTabs active="explore"/><header className="hidden p-4 md:block"><h1 className="text-xl font-semibold">Comunidade</h1><p className="text-xs text-muted">Encontre sua próxima ideia útil.</p></header><div className="hidden md:block"><FeedTabs active="explore"/></div><ExploreFilters/><FeedList initialPosts={posts} initialCursor={nextCursor} mode="explore" viewerId={data.user?.id} suggestions={suggestions}/></>}
