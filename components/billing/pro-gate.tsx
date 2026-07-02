"use client";
import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function ProGate({title,description,feature}:{title:string;description:string;feature?:string;children?:React.ReactNode}) {
  const t=useTranslations("BillingGate");
  return <section className="mx-auto max-w-2xl rounded-3xl border border-acid/25 bg-[radial-gradient(circle_at_top,rgba(168,255,42,.12),transparent_55%),#090c0a] p-7 text-center sm:p-10">
    <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-aqua/20 bg-aqua/[.06] text-aqua"><LockKeyhole/></span>
    <span className="mt-5 inline-block rounded-full border border-acid/30 px-3 py-1 text-xs font-bold text-acid">PSFIT PRO</span>
    <h1 className="mt-4 text-3xl font-semibold">{t("upgradeTitle")}</h1>
    <p className="mt-2 text-sm text-aqua">{t("proFeature")}</p>
    <p className="mx-auto mt-3 max-w-lg text-muted">{t("upgradeDescription")}</p>
    <p className="mt-6 text-2xl font-semibold">R$ 19,90<span className="text-sm text-muted">/mês</span></p>
    <Link href="/pricing" className="mt-5 inline-flex rounded-full bg-acid px-6 py-3 font-bold text-ink">{t("upgradeButton")}</Link>
    <p className="mt-3 text-xs text-muted">{t("billedInUsd")}</p>
  </section>;
}
