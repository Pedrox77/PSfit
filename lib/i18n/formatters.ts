export type SupportedLocale = "pt" | "en" | "es";

export function normalizeLocale(locale: string): SupportedLocale {
  const language = locale.toLowerCase().split("-")[0];
  return language === "en" || language === "es" ? language : "pt";
}

export function intlLocale(locale: string) {
  return { pt: "pt-BR", en: "en-US", es: "es-ES" }[
    normalizeLocale(locale)
  ];
}

export function formatDate(
  value: Date | string | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(
    intlLocale(locale),
    options,
  ).format(new Date(value));
}

export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(
    intlLocale(locale),
    options,
  ).format(value);
}
