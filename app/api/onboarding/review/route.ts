import { beginGeneration } from "@/app/onboarding/actions";
import { NextResponse } from "next/server";
export async function POST(request:Request){const result=await beginGeneration(await request.formData());return NextResponse.json(result,{status:result.ok?200:400})}
