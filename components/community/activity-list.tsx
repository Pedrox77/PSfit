import type { Notification } from "@/types/database";
import { EmptyFeed } from "./empty-feed";
import { UserAvatar } from "./user-avatar";
export function ActivityList({items}:{items:Notification[]}){if(!items.length)return <EmptyFeed mode="activity"/>;return <div>{items.map(item=><a key={item.id} href={item.post_id?`/community/post/${item.post_id}`:"#"} className="flex gap-3 border-b border-white/[.09] p-4"><UserAvatar src={item.actor?.avatar_url} name={item.actor?.full_name} username={item.actor?.username}/><div><p className="text-sm"><b>{item.actor?.full_name??"An athlete"}</b> {item.type.replaceAll("_"," ")}.</p><time className="text-xs text-muted">{new Date(item.created_at).toLocaleDateString("en-US")}</time></div></a>)}</div>}
