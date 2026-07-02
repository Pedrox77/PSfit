"use client";

import { toggleLike } from "@/app/community/actions";
import type { CommunityPost } from "@/types/database";
import Link from "next/link";
import { useState } from "react";
import { PostActions } from "./post-actions";
import { PostCaption } from "./post-caption";
import { PostCarousel } from "./post-carousel";
import { PostComments } from "./post-comments";
import { PostMedia } from "./post-media";
import { PostMenu } from "./post-menu";
import { PostMusicCard } from "./post-music-card";
import { UserAvatar } from "./user-avatar";
import { WorkoutReceipt } from "./workout-receipt";

export function PostCard({
  post,
  viewerId,
  onDeleted,
}: {
  post: CommunityPost;
  viewerId?: string;
  onDeleted?: () => void;
}) {
  const [forceLike, setForceLike] = useState(0);
  const author = post.author;
  const relative = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  }).format(
    -Math.max(
      1,
      Math.round(
        (Date.now() - new Date(post.created_at).getTime()) / 3600000,
      ),
    ),
    "hour",
  );

  function mediaLike() {
    if (!post.liked && forceLike === 0) {
      setForceLike(1);
      void toggleLike(post.id).catch(() => setForceLike(0));
    }
  }

  return (
    <article className="border-b border-white/[.07] bg-[#090c0a]">
      <header className="flex items-center gap-3 p-4">
        <Link href={`/u/${author?.username}`}>
          <UserAvatar
            src={author?.avatar_url}
            name={author?.full_name}
            username={author?.username}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {author?.full_name ?? "PSFIT athlete"}
          </p>
          <p className="truncate text-xs text-muted">
            @{author?.username ?? "athlete"} ·{" "}
            {post.location ? `${post.location} · ` : ""}
            {relative}
          </p>
        </div>
        <PostMenu
          own={viewerId === post.user_id}
          postId={post.id}
          onDeleted={onDeleted}
        />
      </header>
      {post.workout_receipt ? (
        <PostCarousel
          items={post.media ?? []}
          receipt={post.workout_receipt}
          visualStyle={post.training_visual_style}
        />
      ) : post.media ? (
        <PostMedia
          media={post.media}
          sensitive={post.sensitive_content}
          onLike={mediaLike}
        />
      ) : null}
      <div className="pt-3">
        {post.caption && (
          <PostCaption
            username={author?.username ?? "athlete"}
            caption={post.caption}
          />
        )}
        {post.music && (
          <div className="mx-4 mb-3">
            <PostMusicCard music={post.music} />
          </div>
        )}
        {post.workout_receipt && (
          <WorkoutReceipt
            receipt={post.workout_receipt}
            verified={post.is_verified_workout}
          />
        )}
        <PostActions
          key={`${post.id}-${forceLike}`}
          postId={post.id}
          initialLiked={forceLike > 0 || Boolean(post.liked)}
          initialSaved={Boolean(post.saved)}
          initialLikes={
            post.like_count +
            (forceLike > 0 && !post.liked ? 1 : 0)
          }
          comments={post.comment_count}
          canTry={post.is_verified_workout}
        />
        <PostComments count={post.comment_count} postId={post.id} />
      </div>
    </article>
  );
}
