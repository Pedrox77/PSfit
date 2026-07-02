import { savePersonalization } from "@/app/onboarding/actions";
import { NextResponse } from "next/server";
export async function POST(request:Request){const result=await savePersonalization(await request.formData());return NextResponse.json(result,{status:result.ok?200:result.errorCode==="PRO_REQUIRED"?403:400})}
