import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith("/") ? requestedNext : "/onboarding/nickname";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const fullName =
          typeof auth.user.user_metadata?.full_name === "string"
            ? auth.user.user_metadata.full_name.trim()
            : null;
        await createAdminClient().from("profiles").upsert(
          {
            id: auth.user.id,
            full_name: fullName || null,
            onboarding_step: "nickname",
            onboarding_completed: false,
          },
          { onConflict: "id", ignoreDuplicates: true },
        );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation`);
}
