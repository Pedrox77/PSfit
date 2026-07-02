import { getFeed } from "@/lib/community/feed";
import type { FeedCursor } from "@/types/database";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request:NextRequest){const mode=request.nextUrl.searchParams.get("mode");if(!["following","explore","saved","profile"].includes(mode??""))return NextResponse.json({error:"Invalid mode"},{status:400});let cursor:FeedCursor|undefined;try{const raw=request.nextUrl.searchParams.get("cursor");cursor=raw?JSON.parse(raw) as FeedCursor:undefined}catch{return NextResponse.json({error:"Invalid cursor"},{status:400})}const data=await getFeed(mode as "following"|"explore"|"saved"|"profile",cursor);return NextResponse.json(data)}
