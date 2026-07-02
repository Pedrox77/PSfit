import { searchSpotify } from "@/lib/spotify/server";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request:NextRequest){const query=request.nextUrl.searchParams.get("q")?.trim()??"";if(query.length<2)return NextResponse.json({results:[]});try{const results=await searchSpotify(query);return NextResponse.json({enabled:results!==null,results:results??[]})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Search unavailable"},{status:503})}}
