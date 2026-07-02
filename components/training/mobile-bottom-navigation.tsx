"use client";

import { Apple, Dumbbell, Home, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const items = [
  { href: "/today", key: "today", icon: Home },
  { href: "/workouts", key: "training", icon: Dumbbell },
  { href: "/community", key: "community", icon: Users },
  { href: "/nutrition", key: "nutrition", icon: Apple },
  { href: "/settings/profile", key: "profile", icon: UserRound },
] as const;

export function MobileBottomNavigation() {
  const path = usePathname();
  const t = useTranslations("Navigation");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-[#030504]/95 px-3 pb-[max(.55rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ href, key, icon: Icon }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={t(key)}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl transition ${
                active ? "text-acid" : "text-muted hover:text-paper"
              }`}
            >
              <Icon size={24} strokeWidth={active ? 2.5 : 2} />
              <span className="sr-only">{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
