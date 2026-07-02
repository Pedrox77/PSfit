"use client";

import type { PostMedia as Media } from "@/types/database";
import { useRef, useState } from "react";

import { PostCarousel } from "./post-carousel";

type PostMediaProps = {
  media: Media[];
  sensitive: boolean;
  onLike: () => void;
};

export function PostMedia({
  media,
  sensitive,
  onLike,
}: PostMediaProps) {
  const [revealed, setRevealed] = useState(!sensitive);
  const [heart, setHeart] = useState(false);
  const lastTapRef = useRef(0);
  const heartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  if (!media.length) {
    return null;
  }

  function handleDoubleTapLike() {
    const now = Date.now();

    if (now - lastTapRef.current < 320) {
      onLike();
      setHeart(true);

      if (heartTimerRef.current) {
        clearTimeout(heartTimerRef.current);
      }

      heartTimerRef.current = setTimeout(() => {
        setHeart(false);
      }, 650);
    }

    lastTapRef.current = now;
  }

  return (
    <div
      className={`relative overflow-hidden bg-black/30 ${
        revealed ? "" : "blur-3xl"
      }`}
    >
      <PostCarousel
        items={media}
        onDoubleTap={handleDoubleTapLike}
      />

      {!revealed && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setRevealed(true);
          }}
          className="absolute inset-0 z-30 m-auto h-fit w-fit rounded-full bg-black/80 px-5 py-3 text-sm text-white"
        >
          Show sensitive content
        </button>
      )}

      {heart && (
        <span className="pointer-events-none absolute inset-0 z-30 grid place-items-center text-7xl text-acid animate-pulse">
          ♥
        </span>
      )}
    </div>
  );
}
