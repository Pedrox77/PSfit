import { FeedList } from "@/components/community/feed-list";
import { FeedNavigationTabs } from "@/components/community/feed-navigation-tabs";
import { FeedTabs } from "@/components/community/feed-tabs";
import { MobileFeedHeader } from "@/components/community/mobile-feed-header";
import { MomentsRow } from "@/components/community/moments-row";
import {
  getFeed,
  getPeopleSuggestions,
} from "@/lib/community/feed";
import { getMoments } from "@/lib/community/moments";
import { createClient } from "@/lib/supabase/server";
import type {
  CommunityPost,
  FeedCursor,
} from "@/types/database";
import Link from "next/link";

export const metadata = { title: "Community" };

async function safeFeed(): Promise<{
  posts: CommunityPost[];
  nextCursor: FeedCursor | null;
}> {
  try {
    const result = await getFeed("following");

    if (result.error) {
      console.error("[PSFIT COMMUNITY: feed failed]", result.error);
    }

    return {
      posts: result.posts ?? [],
      nextCursor: result.nextCursor ?? null,
    };
  } catch (error) {
    console.error("[PSFIT COMMUNITY: feed failed]", error);
    return { posts: [], nextCursor: null };
  }
}

async function safeMoments() {
  try {
    return await getMoments();
  } catch (error) {
    console.error("[PSFIT COMMUNITY: moments failed]", error);
    return [];
  }
}

async function safeSuggestions() {
  try {
    return await getPeopleSuggestions();
  } catch (error) {
    console.error("[PSFIT COMMUNITY: suggestions failed]", error);
    return [];
  }
}

async function safeViewerId() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("[PSFIT COMMUNITY: viewer failed]", error);
      return undefined;
    }

    return data.user?.id;
  } catch (error) {
    console.error("[PSFIT COMMUNITY: viewer failed]", error);
    return undefined;
  }
}

export default async function Page() {
  const [{ posts, nextCursor }, moments, suggestions, viewerId] =
    await Promise.all([
      safeFeed(),
      safeMoments(),
      safeSuggestions(),
      safeViewerId(),
    ]);

  return (
    <>
      <MobileFeedHeader />
      <FeedNavigationTabs active="following" />
      <header className="hidden items-center justify-between p-4 md:flex">
        <div>
          <h1 className="text-xl font-semibold">Community</h1>
          <p className="text-xs text-muted">
            Real life. Shared momentum.
          </p>
        </div>
        <Link
          href="/community/create"
          className="rounded-full bg-acid px-4 py-2 text-sm font-bold text-ink"
        >
          Share
        </Link>
      </header>
      <MomentsRow stories={moments} />
      <Link
        href="/community/create"
        className="mx-4 my-3 hidden rounded-2xl border border-white/[.07] bg-[#090c0a] p-4 text-sm text-muted md:flex"
      >
        Share a moment from your day…
      </Link>
      <div className="hidden md:block">
        <FeedTabs active="following" />
      </div>
      <FeedList
        initialPosts={posts}
        initialCursor={nextCursor}
        mode="following"
        viewerId={viewerId}
        suggestions={suggestions}
      />
    </>
  );
}
