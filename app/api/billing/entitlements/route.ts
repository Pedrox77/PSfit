import { getCurrentUserEntitlements } from "@/lib/billing/current-entitlements";
import { NextResponse } from "next/server";

export async function GET(){
  try{
    const {entitlements}=await getCurrentUserEntitlements();
    return NextResponse.json({isPro:entitlements.isPro});
  }catch{return NextResponse.json({isPro:false},{status:401})}
}
