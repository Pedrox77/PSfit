import { createClient } from "@/lib/supabase/server";
import type {
  CommunityPost,
  CommunityProfile,
  FeedCursor,
  PostMedia,
} from "@/types/database";
import { createAuthorizedMediaUrl } from "./media";
import { FEED_PAGE_SIZE } from "./constants";

type FeedMode =
  | "following"
  | "explore"
  | "saved"
  | "profile";

type ErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

function logDatabaseError(
  location: string,
  error: unknown,
): void {
  const parsed = error as ErrorLike | null;

  console.error(`[PSFIT COMMUNITY: ${location}]`, {
    message:
      parsed?.message ??
      (error instanceof Error
        ? error.message
        : String(error)),
    code: parsed?.code,
    details: parsed?.details,
    hint: parsed?.hint,
  });
}

async function getSafeMediaUrl(
  storagePath: string,
): Promise<string | undefined> {
  try {
    return await createAuthorizedMediaUrl(storagePath);
  } catch (error) {
    logDatabaseError(
      `media URL: ${storagePath}`,
      error,
    );

    return undefined;
  }
}

export async function getFeed(
  mode: FeedMode,
  cursor?: FeedCursor,
  profileId?: string,
) {
  const supabase = await createClient();

  const {
    data: auth,
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    logDatabaseError("authentication", authError);
  }

  if (!auth.user) {
    return {
      posts: [] as CommunityPost[],
      nextCursor: null,
      error: "User is not authenticated.",
    };
  }

  /*
   * Resolve os IDs antes de consultar os posts.
   * Isso evita buscar posts aleatórios e filtrá-los depois.
   */

  let allowedFollowingIds: string[] | null = null;
  let savedPostIds: string[] | null = null;

  if (mode === "following") {
    const {
      data: follows,
      error: followsError,
    } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", auth.user.id)
      .eq("status", "accepted");

    if (followsError) {
      logDatabaseError(
        "loading followed profiles",
        followsError,
      );

      return {
        posts: [] as CommunityPost[],
        nextCursor: null,
        error: followsError.message,
      };
    }

    allowedFollowingIds = [
      auth.user.id,
      ...(follows ?? []).map((item) =>
        String(item.following_id),
      ),
    ];
  }

  if (mode === "saved") {
    const {
      data: savedRows,
      error: savedError,
    } = await supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", auth.user.id);

    if (savedError) {
      logDatabaseError(
        "loading saved posts",
        savedError,
      );

      return {
        posts: [] as CommunityPost[],
        nextCursor: null,
        error: savedError.message,
      };
    }

    savedPostIds = (savedRows ?? []).map((item) =>
      String(item.post_id),
    );

    if (savedPostIds.length === 0) {
      return {
        posts: [] as CommunityPost[],
        nextCursor: null,
      };
    }
  }

  let query = supabase
    .from("posts")
    .select("*")
    .order("created_at", {
      ascending: false,
    })
    .order("id", {
      ascending: false,
    })
    .limit(FEED_PAGE_SIZE + 1);

  if (mode === "explore") {
    query = query.eq("visibility", "public");
  }

  if (mode === "profile" && profileId) {
    query = query.eq("user_id", profileId);
  }

  if (
    mode === "following" &&
    allowedFollowingIds
  ) {
    query = query.in(
      "user_id",
      allowedFollowingIds,
    );
  }

  if (mode === "saved" && savedPostIds) {
    query = query.in("id", savedPostIds);
  }

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
    );
  }

  const {
    data: postRows,
    error: postsError,
  } = await query;

  if (postsError) {
    logDatabaseError(
      "loading posts",
      postsError,
    );

    return {
      posts: [] as CommunityPost[],
      nextCursor: null,
      error: postsError.message,
    };
  }

  let rows =
    (postRows ?? []) as unknown as CommunityPost[];

  const hasNext =
    rows.length > FEED_PAGE_SIZE;

  rows = rows.slice(0, FEED_PAGE_SIZE);

  const postIds = rows.map((post) => post.id);

  const userIds = [
    ...new Set(
      rows.map((post) => post.user_id),
    ),
  ];

  const emptyResult = {
    data: [],
    error: null,
  };

  const [
    profilesResult,
    mediaResult,
    likesResult,
    savesResult,
    musicResult,
  ] = await Promise.all([
    userIds.length
      ? supabase
          .from("profiles")
          .select("*")
          .in("id", userIds)
      : Promise.resolve(emptyResult),

    postIds.length
      ? supabase
          .from("post_media")
          .select("*")
          .in("post_id", postIds)
          .order("position", {
            ascending: true,
          })
      : Promise.resolve(emptyResult),

    postIds.length
      ? supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", auth.user.id)
          .in("post_id", postIds)
      : Promise.resolve(emptyResult),

    postIds.length
      ? supabase
          .from("saved_posts")
          .select("post_id")
          .eq("user_id", auth.user.id)
          .in("post_id", postIds)
      : Promise.resolve(emptyResult),

    postIds.length
      ? supabase
          .from("post_music")
          .select(
            "post_id,spotify_url,title,artist_name,artwork_url,embed_url,content_type",
          )
          .in("post_id", postIds)
      : Promise.resolve(emptyResult),
  ]);

  if (profilesResult.error) {
    logDatabaseError(
      "loading post profiles",
      profilesResult.error,
    );
  }

  if (mediaResult.error) {
    logDatabaseError(
      "loading post media",
      mediaResult.error,
    );
  }

  if (likesResult.error) {
    logDatabaseError(
      "loading post likes",
      likesResult.error,
    );
  }

  if (savesResult.error) {
    logDatabaseError(
      "loading saved status",
      savesResult.error,
    );
  }

  /*
   * Música é opcional. Se post_music ainda não
   * existir, o feed continuará funcionando.
   */
  if (musicResult.error) {
    logDatabaseError(
      "loading post music",
      musicResult.error,
    );
  }

  const profiles =
    profilesResult.data ?? [];

  const media =
    mediaResult.data ?? [];

  const likes =
    likesResult.data ?? [];

  const saves =
    savesResult.data ?? [];

  const music =
    musicResult.data ?? [];

  const profileMap = new Map(
    profiles.map((profile) => [
      String(profile.id),
      profile as unknown as CommunityProfile,
    ]),
  );

  const likeSet = new Set(
    likes.map((item) =>
      String(item.post_id),
    ),
  );

  const saveSet = new Set(
    saves.map((item) =>
      String(item.post_id),
    ),
  );

  const mediaRows =
    media as unknown as PostMedia[];

  const signedMedia = await Promise.all(
    mediaRows.map(async (item) => ({
      ...item,
      signed_url: await getSafeMediaUrl(
        item.storage_path,
      ),
    })),
  );

  const posts = rows.map((post) => ({
    ...post,

    author: profileMap.get(post.user_id),

    media: signedMedia.filter(
      (item) => item.post_id === post.id,
    ),

    liked: likeSet.has(post.id),

    saved: saveSet.has(post.id),

    music:
      music.find(
        (item) =>
          String(item.post_id) === post.id,
      ) ?? null,
  }));

  const lastPost = posts.at(-1);

  return {
    posts,
    nextCursor:
      hasNext && lastPost
        ? {
            created_at: lastPost.created_at,
            id: lastPost.id,
          }
        : null,
  };
}

export async function getProfile(
  username: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    logDatabaseError(
      "loading community profile",
      error,
    );

    return null;
  }

  return data as unknown as CommunityProfile | null;
}

export async function getPeopleSuggestions() {
  const supabase = await createClient();

  const {
    data: auth,
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    logDatabaseError(
      "suggestions authentication",
      authError,
    );
  }

  if (!auth.user) {
    return [];
  }

  const {
    data: follows,
    error: followsError,
  } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", auth.user.id);

  if (followsError) {
    logDatabaseError(
      "loading suggestion exclusions",
      followsError,
    );
  }

  const excludedIds = new Set([
    auth.user.id,
    ...(follows ?? []).map((item) =>
      String(item.following_id),
    ),
  ]);

  const {
    data: profiles,
    error: profilesError,
  } = await supabase
    .from("profiles")
    .select("*")
    .not("username", "is", null)
    .order("followers_count", {
      ascending: false,
    })
    .limit(20);

  if (profilesError) {
    logDatabaseError(
      "loading people suggestions",
      profilesError,
    );

    return [];
  }

  return (
    (profiles ?? []) as unknown as CommunityProfile[]
  )
    .filter(
      (profile) =>
        !excludedIds.has(profile.id),
    )
    .slice(0, 8);
}

export async function getPost(
  id: string,
) {
  const supabase = await createClient();

  const {
    data,
    error: postError,
  } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (postError) {
    logDatabaseError(
      "loading individual post",
      postError,
    );

    return null;
  }

  if (!data) {
    return null;
  }

  const post =
    data as unknown as CommunityPost;

  const [
    profileResult,
    mediaResult,
    authResult,
    musicResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", post.user_id)
      .maybeSingle(),

    supabase
      .from("post_media")
      .select("*")
      .eq("post_id", post.id)
      .order("position", {
        ascending: true,
      }),

    supabase.auth.getUser(),

    supabase
      .from("post_music")
      .select("*")
      .eq("post_id", id)
      .maybeSingle(),
  ]);

  if (profileResult.error) {
    logDatabaseError(
      "loading post author",
      profileResult.error,
    );
  }

  if (mediaResult.error) {
    logDatabaseError(
      "loading individual post media",
      mediaResult.error,
    );
  }

  if (musicResult.error) {
    logDatabaseError(
      "loading individual post music",
      musicResult.error,
    );
  }

  const signedMedia = await Promise.all(
    (
      (mediaResult.data ??
        []) as unknown as PostMedia[]
    ).map(async (item) => ({
      ...item,
      signed_url: await getSafeMediaUrl(
        item.storage_path,
      ),
    })),
  );

  const userId = authResult.data.user?.id;

  let liked = false;
  let saved = false;

  if (userId) {
    const [
      likedResult,
      savedResult,
    ] = await Promise.all([
      supabase
        .from("post_likes")
        .select("post_id")
        .eq("post_id", id)
        .eq("user_id", userId)
        .maybeSingle(),

      supabase
        .from("saved_posts")
        .select("post_id")
        .eq("post_id", id)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (
      likedResult.error &&
      likedResult.error.code !== "PGRST116"
    ) {
      logDatabaseError(
        "loading post liked status",
        likedResult.error,
      );
    }

    if (
      savedResult.error &&
      savedResult.error.code !== "PGRST116"
    ) {
      logDatabaseError(
        "loading post saved status",
        savedResult.error,
      );
    }

    liked = Boolean(likedResult.data);
    saved = Boolean(savedResult.data);
  }

  return {
    ...post,
    author:
      profileResult.data as unknown as CommunityProfile,
    media: signedMedia,
    liked,
    saved,
    music: musicResult.data ?? null,
  };
}
