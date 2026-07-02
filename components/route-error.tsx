"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RouteError({error,reset}:{error:Error&{digest?:string};reset:()=>void}) {
  useEffect(()=>console.error("[PSFIT ROUTE ERROR]",{message:error.message,digest:error.digest}),[error]);
  return <div className="grid min-h-[60vh] place-items-center p-6"><div className="card max-w-lg p-7 text-center"><h2 className="text-2xl font-semibold">Não foi possível carregar esta área.</h2><p className="mt-3 text-sm text-muted">Tente novamente. Se o problema continuar, volte para seus treinos.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={reset} className="rounded-full bg-acid px-5 py-3 font-bold text-ink">Tentar novamente</button><Link href="/workouts" className="rounded-full border border-white/15 px-5 py-3 font-semibold">Voltar para os treinos</Link></div></div></div>;
}
