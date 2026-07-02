"use client";

import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { PsfitLogo } from "./brand/psfit-logo";

export function Logo() {
  return <PsfitLogo />;
}

export function Button({ children, href, variant = "primary", onClick }: { children: React.ReactNode; href?: string; variant?: "primary" | "quiet"; onClick?: () => void }) {
  const cls = variant === "primary"
    ? "inline-flex items-center justify-center gap-2 rounded-full bg-acid px-5 py-3 text-sm font-bold text-ink transition hover:bg-[#c8ff77] active:scale-[.98]"
    : "inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-5 py-3 text-sm font-semibold transition hover:bg-white/[.08]";
  return href ? <Link className={cls} href={href}>{children}</Link> : <button className={cls} onClick={onClick}>{children}</button>;
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const links = [["Product","#product"],["PSFIT Twin","#twin"],["Training","#training"],["Nutrition","#nutrition"],["Progress","#progress"],["Pricing","#pricing"]];
  return <header className="sticky top-0 z-50 border-b border-white/[.06] bg-ink/80 backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
      <Logo />
      <nav className="hidden items-center gap-7 lg:flex">{links.map(([n,h]) => <Link key={n} href={h} className="text-sm text-muted transition hover:text-paper">{n}</Link>)}</nav>
      <div className="hidden items-center gap-3 sm:flex"><Link href="/login" className="px-3 text-sm">Sign in</Link><Button href="/signup">Start for free <ArrowUpRight size={16}/></Button></div>
      <button className="sm:hidden" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    </div>
    {open && <div className="border-t border-white/10 bg-surface p-5 sm:hidden">{links.map(([n,h]) => <Link key={n} href={h} onClick={()=>setOpen(false)} className="block border-b border-white/[.06] py-3">{n}</Link>)}<Button href="/signup">Start for free</Button></div>}
  </header>;
}

export function Metric({ label, value, sub, color = "acid" }: { label:string; value:string; sub:string; color?: "acid"|"aqua"|"warning" }) {
  const colors = { acid:"text-acid", aqua:"text-aqua", warning:"text-warning" };
  return <div className="card p-5"><p className="text-xs font-semibold uppercase tracking-widest text-muted">{label}</p><p className={`mt-3 text-3xl font-semibold ${colors[color]}`}>{value}</p><p className="mt-1 text-sm text-muted">{sub}</p></div>;
}

export function Progress({ value, color = "bg-acid" }: { value:number; color?:string }) {
  return <div className="h-1.5 overflow-hidden rounded-full bg-white/[.08]"><div className={`h-full rounded-full ${color}`} style={{width:`${value}%`}} /></div>;
}
