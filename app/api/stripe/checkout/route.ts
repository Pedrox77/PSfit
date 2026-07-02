import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { getAppUrl } from "@/lib/stripe/url";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type BillingCycle = "monthly" | "yearly";

function stripeFailure(operation: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[PSFIT STRIPE]", { operation, message });
  return NextResponse.json(
    { error: `Stripe operation failed: ${operation}` },
    { status: 502 },
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth, error: authError } =
    await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400 },
    );
  }
  const billingCycle =
    body && typeof body === "object" && "billingCycle" in body
      ? (body as { billingCycle?: unknown }).billingCycle
      : undefined;
  if (billingCycle !== "monthly" && billingCycle !== "yearly") {
    return NextResponse.json(
      { error: "INVALID_BILLING_CYCLE" },
      { status: 400 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id,plan_status")
    .eq("id", auth.user.id)
    .single();
  if (profileError) {
    return NextResponse.json(
      { error: "PROFILE_UNAVAILABLE" },
      { status: 500 },
    );
  }
  if (
    profile.plan_status === "active" ||
    profile.plan_status === "trialing"
  ) {
    return NextResponse.json(
      { error: "ALREADY_SUBSCRIBED" },
      { status: 409 },
    );
  }

  const priceId =
    billingCycle === "monthly"
      ? process.env.STRIPE_PRICE_PRO_MONTHLY
      : process.env.STRIPE_PRICE_PRO_YEARLY;
  if (!priceId) {
    return NextResponse.json(
      { error: "PRICE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  const stripe = getStripe();
  let customerId = profile.stripe_customer_id as string | null;
  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: auth.user.email,
        metadata: { user_id: auth.user.id },
      });
      customerId = customer.id;
    } catch (error) {
      return stripeFailure("customers.create", error);
    }

    const { error } = await createAdminClient()
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", auth.user.id);
    if (error) {
      return NextResponse.json(
        { error: "CUSTOMER_SAVE_FAILED" },
        { status: 500 },
      );
    }
  }

  try {
    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      success_url: `${appUrl}/settings/billing?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=canceled`,
      client_reference_id: auth.user.id,
      metadata: {
        user_id: auth.user.id,
        billing_cycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          user_id: auth.user.id,
          billing_cycle: billingCycle,
        },
      },
      allow_promotion_codes: true,
    });
    if (!session.url) {
      return NextResponse.json(
        { error: "CHECKOUT_URL_MISSING" },
        { status: 502 },
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return stripeFailure("checkout.sessions.create", error);
  }
}
