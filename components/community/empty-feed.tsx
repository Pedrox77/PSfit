import { Compass, Plus } from "lucide-react";
import Link from "next/link";
export function EmptyFeed({ mode }: { mode: "following"|"explore"|"saved"|"profile"|"activity" }) {
 const copy={following:"Your feed starts with the people you follow.",explore:"Fresh moments are being prepared.",saved:"Save workouts and progress posts to revisit later.",profile:"Share your first moment.",activity:"No new activity."}[mode];
 return <div className="px-6 py-12 text-center"><h2 className="text-base font-semibold">{copy}</h2>{mode==="following"&&<div className="mt-5 flex justify-center gap-2"><Link href="/community/explore" className="rounded-full border border-white/10 px-4 py-2 text-xs">Discover people</Link><Link href="/community/moments/create" className="flex items-center gap-2 rounded-full bg-acid px-4 py-2 text-xs font-bold text-ink"><Plus size={14}/>Share your first moment</Link></div>}</div>;
}
