"use client";

import type { PostMedia, WorkoutReceipt } from "@/types/database";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import {
  type MouseEvent,
  type UIEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { PostVideo } from "./post-video";
import { WorkoutReceipt as ReceiptCard } from "./workout-receipt";
import { WorkoutVisualSlide } from "./workout-visual-slide";

type PostCarouselProps = {
  items: PostMedia[];
  receipt?: WorkoutReceipt | null;
  includeReceipt?: boolean;
  onDoubleTap?: () => void;
  visualStyle?:
    | "photo_only"
    | "photo_stats"
    | "photo_body_map"
    | "full_carousel"
    | "stats_only";
};

export function PostCarousel({
  items,
  receipt,
  includeReceipt = false,
  onDoubleTap,
  visualStyle = "full_carousel",
}: PostCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [lastTap, setLastTap] = useState(0);

  const showMedia = visualStyle !== "stats_only";
  const showStats =
    Boolean(receipt) &&
    ["photo_stats", "full_carousel", "stats_only"].includes(visualStyle);
  const showImpact =
    Boolean(receipt) &&
    ["photo_body_map", "full_carousel"].includes(visualStyle);

  const media = showMedia ? items : [];

  const total =
    media.length +
    (showStats ? 1 : 0) +
    (showImpact ? 1 : 0) +
    (receipt && includeReceipt && visualStyle === "full_carousel" ? 1 : 0);

  const goTo = useCallback(
    (nextIndex: number) => {
      const scroller = scrollerRef.current;

      if (!scroller || total <= 1) {
        return;
      }

      const normalizedIndex = Math.min(
        Math.max(nextIndex, 0),
        total - 1,
      );

      scroller.scrollTo({
        left: normalizedIndex * scroller.clientWidth,
        behavior: "smooth",
      });

      setIndex(normalizedIndex);
    },
    [total],
  );

  const goPrevious = useCallback(
    (event?: MouseEvent<HTMLButtonElement>) => {
      event?.stopPropagation();
      goTo(index === 0 ? total - 1 : index - 1);
    },
    [goTo, index, total],
  );

  const goNext = useCallback(
    (event?: MouseEvent<HTMLButtonElement>) => {
      event?.stopPropagation();
      goTo(index === total - 1 ? 0 : index + 1);
    },
    [goTo, index, total],
  );

  function handleTap() {
    const now = Date.now();

    if (now - lastTap < 320) {
      onDoubleTap?.();
    }

    setLastTap(now);
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;

    if (!element.clientWidth) {
      return;
    }

    const nextIndex = Math.round(
      element.scrollLeft / element.clientWidth,
    );

    setIndex(Math.min(Math.max(nextIndex, 0), Math.max(total - 1, 0)));
  }

  useEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index === 0 ? total - 1 : index - 1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index === total - 1 ? 0 : index + 1);
      }
    }

    scroller.addEventListener("keydown", handleKeyDown);

    return () => {
      scroller.removeEventListener("keydown", handleKeyDown);
    };
  }, [goTo, index, total]);

  useEffect(() => {
    if (index > total - 1) {
      setIndex(Math.max(total - 1, 0));
    }
  }, [index, total]);

  if (total === 0) {
    return null;
  }

  return (
    <div className="group/carousel relative w-full max-w-full overflow-hidden bg-black/30">
      <div
        ref={scrollerRef}
        tabIndex={0}
        role="region"
        aria-label="Post media carousel"
        aria-roledescription="carousel"
        onClick={handleTap}
        onScroll={handleScroll}
        className="flex w-full max-w-full snap-x snap-mandatory overflow-x-auto scroll-smooth outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {media.map((item, mediaIndex) => (
          <div
            key={item.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${mediaIndex + 1} of ${total}`}
            className={`relative w-full shrink-0 snap-center bg-black ${
              receipt ? "aspect-[4/5]" : "aspect-square"
            }`}
          >
            {item.media_type === "image" ? (
              <Image
                unoptimized
                fill
                sizes="(max-width: 768px) 100vw, 658px"
                className={receipt ? "object-cover" : "object-contain"}
                src={item.signed_url!}
                alt={item.alt_text ?? `Post image ${mediaIndex + 1}`}
              />
            ) : (
              <PostVideo src={item.signed_url!} />
            )}
          </div>
        ))}

        {receipt && showStats && (
          <div
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${media.length + 1} of ${total}`}
            className="aspect-[4/5] w-full shrink-0 snap-center"
          >
            <WorkoutVisualSlide receipt={receipt} type="stats" />
          </div>
        )}

        {receipt && showImpact && (
          <div
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${
              media.length + (showStats ? 2 : 1)
            } of ${total}`}
            className="aspect-[4/5] w-full shrink-0 snap-center"
          >
            <WorkoutVisualSlide receipt={receipt} type="impact" />
          </div>
        )}

        {receipt &&
          includeReceipt &&
          visualStyle === "full_carousel" && (
            <div
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${total} of ${total}`}
              className="grid aspect-[4/5] w-full shrink-0 snap-center place-items-center bg-[#050706]"
            >
              <ReceiptCard receipt={receipt} verified />
            </div>
          )}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={goPrevious}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/65 text-white opacity-100 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid md:opacity-0 md:group-hover/carousel:opacity-100 md:group-focus-within/carousel:opacity-100"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next image"
            className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/65 text-white opacity-100 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid md:opacity-0 md:group-hover/carousel:opacity-100 md:group-focus-within/carousel:opacity-100"
          >
            <ChevronRight size={22} />
          </button>

          <span className="pointer-events-none absolute right-3 top-3 z-20 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
            {index + 1}/{total}
          </span>

          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center gap-1">
            {Array.from({ length: total }, (_, dotIndex) => (
              <i
                key={dotIndex}
                className={`h-1 rounded-full transition-all ${
                  dotIndex === index
                    ? "w-5 bg-acid"
                    : "w-1 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
