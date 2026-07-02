import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const onboardingPath =
    path === "/onboarding" || path.startsWith("/onboarding/");

  const nutritionPath =
    path === "/nutrition" || path.startsWith("/nutrition/");

  const protectedPath =
    onboardingPath ||
    [
      "/dashboard",
      "/community",
      "/u/",
      "/settings",
      "/today",
      "/workouts",
      "/nutrition",
      "/progress",
      "/twin",
      "/recovery",
      "/momentum",
      "/meals",
    ].some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    );

  function redirected(pathname: string, redirectTo?: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";

    if (redirectTo) {
      url.searchParams.set("redirectTo", redirectTo);
    }

    const result = NextResponse.redirect(url);

    response.cookies.getAll().forEach((cookie) => {
      result.cookies.set(cookie);
    });

    return result;
  }

  if (protectedPath && !data.user) {
    return redirected("/login", `${path}${request.nextUrl.search}`);
  }

  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username,onboarding_step,onboarding_completed")
      .eq("id", data.user.id)
      .maybeSingle();

    if (
      protectedPath &&
      !profile?.username &&
      path !== "/onboarding/nickname"
    ) {
      return redirected("/onboarding/nickname");
    }

    // The nutrition area has its own setup flow. Users may configure it
    // without being sent back to the general personalization screen.
    if (
      protectedPath &&
      profile?.username &&
      !profile.onboarding_completed &&
      !onboardingPath &&
      !nutritionPath
    ) {
      return redirected(
        `/onboarding/${profile.onboarding_step ?? "personalization"}`,
      );
    }

    if (
      onboardingPath &&
      profile?.onboarding_completed &&
      request.nextUrl.searchParams.get("edit") !== "true"
    ) {
      return redirected("/dashboard");
    }
  }

  return response;
}
