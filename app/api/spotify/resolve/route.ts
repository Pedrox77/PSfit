import { resolveSpotifyUrl } from "@/lib/spotify/oembed";
import { NextResponse } from "next/server";
export async function POST(request:Request){try{const body=await request.json() as {url?:string};const data=await resolveSpotifyUrl(body.url??"");return NextResponse.json(data)}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid Spotify URL"},{status:400})}}
