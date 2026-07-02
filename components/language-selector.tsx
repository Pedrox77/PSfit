"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const languages = [
  {
    value: "en",
    label: "English",
  },
  {
    value: "pt",
    label: "Português",
  },
  {
    value: "es",
    label: "Español",
  },
] as const;

export function LanguageSelector() {
  const locale = useLocale();
  const t = useTranslations("Common");
  const router = useRouter();
  const [isPending, startTransition] =
    useTransition();

  function changeLanguage(
    newLocale: string,
  ) {
    document.cookie = [
      `NEXT_LOCALE=${newLocale}`,
      "path=/",
      "max-age=31536000",
      "SameSite=Lax",
    ].join("; ");

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <label className="relative">
      <span className="sr-only">
        {t("selectLanguage")}
      </span>

      <select
        value={locale}
        disabled={isPending}
        onChange={(event) =>
          changeLanguage(event.target.value)
        }
        aria-label={t("selectLanguage")}
        className="h-9 cursor-pointer rounded-xl border border-white/10 bg-surface px-3 text-sm text-paper outline-none transition hover:border-white/20 focus:border-acid/50 disabled:cursor-wait disabled:opacity-60"
      >
        {languages.map((language) => (
          <option
            key={language.value}
            value={language.value}
          >
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}
