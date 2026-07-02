import { createClient } from "@/lib/supabase/server";
import type {
  CommunityProfile,
  Story,
  StoryHighlight,
} from "@/types/database";
import { createAuthorizedMediaUrl } from "./media";

function logMomentsError(context: string, error: unknown) {
  const details =
    error && typeof error === "object"
      ? (error as Record<string, unknown>)
      : {};

  console.error(`[PSFIT COMMUNITY MOMENTS: ${context}]`, {
    message:
      typeof details.message === "string"
        ? details.message
        : String(error),
    code: details.code,
    details: details.details,
    hint: details.hint,
  });
}

async function getSafeMediaUrl(
  path: string,
): Promise<string | undefined> {
  try {
    return await createAuthorizedMediaUrl(path);
  } catch (error) {
    logMomentsError("creating authorized media URL", error);
    return undefined;
  }
}

export async function getMoments() {
  const supabase = await createClient();
  const { data: auth, error: authError } =
    await supabase.auth.getUser();

  if (authError) {
    logMomentsError("loading authenticated user", authError);
    return [];
  }
  if (!auth.user) {
    return [];
  }

  const { data, error: storiesError } = await supabase
    .from("stories")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  if (storiesError) {
    logMomentsError("loading stories", storiesError);
    return [];
  }

  const stories = (data ?? []) as unknown as Story[];
  const userIds = [...new Set(stories.map((story) => story.user_id))];

  const [profilesResult, viewsResult] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("*").in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
    stories.length
      ? supabase
          .from("story_views")
          .select("story_id")
          .eq("viewer_id", auth.user.id)
          .in(
            "story_id",
            stories.map((story) => story.id),
          )
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesResult.error) {
    logMomentsError("loading profiles", profilesResult.error);
  }
  if (viewsResult.error) {
    logMomentsError("loading story views", viewsResult.error);
  }

  const profiles = profilesResult.error
    ? []
    : (profilesResult.data ?? []);
  const views = viewsResult.error ? [] : (viewsResult.data ?? []);
  const profilesById = new Map(
    profiles.map((profile) => [
      String(profile.id),
      profile as unknown as CommunityProfile,
    ]),
  );
  const viewedStoryIds = new Set(
    views.map((view) => String(view.story_id)),
  );

  return Promise.all(
    stories.map(async (story) => ({
      ...story,
      author: profilesById.get(story.user_id),
      viewed: viewedStoryIds.has(story.id),
      signed_url: story.media_path
        ? await getSafeMediaUrl(story.media_path)
        : undefined,
    })),
  );
}

export async function getHighlights(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("story_highlights")
    .select("*")
    .eq("user_id", userId)
    .order("position");

  if (error) {
    logMomentsError("loading story highlights", error);
    return [];
  }

  const highlights = (data ?? []) as unknown as StoryHighlight[];

  return Promise.all(
    highlights.map(async (item) => ({
      ...item,
      cover_url: item.cover_path
        ? await getSafeMediaUrl(item.cover_path)
        : undefined,
    })),
  );
}
