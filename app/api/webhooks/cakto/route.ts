import { handleCaktoWebhook } from "@/lib/cakto/webhook";

export const runtime = "nodejs";
export const POST = handleCaktoWebhook;
