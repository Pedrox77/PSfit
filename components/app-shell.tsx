"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Apple,
  BarChart3,
  Bell,
  CreditCard,
  Crown,
  Dumbbell,
  Gauge,
  HeartPulse,
  Home,
  Menu,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./ui";
import { LogoutButton } from "./logout-button";
import { LanguageSelector } from "./language-selector";

const navigationItems = [
  {
    href: "/today",
    translationKey: "today",
    icon: Home,
  },
  {
    href: "/workouts",
    translationKey: "training",
    icon: Dumbbell,
  },
  {
    href: "/nutrition",
    translationKey: "nutrition",
    icon: Apple,
    pro: true,
  },
  {
    href: "/progress",
    translationKey: "progress",
    icon: BarChart3,
  },
  {
    href: "/community",
    translationKey: "community",
    icon: Users,
  },
  {
    href: "/twin",
    translationKey: "twin",
    icon: Sparkles,
    pro: true,
  },
  {
    href: "/recovery",
    translationKey: "recovery",
    icon: HeartPulse,
  },
  {
    href: "/momentum",
    translationKey: "momentum",
    icon: Gauge,
  },
  {
    href: "/settings/billing",
    translationKey: "plansBilling",
    icon: CreditCard,
  },
] as const;

export default function AppShell({
  children,
  hideMobileHeader = false,
}: {
  children: React.ReactNode;
  hideMobileHeader?: boolean;
}) {
  const path = usePathname();
  const t = useTranslations("Navigation");
  const [open, setOpen] = useState(false);
  const [isPro,setIsPro]=useState<boolean|null>(null);
  useEffect(()=>{void fetch("/api/billing/entitlements").then(response=>response.ok?response.json():null).then((result:{isPro?:boolean}|null)=>setIsPro(Boolean(result?.isPro))).catch(()=>setIsPro(false))},[]);

  return (
    <div className="min-h-dvh min-w-0 overflow-x-clip lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[min(15rem,calc(100vw-2rem))] overflow-y-auto border-r border-white/[0.07] bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] transition-transform duration-300 lg:sticky lg:top-0 lg:block lg:h-dvh lg:w-60 ${
          open
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo />

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid h-9 w-9 place-items-center rounded-xl transition hover:bg-white/[0.05] lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-10 space-y-1">
          {navigationItems.map(
            ({ href, translationKey, icon: Icon, ...item }) => {
              const active = path.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-acid text-ink"
                      : "text-muted hover:bg-white/[0.04] hover:text-paper"
                  }`}
                >
                  <Icon size={18} />
                  {t(translationKey)}
                  {"pro" in item && item.pro && !isPro && (
                    <span className="ml-auto rounded-full border border-acid/30 px-1.5 py-0.5 text-[9px] font-bold text-acid">
                      PRO
                    </span>
                  )}
                </Link>
              );
            },
          )}
        </nav>

        {isPro!==null&&<Link href="/settings/billing" onClick={()=>setOpen(false)} className={`mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold ${isPro?"border border-acid/25 bg-acid/[.06] text-acid":"bg-acid text-ink"}`}><Crown size={17}/>{isPro?t("proBadge"):t("upgradePro")}</Link>}

        <div className="absolute bottom-5 left-5 right-5">
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-white/[0.04] hover:text-paper"
          >
            <Settings size={18} />
            {t("settings")}
          </Link>

          <div className="mt-3 flex items-center gap-3 border-t border-white/[0.07] pt-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-aqua/15 text-sm font-semibold text-aqua">
              P
            </div>

            <div className="min-w-0">
              <Link
                href="/settings/profile"
                onClick={() => setOpen(false)}
                className="block truncate text-sm font-medium"
              >
                {t("profile")}
              </Link>

              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className={`${hideMobileHeader ? "hidden lg:flex" : "flex"} min-h-16 items-center justify-between gap-2 border-b border-white/[0.07] px-3 sm:px-5 lg:px-8`}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid h-9 w-9 place-items-center rounded-xl transition hover:bg-white/[0.05] lg:hidden"
          >
            <Menu size={21} />
          </button>

          <p className="hidden text-sm text-muted lg:block">
            {t("systemStatus")}
          </p>

          <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
            <LanguageSelector />

            <Link
              href="/notifications"
              aria-label={t("notifications")}
              className="grid h-9 w-9 place-items-center rounded-xl transition hover:bg-white/[0.05]"
            >
              <Bell size={19} />
            </Link>

            <Link
              href="/settings/profile"
              className="hidden text-sm font-semibold sm:block"
            >
              {t("profile")}
            </Link>
          </div>
        </header>

        <main className={`mx-auto w-full min-w-0 max-w-[1400px] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-5 lg:p-8 ${hideMobileHeader ? "pt-2" : "py-5"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
