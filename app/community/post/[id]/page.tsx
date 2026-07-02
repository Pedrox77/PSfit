import { addComment } from "@/app/community/actions";
import { PostCard } from "@/components/community/post-card";
import { WorkoutPreview } from "@/components/community/workout-preview";
import { getPost } from "@/lib/community/feed";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
};

type CommentProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
};

type CommentRow = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  like_count?: number | null;
};

function formatCommentDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post || post.visibility !== "public") {
    return {
      title: "Community post",
    };
  }

  return {
    title: `Post by @${post.author?.username ?? "athlete"}`,
    description:
      post.caption?.slice(0, 160) ??
      "A workout shared on PSFIT Community",
    openGraph: {
      title: "PSFIT Community",
      description:
        post.caption?.slice(0, 160) ??
        "Real work. Shared momentum.",
    },
  };
}

export default async function Page({
  params,
  searchParams,
}: Props) {
  const [{ id }, { preview }, locale] = await Promise.all([
    params,
    searchParams,
    getLocale(),
  ]);

  const [post, supabase] = await Promise.all([
    getPost(id),
    createClient(),
  ]);

  if (!post) {
    notFound();
  }

  const { data: auth } = await supabase.auth.getUser();

  const {
    data: commentRows,
    error: commentsError,
  } = await supabase
    .from("post_comments")
    .select("id,user_id,body,created_at,like_count")
    .eq("post_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (commentsError) {
    console.error("[PSFIT COMMENTS]", commentsError);
  }

  const comments = (commentRows ?? []) as CommentRow[];

  const commenterIds = [
    ...new Set(
      comments
        .map((comment) => String(comment.user_id))
        .filter(Boolean),
    ),
  ];

  const admin = createAdminClient();

  const { data: profileRows, error: profilesError } =
    commenterIds.length > 0
      ? await admin
          .from("profiles")
          .select("id,username,full_name")
          .in("id", commenterIds)
      : {
          data: [] as CommentProfile[],
          error: null,
        };

  if (profilesError) {
    console.error("[PSFIT COMMENT PROFILES]", profilesError);
  }

  const profileMap = new Map(
    ((profileRows ?? []) as CommentProfile[]).map((profile) => [
      String(profile.id),
      profile,
    ]),
  );

  return (
    <>
      <header className="border-b border-white/[.09] p-5">
        <h1 className="text-xl font-semibold">Post</h1>
      </header>

      <PostCard
        post={post}
        viewerId={auth.user?.id}
      />
    
      {preview === "workout" &&
        post.workout_receipt &&
        post.is_verified_workout && (
          <WorkoutPreview
            postId={post.id}
            receipt={post.workout_receipt}
            username={post.author?.username ?? "athlete"}
          />
        )}

      <section
        id="comments"
        className="p-5"
      >
        <h2 className="font-semibold">Comments</h2>

        {post.allow_comments && (
          <form
            action={addComment}
            className="mt-4 flex gap-2"
          >
            <input
              type="hidden"
              name="post_id"
              value={id}
            />

            <input
              required
              maxLength={1000}
              name="body"
              placeholder="Add something useful..."
              className="min-w-0 flex-1 rounded-full border border-white/10 bg-[#101512] px-4 py-2 text-sm"
            />

            <button
              type="submit"
              className="rounded-full bg-acid px-4 text-sm font-bold text-ink"
            >
              Post
            </button>
          </form>
        )}

        {comments.length > 0 ? (
          <div className="mt-5">
            {comments.map((comment) => {
              const author = profileMap.get(
                String(comment.user_id),
              );

              const fallbackAuthor =
                String(comment.user_id) === String(post.user_id)
                  ? post.author
                  : null;

              const username =
                author?.username ??
                fallbackAuthor?.username ??
                "athlete";

              const displayName =
                author?.full_name?.trim() ||
                fallbackAuthor?.full_name?.trim() ||
                `@${username}`;

              const avatarInitial =
                displayName.charAt(0).toUpperCase() || "P";

              return (
                <article
                  key={String(comment.id)}
                  className="flex gap-3 border-b border-white/[.08] py-4"
                >
                  <Link
                    href={`/u/${username}`}
                    aria-label={`Open ${displayName}'s profile`}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-aqua/25 bg-aqua/10 text-sm font-bold text-aqua"
                  >
                    {avatarInitial}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <Link
                        href={`/u/${username}`}
                        className="truncate text-sm font-semibold text-paper hover:underline"
                      >
                        {displayName}
                      </Link>

                      <Link
                        href={`/u/${username}`}
                        className="text-xs text-muted hover:text-aqua"
                      >
                        @{username}
                      </Link>

                      <time
                        dateTime={comment.created_at}
                        className="text-[11px] text-muted"
                      >
                        {formatCommentDate(comment.created_at, locale)}
                      </time>
                    </div>

                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-paper">
                      {String(comment.body)}
                    </p>

                    <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                      <button
                        type="button"
                        className="transition hover:text-paper"
                      >
                        Reply
                      </button>

                      {Number(comment.like_count ?? 0) > 0 && (
                        <span>
                          {Number(comment.like_count)} likes
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            {post.allow_comments
              ? "No comments yet. Start with something useful."
              : "Comments are disabled for this post."}
          </p>
        )}
      </section>
    </>
  );
}
