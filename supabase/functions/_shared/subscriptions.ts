import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

function toIsoString(unixSeconds?: number | null) {
  if (!unixSeconds) {
    return null;
  }

  return new Date(unixSeconds * 1000).toISOString();
}

function mapStripeStatus(status?: string | null) {
  switch (status) {
    case "trialing":
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
    case "paused":
      return "lapsed";
    case "incomplete":
      return "pending";
    case "canceled":
      return "cancelled";
    case "incomplete_expired":
    default:
      return "inactive";
  }
}

function derivePlan({
  amount,
  interval,
  metadataPlan,
}: {
  amount?: number | null;
  interval?: string | null;
  metadataPlan?: string | null;
}) {
  const normalizedMetadataPlan = metadataPlan?.toLowerCase();

  if (normalizedMetadataPlan === "monthly" || normalizedMetadataPlan === "yearly") {
    return normalizedMetadataPlan;
  }

  if (interval === "year") {
    return "yearly";
  }

  if (interval === "month") {
    return "monthly";
  }

  if (amount === 199.99) {
    return "yearly";
  }

  return "monthly";
}

async function maybeLogWebhookEvent(adminClient, payload) {
  const { error } = await adminClient.from("stripe_webhook_events").upsert(payload, {
    onConflict: "event_id",
  });

  if (error) {
    const message = error.message?.toLowerCase?.() || "";
    if (
      message.includes("relation") ||
      message.includes("column") ||
      error.code === "42P01" ||
      error.code === "42703"
    ) {
      return;
    }

    throw error;
  }
}

export async function getWebhookEventStatus(adminClient, eventId: string) {
  const { data, error } = await adminClient
    .from("stripe_webhook_events")
    .select("processed")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) {
    const message = error.message?.toLowerCase?.() || "";
    if (
      message.includes("relation") ||
      message.includes("column") ||
      error.code === "42P01" ||
      error.code === "42703"
    ) {
      return null;
    }

    throw error;
  }

  return data?.processed ?? null;
}

async function maybeLogPayment(adminClient, payload) {
  const { error } = await adminClient.from("subscription_payments").insert(payload);

  if (error) {
    const message = error.message?.toLowerCase?.() || "";
    if (
      message.includes("relation") ||
      message.includes("column") ||
      error.code === "42P01" ||
      error.code === "42703"
    ) {
      return;
    }

    throw error;
  }
}

export function createAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Edge Function secrets."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function findUser(adminClient, {
  customerId,
  email,
  userId,
}: {
  customerId?: string | null;
  email?: string | null;
  userId?: string | null;
}) {
  if (userId) {
    const { data, error } = await adminClient
      .from("users")
      .select("id, email, full_name, customer_id, subscription_plan, subscription_status")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  }

  if (customerId) {
    const { data, error } = await adminClient
      .from("users")
      .select("id, email, full_name, customer_id, subscription_plan, subscription_status")
      .eq("customer_id", customerId)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  }

  if (email) {
    const { data, error } = await adminClient
      .from("users")
      .select("id, email, full_name, customer_id, subscription_plan, subscription_status")
      .eq("email", email)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  }

  return null;
}

export async function markWebhookProcessed(adminClient, {
  eventId,
  eventType,
  payload,
  processed,
  processingError = null,
}: {
  eventId: string;
  eventType: string;
  payload: unknown;
  processed: boolean;
  processingError?: string | null;
}) {
  await maybeLogWebhookEvent(adminClient, {
    created_at: new Date().toISOString(),
    event_id: eventId,
    event_type: eventType,
    payload,
    processed,
    processed_at: processed ? new Date().toISOString() : null,
    processing_error: processingError,
    received_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function syncStripeSubscriptionToSupabase(
  adminClient,
  {
    amount,
    currency,
    customerId,
    email,
    eventId,
    eventType,
    invoiceId,
    paidAt,
    payload,
    paymentIntentId,
    sessionId,
    stripeStatus,
    stripeSubscriptionId,
    subscriptionEndsAt,
    subscriptionStartsAt,
    userId,
    interval,
    metadataPlan,
  }: {
    amount?: number | null;
    currency?: string | null;
    customerId?: string | null;
    email?: string | null;
    eventId?: string | null;
    eventType?: string | null;
    invoiceId?: string | null;
    paidAt?: string | null;
    payload?: unknown;
    paymentIntentId?: string | null;
    sessionId?: string | null;
    stripeStatus?: string | null;
    stripeSubscriptionId?: string | null;
    subscriptionEndsAt?: string | null;
    subscriptionStartsAt?: string | null;
    userId?: string | null;
    interval?: string | null;
    metadataPlan?: string | null;
  }
) {
  const user = await findUser(adminClient, { customerId, email, userId });

  if (!user?.id) {
    throw new Error(
      `Could not match this Stripe subscription to an app user. user_id=${userId ?? "missing"}, email=${email ?? "missing"}`
    );
  }

  const normalizedAmount = Number(amount ?? 0);
  const plan = derivePlan({
    amount: normalizedAmount,
    interval,
    metadataPlan,
  });
  const status = mapStripeStatus(stripeStatus);
  const now = new Date().toISOString();
  const startsAt = subscriptionStartsAt || paidAt || now;
  const endsAt = subscriptionEndsAt || null;
  const paidTimestamp = paidAt || now;

  const { data: existingSubscription, error: existingSubscriptionError } =
    await adminClient
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (existingSubscriptionError && existingSubscriptionError.code !== "PGRST116") {
    throw existingSubscriptionError;
  }

  const subscriptionPayload = {
    amount: normalizedAmount,
    currency: (currency || "GBP").toUpperCase(),
    customer_id: customerId || user.customer_id || user.email || null,
    ends_at: endsAt,
    paid_at: paidTimestamp,
    plan,
    provider: "stripe",
    starts_at: startsAt,
    status,
    updated_at: now,
    user_id: user.id,
  };

  let subscriptionId = existingSubscription?.id ?? null;

  if (subscriptionId) {
    const { error } = await adminClient
      .from("subscriptions")
      .update(subscriptionPayload)
      .eq("id", subscriptionId);

    if (error) {
      throw error;
    }
  } else {
    const { data, error } = await adminClient
      .from("subscriptions")
      .insert({
        ...subscriptionPayload,
        created_at: now,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    subscriptionId = data.id;
  }

  const { error: userUpdateError } = await adminClient
    .from("users")
    .update({
      customer_id: customerId || user.customer_id || user.email || null,
      subscription_plan: plan,
      subscription_status: status,
      updated_at: now,
    })
    .eq("id", user.id);

  if (userUpdateError) {
    throw userUpdateError;
  }

  if (eventType === "checkout.session.completed") {
    await maybeLogPayment(adminClient, {
      amount: normalizedAmount,
      created_at: now,
      currency: (currency || "GBP").toUpperCase(),
      paid_at: paidTimestamp,
      payment_status: "captured",
      provider: "stripe",
      raw_payload: payload ?? {},
      subscription_id: subscriptionId,
      updated_at: now,
      user_id: user.id,
    });
  }

  if (eventId && eventType) {
    await markWebhookProcessed(adminClient, {
      eventId,
      eventType,
      payload,
      processed: true,
    });
  }

  return {
    customerId,
    plan,
    status,
    subscriptionId,
    stripeIds: {
      invoiceId,
      paymentIntentId,
      sessionId,
      stripeSubscriptionId,
    },
    userId: user.id,
  };
}

export function normalizeStripeSessionForSync(session: Record<string, unknown>) {
  const metadata = (session.metadata as Record<string, string> | null) ?? {};

  return {
    amount: Number((session.amount_total as number | null) ?? 0) / 100,
    currency: String((session.currency as string | null) ?? "gbp").toUpperCase(),
    customerId: (session.customer as string | null) ?? null,
    email:
      (session.customer_details as { email?: string } | null)?.email ??
      (session.customer_email as string | null) ??
      null,
    invoiceId: (session.invoice as string | null) ?? null,
    metadataPlan: metadata.plan ?? null,
    paidAt: new Date().toISOString(),
    paymentIntentId: (session.payment_intent as string | null) ?? null,
    sessionId: (session.id as string | null) ?? null,
    stripeSubscriptionId: (session.subscription as string | null) ?? null,
    userId: metadata.user_id ?? null,
  };
}

export function normalizeStripeSubscriptionForSync(
  subscription: Record<string, unknown>
) {
  const items =
    (subscription.items as { data?: Array<Record<string, unknown>> } | null)?.data ?? [];
  const firstItem = items[0] ?? {};
  const price = (firstItem.price as Record<string, unknown> | null) ?? {};
  const recurring = (price.recurring as Record<string, unknown> | null) ?? {};
  const metadata = (subscription.metadata as Record<string, string> | null) ?? {};

  return {
    amount: Number((price.unit_amount as number | null) ?? 0) / 100,
    currency: String((price.currency as string | null) ?? "gbp").toUpperCase(),
    customerId: (subscription.customer as string | null) ?? null,
    interval: (recurring.interval as string | null) ?? null,
    metadataPlan: metadata.plan ?? null,
    stripeStatus: (subscription.status as string | null) ?? "inactive",
    stripeSubscriptionId: (subscription.id as string | null) ?? null,
    subscriptionEndsAt: toIsoString(
      (subscription.current_period_end as number | null) ?? null
    ),
    subscriptionStartsAt: toIsoString(
      (subscription.current_period_start as number | null) ?? null
    ),
    userId: metadata.user_id ?? null,
  };
}
