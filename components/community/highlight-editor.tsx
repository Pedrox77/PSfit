"use client";
import { createHighlight } from "@/app/community/actions";
export function HighlightEditor(){return <form action={createHighlight} className="space-y-5 p-5"><label className="block text-sm">Highlight name<input name="name" required maxLength={30} className="mt-2 w-full rounded-xl border border-white/10 bg-[#101512] px-4 py-3"/></label><p className="text-sm text-muted">Create a collection, then add eligible Moments from its menu.</p><button className="rounded-full bg-acid px-5 py-2 text-sm font-bold text-ink">Create Highlight</button></form>}
