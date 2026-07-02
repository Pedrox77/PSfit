import { spotifyEmbedUrl } from "@/lib/spotify/validators";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request:NextRequest){const embedUrl=spotifyEmbedUrl(request.nextUrl.searchParams.get("url")??"");if(!embedUrl)return NextResponse.json({error:"Invalid Spotify URL"},{status:400});return NextResponse.json({embedUrl})}
