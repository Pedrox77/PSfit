"use client";

import { UserRound } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type UserAvatarProps = {
  src?: string | null;
  name?: string | null;
  username?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizes = {
  xs: { pixels: 24, classes: "h-6 w-6 text-[10px]" },
  sm: { pixels: 32, classes: "h-8 w-8 text-xs" },
  md: { pixels: 40, classes: "h-10 w-10 text-sm" },
  lg: { pixels: 64, classes: "h-16 w-16 text-xl" },
  xl: { pixels: 96, classes: "h-20 w-20 text-2xl sm:h-24 sm:w-24" },
} as const;

export function UserAvatar({
  src,
  name,
  username,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const config = sizes[size];
  const label = name?.trim() || username?.trim() || "PSFIT athlete";
  const initial = (name?.trim() || username?.trim())?.[0]?.toUpperCase();

  useEffect(() => setFailed(false), [src]);

  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-aqua/25 bg-aqua/10 font-semibold text-aqua ${config.classes} ${className}`}
      aria-label={label}
    >
      {src && !failed ? (
        <Image
          unoptimized
          src={src}
          alt={`${label}'s profile photo`}
          width={config.pixels}
          height={config.pixels}
          sizes={`${config.pixels}px`}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : initial ? (
        <span aria-hidden="true">{initial}</span>
      ) : (
        <UserRound
          aria-hidden="true"
          size={Math.max(14, config.pixels * 0.45)}
        />
      )}
    </span>
  );
}
