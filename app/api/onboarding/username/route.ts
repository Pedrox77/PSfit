import { createClient } from "@/lib/supabase/server";
import { NextRequest,NextResponse } from "next/server";
export async function GET(request:NextRequest){const candidate=request.nextUrl.searchParams.get("candidate")??"";const supabase=await createClient();const {data:auth}=await supabase.auth.getUser();if(!auth.user)return NextResponse.json({available:false},{status:401});const {data,error}=await supabase.rpc("check_username_availability",{candidate});return NextResponse.json({available:!error&&Boolean(data)})}
