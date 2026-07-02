import { saveNutrition } from "@/app/onboarding/actions";
import { NextResponse } from "next/server";
import { getCurrentUserEntitlements } from "@/lib/billing/current-entitlements";
export async function POST(request:Request){
 try{
  const {entitlements}=await getCurrentUserEntitlements();
  if(!entitlements.canUseNutrition)return NextResponse.json({ok:false,errorCode:"PRO_REQUIRED",error:"Nutrition is available with PSFIT Pro."},{status:403});
  const result=await saveNutrition(await request.formData());
  return NextResponse.json(result,{status:result.ok?200:result.errorCode==="PRO_REQUIRED"?403:400});
 }catch{return NextResponse.json({ok:false,errorCode:"UNAUTHENTICATED",error:"Authentication required."},{status:401})}
}
