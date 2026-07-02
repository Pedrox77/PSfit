import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

const terminalStatuses = new Set([
  "canceled",
  "incomplete_expired",
  "unpaid",
]);

function objectId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const timestamp = subscription.items.data[0]?.current_period_end;
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
}

async function updateSubscription(
  subscription: Stripe.Subscription,
  fallbackUserId?: string | null,
) {
  const admin = createAdminClient();
  const customerId = objectId(subscription.customer);
  const userId = subscription.metadata.user_id || fallbackUserId || null;
  if (!userId && !customerId) {
    throw new Error("Subscription has no user or customer reference.");
  }
  let query = admin
    .from("profiles")
    .select("id,plan")
    .limit(1);
  query = userId
    ? query.eq("id", userId)
    : query.eq("stripe_customer_id", customerId!);
  const { data: profile, error: findError } = await query.maybeSingle();
  if (findError) throw findError;
  if (!profile) throw new Error("Billing profile was not found.");

  const status = subscription.status;
  const active = status === "active" || status === "trialing";
  const plan = active
    ? "pro"
    : terminalStatuses.has(status)
      ? "free"
      : profile.plan;
  const { error } = await admin
    .from("profiles")
    .update({
      plan,
      plan_status: status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id:
        subscription.items.data[0]?.price.id ?? null,
      stripe_current_period_end:
        subscriptionPeriodEnd(subscription),
      stripe_cancel_at_period_end:
        subscription.cancel_at_period_end,
    })
    .eq("id", profile.id);
  if (error) throw error;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const parent = invoice.parent;
  if (
    parent?.type === "subscription_details" &&
    parent.subscription_details?.subscription
  ) {
    return objectId(parent.subscription_details.subscription);
  }
  return null;
}

async function retrieveSubscription(subscriptionId: string) {
  try {
    return await getStripe().subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error("[PSFIT STRIPE]", {
      operation: "subscriptions.retrieve",
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook signature is unavailable." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: processed } = await admin
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (processed) return NextResponse.json({ received: true });

  let customerId: string | null = null;
  let subscriptionId: string | null = null;
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        customerId = objectId(session.customer);
        subscriptionId = objectId(session.subscription);
        if (subscriptionId) {
          const subscription = await retrieveSubscription(subscriptionId);
          await updateSubscription(
            subscription,
            session.metadata?.user_id ?? session.client_reference_id,
          );
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        customerId = objectId(subscription.customer);
        subscriptionId = subscription.id;
        await updateSubscription(subscription);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        customerId = objectId(invoice.customer);
        subscriptionId = invoiceSubscriptionId(invoice);
        if (subscriptionId) {
          const subscription =
            await retrieveSubscription(subscriptionId);
          await updateSubscription(subscription);
        }
        break;
      }
    }

    const { error } = await admin
      .from("stripe_webhook_events")
      .insert({ id: event.id, event_type: event.type });
    if (error?.code !== "23505" && error) throw error;

    console.info("[PSFIT STRIPE WEBHOOK]", {
      eventId: event.id,
      eventType: event.type,
      customerId,
      subscriptionId,
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PSFIT STRIPE WEBHOOK ERROR]", {
      eventId: event.id,
      eventType: event.type,
      customerId,
      subscriptionId,
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
