import { GoogleGenAI } from "@google/genai";
import { getCurrentUserEntitlements } from "@/lib/billing/current-entitlements";
import { createClient } from "@/lib/supabase/server";
import { importedWorkoutSchema } from "@/lib/validations/workout";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const MODEL = "gemini-3.5-flash";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/webp","image/jpeg","image/png"]);
const requestSchema = z.object({storage_path:z.string().min(1).max(500)});

const workoutImportJsonSchema = {
  type:"object",
  additionalProperties:false,
  properties:{
    title:{type:["string","null"]},
    exercises:{
      type:"array",
      minItems:1,
      items:{
        type:"object",
        additionalProperties:false,
        properties:{
          name:{type:"string"},
          sets:{type:["integer","null"]},
          repetitions:{type:["string","null"]},
          rest_seconds:{type:["integer","null"]},
          load_guidance:{type:["string","null"]},
          notes:{type:["string","null"]},
        },
        required:["name","sets","repetitions","rest_seconds","load_guidance","notes"],
      },
    },
  },
  required:["title","exercises"],
} as const;

const prompt=`Analise esta imagem de uma ficha de treino.

Extraia apenas informações visíveis.

Identifique o nome do treino e, na ordem em que aparecem, o nome de cada exercício, quantidade de séries, repetições, carga em kg quando visível, tempo de descanso quando visível e observações.

Regras:
- não invente exercícios, cargas ou valores;
- quando uma informação não estiver visível, use null;
- preserve números e unidades;
- diferencie séries de repetições;
- coloque a carga visível em load_guidance, preservando a unidade;
- use notes para sinalizar texto parcialmente ilegível relacionado ao exercício;
- não forneça orientação médica;
- se não houver nenhum exercício identificável, retorne exercises vazio;
- retorne somente o JSON solicitado.`;

type ErrorCode="GEMINI_NOT_CONFIGURED"|"GEMINI_RATE_LIMIT"|"IMAGE_UNREADABLE"|"INVALID_GEMINI_RESPONSE"|"IMAGE_INVALID"|"IMPORT_NOT_FOUND"|"STORAGE_ERROR"|"SUPABASE_ERROR";

function failure(errorCode:ErrorCode,error:string,status:number){
  return NextResponse.json({ok:false,errorCode,error},{status});
}

function safeError(error:unknown){
  return error instanceof Error?error.message:String(error);
}

export async function POST(request:Request){
  const access=await getCurrentUserEntitlements().catch(()=>null);
  if(!access)return NextResponse.json({ok:false,errorCode:"UNAUTHENTICATED",error:"Sua sessão expirou."},{status:401});
  if(!access.entitlements.canImportWorkoutPhoto)return NextResponse.json({ok:false,errorCode:"PRO_REQUIRED",error:"A importação por foto está disponível no PSFIT Pro."},{status:403});

  const db=await createClient();
  let body:z.infer<typeof requestSchema>;
  try{body=requestSchema.parse(await request.json())}catch{return failure("IMPORT_NOT_FOUND","Importação inválida.",400)}

  const {data:record,error:recordError}=await db.from("workout_imports").select("id,storage_path,mime_type,size_bytes").eq("user_id",access.user.id).eq("storage_path",body.storage_path).single();
  if(recordError||!record||!record.storage_path.startsWith(`${access.user.id}/`))return failure("IMPORT_NOT_FOUND","Importação não encontrada.",404);

  const markFailed=async(message:string)=>{
    const {error}=await db.from("workout_imports").update({status:"failed",error_message:message.slice(0,300)}).eq("id",record.id).eq("user_id",access.user.id);
    if(error)console.error("[PSFIT IMPORT] Falha ao atualizar status",{code:error.code});
  };

  const geminiApiKey=process.env.GEMINI_API_KEY;
  if(!geminiApiKey){
    await markFailed("Gemini não configurado.");
    return failure("GEMINI_NOT_CONFIGURED","GEMINI_API_KEY não está configurada.",500);
  }

  const mimeType=record.mime_type||"";
  if(!ALLOWED_MIME_TYPES.has(mimeType)||!record.size_bytes||record.size_bytes>MAX_IMAGE_BYTES){
    await markFailed("Imagem inválida.");
    return failure("IMAGE_INVALID","A imagem enviada é inválida ou excede o limite permitido.",400);
  }

  const processing=await db.from("workout_imports").update({status:"processing",error_message:null}).eq("id",record.id).eq("user_id",access.user.id);
  if(processing.error)return failure("SUPABASE_ERROR","Não foi possível iniciar a análise.",500);

  try{
    const {data:file,error:downloadError}=await db.storage.from("workout-imports").download(record.storage_path);
    if(downloadError||!file){
      await markFailed("Imagem indisponível no armazenamento.");
      return failure("STORAGE_ERROR","Não foi possível carregar a imagem.",404);
    }
    const imageBuffer=Buffer.from(await file.arrayBuffer());
    if(!imageBuffer.length||imageBuffer.length>MAX_IMAGE_BYTES){
      await markFailed("Conteúdo de imagem inválido.");
      return failure("IMAGE_INVALID","A imagem enviada é inválida ou excede o limite permitido.",400);
    }

    const ai=new GoogleGenAI({});
    const interaction=await ai.interactions.create({
      model:MODEL,
      input:[
        {type:"text",text:prompt},
        {type:"image",data:imageBuffer.toString("base64"),mime_type:mimeType},
      ],
      response_format:{type:"text",mime_type:"application/json",schema:workoutImportJsonSchema},
    });
    if(!interaction.output_text){
      await markFailed("O Gemini não retornou conteúdo.");
      return failure("IMAGE_UNREADABLE","Não foi possível identificar os exercícios nessa imagem.",422);
    }

    let json:unknown;
    try{json=JSON.parse(interaction.output_text)}catch{
      await markFailed("Resposta inválida da análise.");
      return failure("INVALID_GEMINI_RESPONSE","A análise retornou dados inválidos. Tente novamente.",502);
    }
    if(typeof json==="object"&&json!==null&&"exercises" in json&&Array.isArray(json.exercises)&&json.exercises.length===0){
      await markFailed("Nenhum exercício identificável.");
      return failure("IMAGE_UNREADABLE","Não foi possível identificar os exercícios nessa imagem.",422);
    }
    const validated=importedWorkoutSchema.safeParse(json);
    if(!validated.success){
      await markFailed("Resposta fora do formato esperado.");
      return failure("INVALID_GEMINI_RESPONSE","A análise retornou dados inválidos. Tente novamente.",502);
    }
    const saved=await db.from("workout_imports").update({status:"review",extracted_data:validated.data,error_message:null}).eq("id",record.id).eq("user_id",access.user.id);
    if(saved.error){
      await markFailed("Falha ao salvar resultado.");
      return failure("SUPABASE_ERROR","Não foi possível salvar a análise.",500);
    }
    return NextResponse.json(validated.data);
  }catch(error){
    const details=safeError(error);
    const status=typeof error==="object"&&error!==null&&"status" in error?Number((error as {status?:unknown}).status):0;
    console.error("[PSFIT IMPORT] Gemini",{model:MODEL,status,message:details.slice(0,200)});
    if(status===429||/quota|rate.?limit|resource.?exhausted/i.test(details)){
      await markFailed("Limite temporário do Gemini atingido.");
      return failure("GEMINI_RATE_LIMIT","O limite temporário de análise de imagens foi atingido. Tente novamente mais tarde.",429);
    }
    await markFailed("Falha na análise da imagem.");
    return failure("INVALID_GEMINI_RESPONSE","Não foi possível analisar a imagem. Tente novamente.",502);
  }
}
