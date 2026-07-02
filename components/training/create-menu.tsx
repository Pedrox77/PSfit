"use client";

import { Camera, Plus, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Variant = "primary" | "outline" | "fab";

type Props = {
  variant?: Variant;
  label?: string;
};

export function CreateMenu({ variant = "primary", label }: Props) {
  const t = useTranslations("Training");
  const [open, setOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const text = label ?? t("createWorkout");

  const buttonClass =
    variant === "fab"
      ? "fixed bottom-[5.8rem] right-5 z-30 grid h-16 w-16 place-items-center rounded-[22px] bg-acid text-ink shadow-[0_18px_50px_rgba(168,255,42,.24)] lg:hidden"
      : variant === "outline"
        ? "flex w-full items-center justify-center gap-3 rounded-[24px] border border-dashed border-white/15 px-5 py-5 text-base font-semibold transition hover:border-acid/50 hover:bg-acid/[0.04]"
        : "rounded-full bg-acid px-5 py-3 text-sm font-bold text-ink";
  useEffect(()=>{
    if(!open)return;
    closeButton.current?.focus();
    const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};
    window.addEventListener("keydown",close);
    return()=>window.removeEventListener("keydown",close);
  },[open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass}
        aria-label={text}
      >
        <Plus size={variant === "fab" ? 31 : 21} />
        {variant !== "fab" && <span>{text}</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] grid place-items-end bg-black/80 p-0 backdrop-blur-sm sm:place-items-center sm:p-5"
          onMouseDown={() => setOpen(false)}
        >
          <section
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-workout-title"
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[30px] border border-white/15 bg-[#0c110e] p-5 shadow-[0_28px_100px_rgba(0,0,0,.6)] sm:rounded-[30px] sm:p-7"
          >
            <div className="flex justify-between gap-4">
              <div>
                <p className="eyebrow">{t("createWorkout")}</p>
                <h2 id="create-workout-title" className="mt-2 text-2xl font-semibold">{t("createQuestion")}</h2>
                <p className="mt-2 text-sm text-[#aeb8b1]">{t("createDescription")}</p>
              </div>
              <button ref={closeButton} type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="grid size-11 shrink-0 place-items-center rounded-full transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid">
                <X />
              </button>
            </div>
            <div className="mt-6 space-y-3">
              <Option href="/training/new" icon={Plus} title={t("newWorkout")} text={t("newWorkoutDescription")} />
              <Option href="/training/build" icon={Sparkles} title={t("psfitBuild")} text={t("psfitBuildDescription")} badge={t("recommended")} recommended />
              <Option href="/training/import-photo" icon={Camera} title={t("photoWorkout")} text={t("photoWorkoutDescription")} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function Option({
  href,
  icon: Icon,
  title,
  text,
  badge,
  recommended=false,
}: {
  href: string;
  icon: typeof Plus;
  title: string;
  text: string;
  badge?: string;
  recommended?: boolean;
}) {
  return (
    <Link href={href} className={`relative flex min-h-24 gap-4 rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:border-acid focus-visible:outline focus-visible:outline-2 focus-visible:outline-acid ${recommended?"border-acid/45 bg-acid/[.06]":"border-white/15 bg-white/[.025]"}`}>
      {badge&&<span className="absolute right-4 top-3 rounded-full bg-acid px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink">{badge}</span>}
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-acid/10 text-acid">
        <Icon />
      </span>
      <span>
        <b>{title}</b>
        <small className={`mt-1 block max-w-md pr-16 leading-5 ${recommended?"text-[#bdc8c0]":"text-[#aeb8b1]"}`}>{text}</small>
      </span>
    </Link>
  );
}
