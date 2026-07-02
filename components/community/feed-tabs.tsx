import Link from "next/link";
export function FeedTabs({ active }: { active: "following" | "explore" }) {
  return <div className="grid grid-cols-2 border-b border-white/[.09]"><Link href="/community/following" className={`border-b-2 py-4 text-center text-sm font-semibold ${active==="following"?"border-acid text-paper":"border-transparent text-muted"}`}>Following</Link><Link href="/community/explore" className={`border-b-2 py-4 text-center text-sm font-semibold ${active==="explore"?"border-aqua text-paper":"border-transparent text-muted"}`}>Explore</Link></div>;
}
