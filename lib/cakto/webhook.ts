import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const MAX_BODY_BYTES = 256 * 1024;
const PROVIDER = "cakto";
const ACTIVE_EVENTS = new Set(["purchase_approved", "subscription_renewed"]);
const REVOKE_EVENTS = new Set(["subscription_canceled", "refund", "chargeback"]);
const SUPPORTED_EVENTS = new Set([
  ...ACTIVE_EVENTS,
  ...REVOKE_EVENTS,
  "subscription_renewal_refused",
]);

type JsonObject = Record<string, unknown>;
export type CaktoPlan = "pro_mensal" | "pro_anual";
export type CaktoPayload = {
  event: string;
  secret: string;
  data: JsonObject;
  [key: string]: unknown;
};

type WebhookRegistration =
  | { duplicate: true }
  | { duplicate: false; id: string };

function asObject(value: unknown): JsonObject | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

function stringValue(value: unknown): string | null {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized || null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

async function readLimitedBody(request: Request) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new Error("BODY_TOO_LARGE");
  }

  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error("BODY_TOO_LARGE");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export function parseCaktoPayload(rawBody: string): CaktoPayload {
  const parsed = asObject(JSON.parse(rawBody));
  const data = asObject(parsed?.data);
  const event = stringValue(parsed?.event);
  const secret = stringValue(parsed?.secret);
  if (!parsed || !data || !event || !secret) {
    throw new Error("INVALID_PAYLOAD");
  }
  return { ...parsed, event, secret, data };
}

export function validateWebhookSecret(
  receivedSecret: string,
  expectedSecret: string,
) {
  const received = Buffer.from(receivedSecret, "utf8");
  const expected = Buffer.from(expectedSecret, "utf8");
  return received.length === expected.length &&
    timingSafeEqual(received, expected);
}

export function getEventType(payload: CaktoPayload) {
  return payload.event;
}

export function getOfferId(payload: CaktoPayload) {
  return stringValue(asObject(payload.data.offer)?.id);
}

export function getOrderId(payload: CaktoPayload) {
  return stringValue(payload.data.id);
}

export function getCustomerEmail(payload: CaktoPayload) {
  const email = stringValue(asObject(payload.data.customer)?.email);
  return email?.trim().toLowerCase() ?? null;
}

function getSubscriptionId(payload: CaktoPayload) {
  const subscription = payload.data.subscription;
  return stringValue(subscription) ??
    stringValue(asObject(subscription)?.id);
}

export function resolvePlanFromOffer(offerId: string | null): CaktoPlan | null {
  if (!offerId) return null;
  if (offerId === (process.env.CAKTO_MONTHLY_OFFER_ID || "t5r8ew7")) {
    return "pro_mensal";
  }
  if (offerId === (process.env.CAKTO_YEARLY_OFFER_ID || "6a7wso4")) {
    return "pro_anual";
  }
  return null;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function getEventId(payload: CaktoPayload, payloadHash: string) {
  const explicitId = stringValue(payload.id) ??
    stringValue(payload.event_id);
  if (explicitId) return explicitId;

  // Cakto's documented delivery payload has no dedicated event id. This
  // stable composite distinguishes lifecycle events while deduplicating retries.
  const eventMoment = stringValue(payload.data.paidAt) ??
    stringValue(payload.data.refundedAt) ??
    stringValue(payload.data.canceledAt) ??
    stringValue(payload.data.chargedbackAt) ??
    stringValue(payload.data.createdAt);
  const parts = [
    getEventType(payload),
    getOrderId(payload),
    getSubscriptionId(payload),
    eventMoment,
  ];
  return parts.some((part, index) => index > 0 && part)
    ? sha256(parts.map((part) => part ?? "").join(":"))
    : payloadHash;
}

export async function findUserByExactEmail(
  admin: SupabaseClient<Database>,
  normalizedEmail: string,
): Promise<User | null> {
  const matches: User[] = [];
  const perPage = 1000;
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    for (const user of data.users) {
      if (user.email?.trim().toLowerCase() === normalizedEmail) {
        matches.push(user);
      }
    }
    if (data.users.length < perPage) break;
  }
  return matches.length === 1 ? matches[0] : null;
}

export async function registerWebhookEvent(
  admin: SupabaseClient<Database>,
  values: {
    providerEventId: string;
    eventType: string;
    orderId: string | null;
    payloadHash: string;
  },
): Promise<WebhookRegistration> {
  const { data, error } = await admin
    .from("payment_webhook_events")
    .insert({
      provider: PROVIDER,
      provider_event_id: values.providerEventId,
      event_type: values.eventType,
      order_id: values.orderId,
      payload_hash: values.payloadHash,
      processed_at: null,
    })
    .select("id")
    .single();
  if (error?.code === "23505") return { duplicate: true };
  if (error) throw error;
  return { duplicate: false, id: data.id };
}

async function findCaktoProfileForRevocation(
  admin: SupabaseClient<Database>,
  payload: CaktoPayload,
) {
  const orderId = getOrderId(payload);
  const subscriptionId = getSubscriptionId(payload);
  const offerId = getOfferId(payload);
  const email = getCustomerEmail(payload);
  const select = "id";

  if (orderId) {
    const result = await admin.from("profiles").select(select)
      .eq("payment_provider", PROVIDER).eq("cakto_order_id", orderId).limit(2);
    if (result.error) throw result.error;
    if (result.data.length === 1) return result.data[0];
  }
  if (subscriptionId) {
    const result = await admin.from("profiles").select(select)
      .eq("payment_provider", PROVIDER)
      .eq("cakto_subscription_id", subscriptionId).limit(2);
    if (result.error) throw result.error;
    if (result.data.length === 1) return result.data[0];
  }
  if (offerId && email) {
    const result = await admin.from("profiles").select(select)
      .eq("payment_provider", PROVIDER).eq("cakto_offer_id", offerId)
      .eq("cakto_customer_email", email).limit(2);
    if (result.error) throw result.error;
    if (result.data.length === 1) return result.data[0];
  }
  return null;
}

function ignored(reason: string) {
  return NextResponse.json({ ok: true, ignored: true, reason });
}

export async function handleCaktoWebhook(request: Request) {
  let rawBody: string;
  try {
    rawBody = await readLimitedBody(request);
  } catch {
    return NextResponse.json({ ok: false, error: "body_too_large" }, {
      status: 413,
    });
  }

  let payload: CaktoPayload;
  try {
    payload = parseCaktoPayload(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json_or_payload" }, {
      status: 400,
    });
  }

  const expectedSecret = process.env.CAKTO_WEBHOOK_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ ok: false, error: "webhook_not_configured" }, {
      status: 500,
    });
  }
  if (!validateWebhookSecret(payload.secret, expectedSecret)) {
    return NextResponse.json({ ok: false, error: "invalid_webhook_secret" }, {
      status: 401,
    });
  }

  const eventType = getEventType(payload);
  const offerId = getOfferId(payload);
  const orderId = getOrderId(payload);
  const email = getCustomerEmail(payload);
  if (process.env.NODE_ENV === "development") {
    console.info("[PSFIT CAKTO WEBHOOK]", {
      eventType,
      eventIdPresent: Boolean(payload.id || payload.event_id),
      offerIdPresent: Boolean(offerId),
      orderIdPresent: Boolean(orderId),
      emailPresent: Boolean(email),
      topLevelKeys: Object.keys(payload),
    });
  }
  if (!SUPPORTED_EVENTS.has(eventType)) return ignored("unsupported_event");

  const payloadHash = sha256(rawBody);
  const eventId = getEventId(payload, payloadHash);
  const admin = createAdminClient();
  let registration: WebhookRegistration;
  try {
    registration = await registerWebhookEvent(admin, {
      providerEventId: eventId,
      eventType,
      orderId,
      payloadHash,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "event_registration_failed" }, {
      status: 500,
    });
  }
  if (registration.duplicate) return ignored("duplicate_event");

  try {
    if (ACTIVE_EVENTS.has(eventType)) {
      const plan = resolvePlanFromOffer(offerId);
      if (!offerId || !plan) return await finishIgnored(
        admin, registration.id, "unknown_offer",
      );
      if (!orderId) return await finishIgnored(
        admin, registration.id, "missing_order_id",
      );
      if (!email) return await finishIgnored(
        admin, registration.id, "missing_customer_email",
      );

      const user = await findUserByExactEmail(admin, email);
      if (!user) return await finishIgnored(
        admin, registration.id, "user_not_found_or_ambiguous",
      );

      const now = new Date().toISOString();
      const { error } = await admin.from("profiles").update({
        plan,
        plan_status: "active",
        payment_provider: PROVIDER,
        cakto_order_id: orderId,
        cakto_offer_id: offerId,
        cakto_subscription_id: getSubscriptionId(payload),
        cakto_customer_email: email,
        pro_ativado_em: now,
        updated_at: now,
      }).eq("id", user.id);
      if (error) throw error;
    } else if (REVOKE_EVENTS.has(eventType)) {
      const profile = await findCaktoProfileForRevocation(admin, payload);
      if (!profile) return await finishIgnored(
        admin, registration.id, "billing_reference_mismatch",
      );
      const { error } = await admin.from("profiles").update({
        plan: "free",
        plan_status: "inactive",
        updated_at: new Date().toISOString(),
      }).eq("id", profile.id).eq("payment_provider", PROVIDER);
      if (error) throw error;
    } else {
      // A failed renewal does not revoke access. The current schema has no
      // separate billing-health status, so the active entitlement is preserved.
      return await finishIgnored(
        admin, registration.id, "renewal_payment_pending",
      );
    }

    const { error } = await admin.from("payment_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", registration.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    // A failed attempt must remain retryable; successful/ignored events are kept.
    await admin.from("payment_webhook_events").delete()
      .eq("id", registration.id);
    return NextResponse.json({ ok: false, error: "webhook_processing_failed" }, {
      status: 500,
    });
  }
}

async function finishIgnored(
  admin: SupabaseClient<Database>,
  registrationId: string,
  reason: string,
) {
  const { error } = await admin.from("payment_webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("id", registrationId);
  if (error) throw error;
  return ignored(reason);
}
