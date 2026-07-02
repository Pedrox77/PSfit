import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { usernameSchema } from "@/lib/validations/username";
export async function GET(request:NextRequest){const parsed=usernameSchema.safeParse(request.nextUrl.searchParams.get("value")??"");if(!parsed.success)return NextResponse.json({available:false});const supabase=await createClient();const {data,error}=await supabase.rpc("check_username_availability",{candidate:parsed.data});return NextResponse.json({available:!error&&Boolean(data)})}
