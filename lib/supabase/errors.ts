export type SupabaseErrorLike = { message: string; code?: string; details?: string; hint?: string };
export function logSupabaseError(context: string, error: SupabaseErrorLike) {
  console.error(context, { message: error.message, code: error.code, details: error.details, hint: error.hint });
}
