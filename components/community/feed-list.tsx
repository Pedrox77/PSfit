"use client";
import type { CommunityPost, FeedCursor } from "@/types/database";
import { useEffect, useRef, useState } from "react";
import { EmptyFeed } from "./empty-feed";
import { PostCard } from "./post-card";
import { MobilePostCard } from "./mobile-post-card";
import type { CommunityProfile } from "@/types/database";
import { PeopleSuggestionsRow } from "./people-suggestions-row";
import { CreateFloatingButton } from "./create-floating-button";
export function FeedList({ initialPosts, initialCursor, mode, viewerId, suggestions=[] }: { initialPosts:CommunityPost[];initialCursor:FeedCursor|null;mode:"following"|"explore"|"saved"|"profile";viewerId?:string;suggestions?:CommunityProfile[] }) {
 const [posts,setPosts]=useState(initialPosts);const [cursor,setCursor]=useState(initialCursor);const [loading,setLoading]=useState(false);const end=useRef<HTMLDivElement>(null);
 useEffect(()=>{const node=end.current;if(!node||!cursor)return;const observer=new IntersectionObserver(async entries=>{if(!entries[0].isIntersecting||loading)return;setLoading(true);const q=new URLSearchParams({mode,cursor:JSON.stringify(cursor)});const response=await fetch(`/api/community/feed?${q}`);if(response.ok){const next=await response.json() as {posts:CommunityPost[];nextCursor:FeedCursor|null};setPosts(old=>[...old,...next.posts]);setCursor(next.nextCursor)}setLoading(false)});observer.observe(node);return()=>observer.disconnect()},[cursor,loading,mode]);
 if(!posts.length)return <><EmptyFeed mode={mode}/>{mode!=="profile"&&<CreateFloatingButton/>}</>;
 const removePost=(postId:string)=>setPosts(current=>current.filter(post=>post.id!==postId));
 return <>{posts.map((post,index)=><div key={post.id}><MobilePostCard post={post} viewerId={viewerId} showFollow={mode==="explore"} onDeleted={()=>removePost(post.id)}/><div className="hidden md:block"><PostCard post={post} viewerId={viewerId} onDeleted={()=>removePost(post.id)}/></div>{index===1&&<PeopleSuggestionsRow people={suggestions}/>}</div>)}<div ref={end} className="h-20">{loading&&<div className="mx-4 mt-4 h-16 animate-pulse rounded-xl bg-white/[.04]"/>}</div>{mode!=="profile"&&<CreateFloatingButton/>}</>;
}
