import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { getAppUrl } from "@/lib/stripe/url";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", auth.user.id)
    .single();
  if (error || !profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "NO_STRIPE_CUSTOMER" },
      { status: 400 },
    );
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${getAppUrl()}/settings/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[PSFIT STRIPE]", {
      operation: "billingPortal.sessions.create",
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error:
          "Stripe operation failed: billingPortal.sessions.create",
      },
      { status: 502 },
    );
  }
}
