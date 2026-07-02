import { FeedList } from "@/components/community/feed-list";
import { getFeed } from "@/lib/community/feed";
import { createClient } from "@/lib/supabase/server";
export const metadata={title:"Saved posts"};
export default async function Page(){const [{posts,nextCursor},supabase]=await Promise.all([getFeed("saved"),createClient()]);const {data}=await supabase.auth.getUser();return <><header className="border-b border-white/[.09] p-5"><h1 className="text-xl font-semibold">Saved</h1><p className="mt-1 text-xs text-muted">Only you can see what you save.</p></header><FeedList initialPosts={posts} initialCursor={nextCursor} mode="saved" viewerId={data.user?.id}/></>}
