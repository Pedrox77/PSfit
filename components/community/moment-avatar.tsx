import type { Story } from "@/types/database";
import { UserAvatar } from "./user-avatar";

export function MomentAvatar({story,onClick}:{story:Story;onClick:()=>void}){return <button onClick={onClick} className="w-[72px] shrink-0 text-center"><span className={`mx-auto grid h-16 w-16 place-items-center rounded-full p-[2px] ${story.viewed?"bg-white/20":"bg-gradient-to-br from-acid to-aqua"}`}><UserAvatar src={story.author?.avatar_url} name={story.author?.full_name} username={story.author?.username} size="lg" className="border-2 border-[#030504]"/></span><span className="mt-1 block truncate text-[11px] text-muted">@{story.author?.username??"athlete"}</span></button>}
