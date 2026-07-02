"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function PsfitLogo({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="PSFIT home"
      className={`group inline-flex items-center gap-2.5 ${className}`}
    >
      <motion.span
        initial={{ opacity: 0, scale: 0.88, rotate: -5 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex size-9 items-center justify-center"
      >
        <span className="absolute inset-0 rounded-xl bg-acid/20 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
        <svg
          viewBox="0 0 42 42"
          className="relative size-9 text-acid"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="1" y="1" width="40" height="40" rx="12" fill="#090C0A" stroke="rgba(255,255,255,0.12)" />
          <path d="M12 30V12.5H22.3C27.1 12.5 29.8 15.1 29.8 18.8C29.8 22.5 27 24.8 22.4 24.8H17.2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M29.2 13.4H22.7C19.2 13.4 17.1 14.8 17.1 17.3C17.1 19.7 19 20.7 22.7 21.5C27.1 22.5 29.5 24 29.5 27.1C29.5 30.2 26.7 31.1 22.8 31.1H13.2" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" opacity=".58" />
          <path d="M10 34.2L32.4 7.8" stroke="#35D9F5" strokeWidth="1.15" strokeLinecap="round" opacity=".7" />
          <circle cx="31.9" cy="8.4" r="1.5" fill="#35D9F5" />
        </svg>
      </motion.span>
      {!compact && (
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="font-display text-lg font-semibold tracking-[-0.045em] text-paper"
        >
          PS<span className="text-acid">FIT</span>
        </motion.span>
      )}
    </Link>
  );
}
