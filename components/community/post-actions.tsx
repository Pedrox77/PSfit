"use client";
import { toggleLike, toggleSave } from "@/app/community/actions";
import { Bookmark, Heart, MessageCircle, Send, Dumbbell } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
export function PostActions({ postId, initialLiked, initialSaved, initialLikes, comments, canTry }: { postId:string;initialLiked:boolean;initialSaved:boolean;initialLikes:number;comments:number;canTry:boolean }) {
 const [liked,setLiked]=useState(initialLiked);const [saved,setSaved]=useState(initialSaved);const [likes,optimisticLike]=useOptimistic(initialLikes,(n:number,delta:number)=>n+delta);const [pending,start]=useTransition();void pending;
 function like(){const next=!liked;setLiked(next);optimisticLike(next?1:-1);start(async()=>{try{await toggleLike(postId)}catch{setLiked(!next);optimisticLike(next?-1:1)}})}
 function save(){const next=!saved;setSaved(next);start(async()=>{try{await toggleSave(postId)}catch{setSaved(!next)}})}
 async function share(){const url=`${location.origin}/community/post/${postId}`;if(navigator.share)await navigator.share({title:"PSFIT Community",url});else await navigator.clipboard.writeText(url)}
 return <div className="flex items-center gap-1 px-4 py-3"><button onClick={like} aria-label="Like" className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ${liked?"text-acid":"text-muted"}`}><Heart size={20} fill={liked?"currentColor":"none"}/>{likes}</button><a href={`/community/post/${postId}#comments`} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted"><MessageCircle size={20}/>{comments}</a><button onClick={share} className="rounded-full p-2 text-muted" aria-label="Share"><Send size={20}/></button>{canTry&&<a href={`/community/post/${postId}?preview=workout`} className="ml-1 flex items-center gap-1 rounded-full border border-acid/30 px-3 py-2 text-xs text-acid"><Dumbbell size={15}/>Try this workout</a>}<button onClick={save} className={`ml-auto rounded-full p-2 ${saved?"text-aqua":"text-muted"}`} aria-label="Save"><Bookmark size={20} fill={saved?"currentColor":"none"}/></button></div>;
}
