"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { type BillingCycle, CheckoutButton } from "./checkout-button";

const freeFeatures = ["freeFeatures.workoutPlanning","freeFeatures.workoutTracking","freeFeatures.community","freeFeatures.progress","freeFeatures.history"] as const;
const proFeatures = ["proFeatures.everythingFree","proFeatures.nutritionTracking","proFeatures.targets","proFeatures.mealsWater","proFeatures.adaptiveProgression","proFeatures.loadSuggestions","proFeatures.twin","proFeatures.recovery","proFeatures.analytics"] as const;

export function PricingSection({
  showHeading = true,
  initialCycle = "monthly",
}: {
  showHeading?: boolean;
  initialCycle?: BillingCycle;
}) {
  const t = useTranslations("Pricing");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialCycle);
  const [accountStatus,setAccountStatus]=useState<"loading"|"guest"|"free"|"pro">("loading");

  useEffect(()=>{
    let active=true;
    void fetch("/api/billing/entitlements",{cache:"no-store"}).then(async response=>{
      if(!active)return;
      if(response.status===401){setAccountStatus("guest");return}
      if(!response.ok){setAccountStatus("guest");return}
      const result=await response.json() as {isPro?:boolean};
      if(active)setAccountStatus(result.isPro?"pro":"free");
    }).catch(()=>{if(active)setAccountStatus("guest")});
    return()=>{active=false};
  },[]);

  return <section id="pricing" aria-labelledby={showHeading ? "pricing-title" : undefined} aria-label={showHeading ? undefined : t("title")} className="scroll-mt-24 px-4 py-20 sm:px-5 sm:py-28">
    <div className="mx-auto max-w-5xl">
      {showHeading && <header className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h2 id="pricing-title" className="mt-4 font-display text-4xl font-medium sm:text-5xl">{t("title")}</h2>
        <p className="mx-auto mt-5 max-w-2xl leading-7 text-muted">{t("description")}</p>
      </header>}
      <div className={`${showHeading ? "mt-12" : ""} grid items-stretch gap-6 md:grid-cols-2`}>
        <motion.article initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.2}} className="flex min-w-0 flex-col rounded-[2rem] border border-white/10 bg-[#090c0a] p-6 sm:p-8">
          <h3 className="text-xl font-semibold">{t("freeName")}</h3>
          <p className="mt-5 text-4xl font-semibold">{t("freePrice")}</p>
          <p className="mt-3 text-sm text-muted">{t("freeTagline")}</p>
          <FeatureList items={freeFeatures.map(key=>t(key))}/>
          {accountStatus==="pro"?<p className="mt-auto w-full rounded-full border border-acid/25 bg-acid/[.06] px-5 py-3 text-center font-bold text-acid">{t("currentPlanPro")}</p>:accountStatus==="loading"?<button disabled className="mt-auto w-full rounded-full border border-white/10 px-5 py-3 text-muted">{t("checkingPlan")}</button>:<Link href="/signup" className="mt-auto block w-full rounded-full border border-white/15 bg-white/[.04] px-5 py-3 text-center font-bold transition hover:border-aqua/50 hover:text-aqua focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua">{t("startFree")}</Link>}
        </motion.article>
        <motion.article initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} transition={{delay:.08}} viewport={{once:true,amount:.2}} className="relative flex min-w-0 flex-col rounded-[2rem] border border-acid/60 bg-[radial-gradient(circle_at_50%_0%,rgba(168,255,42,.12),transparent_45%),#090c0a] p-6 shadow-[0_0_50px_rgba(168,255,42,.08)] sm:p-8">
          <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-acid px-3 py-1 text-xs font-bold text-ink"><Sparkles size={13} aria-hidden="true"/>{t("mostPopular")}</span>
          <h3 className="pr-28 text-xl font-semibold">{t(billingCycle==="monthly"?"monthlyName":"yearlyName")}</h3>
          <div role="group" aria-label={t("billingCycleLabel")} className="mt-6 grid grid-cols-2 rounded-full border border-white/10 bg-black/40 p-1">
            {(["monthly","yearly"] as const).map(cycle=>{const selected=billingCycle===cycle;return <button key={cycle} type="button" aria-pressed={selected} onClick={()=>setBillingCycle(cycle)} className={`min-h-11 rounded-full px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid ${selected?"bg-acid text-ink":"text-muted hover:text-paper"}`}>{t(cycle)}</button>})}
          </div>
          <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-2">
            <p className="text-4xl font-semibold">{t(billingCycle==="monthly"?"monthlyPrice":"yearlyPrice")}</p>
            {billingCycle==="yearly"&&<span className="mb-1 rounded-full border border-aqua/30 bg-aqua/[.08] px-3 py-1 text-xs font-semibold text-aqua">{t("bestValue")}</span>}
          </div>
          {billingCycle==="yearly"&&<><p className="mt-2 text-sm text-muted">{t("yearlyEquivalent")}</p><p className="mt-1 text-sm font-medium text-aqua">{t("yearlySavings")}</p></>}
          <FeatureList items={proFeatures.map(key=>t(key))}/>
          {accountStatus==="pro"?<div className="rounded-2xl border border-acid/25 bg-acid/[.06] p-4 text-center"><p className="font-bold text-acid">{t("alreadyPro")}</p><p className="mt-2 text-sm text-muted">{t("currentPlanPro")}</p><p className="mt-1 text-sm text-muted">{t("caktoManaged")}</p>{process.env.NEXT_PUBLIC_CAKTO_SUPPORT_URL&&<a href={process.env.NEXT_PUBLIC_CAKTO_SUPPORT_URL} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold">{t("billingSupport")}</a>}</div>:accountStatus==="loading"?<button disabled className="w-full rounded-full bg-acid px-5 py-3 font-bold text-ink opacity-50">{t("checkingPlan")}</button>:accountStatus==="guest"?<Link href={`/login?redirectTo=${encodeURIComponent(`/pricing?plan=${billingCycle}`)}`} className="block w-full rounded-full bg-acid px-5 py-3 text-center font-bold text-ink">{t(billingCycle==="monthly"?"subscribeMonthly":"subscribeYearly")}</Link>:<CheckoutButton key={billingCycle} billingCycle={billingCycle}>{t(billingCycle==="monthly"?"subscribeMonthly":"subscribeYearly")}</CheckoutButton>}
        </motion.article>
      </div>
    </div>
  </section>;
}

function FeatureList({items}:{items:string[]}) {
  return <ul className="my-7 flex-1 space-y-3 text-sm">{items.map(item=><li key={item} className="flex gap-3"><Check size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-acid"/><span>{item}</span></li>)}</ul>;
}
