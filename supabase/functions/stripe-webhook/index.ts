import { corsHeaders } from "../_shared/cors.ts";
import {
  createAdminClient,
  getWebhookEventStatus,
  markWebhookProcessed,
  normalizeStripeSessionForSync,
  normalizeStripeSubscriptionForSync,
  syncStripeSubscriptionToSupabase,
} from "../_shared/subscriptions.ts";
import {
  createStripeClient,
  createStripeCryptoProvider,
} from "../_shared/stripe.ts";

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status,
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");

  if (!webhookSecret) {
    return jsonResponse(500, {
      error:
        "Missing STRIPE_WEBHOOK_SIGNING_SECRET. Add it to your Supabase Edge Function secrets.",
    });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return jsonResponse(400, { error: "Missing Stripe-Signature header." });
  }

  const stripe = createStripeClient();
  const cryptoProvider = createStripeCryptoProvider();
  const adminClient = createAdminClient();
  const body = await request.text();

  let event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
  } catch (error) {
    return jsonResponse(400, {
      error:
        error instanceof Error ? error.message : "Stripe webhook verification failed.",
    });
  }

  try {
    const processedAlready = await getWebhookEventStatus(adminClient, event.id);

    if (processedAlready) {
      return jsonResponse(200, { duplicate: true, received: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const normalizedSession = normalizeStripeSessionForSync(session);

        let subscriptionData = null;
        if (normalizedSession.stripeSubscriptionId) {
          const stripeSubscription = await stripe.subscriptions.retrieve(
            normalizedSession.stripeSubscriptionId
          );
          subscriptionData = normalizeStripeSubscriptionForSync(stripeSubscription);
        }

        await syncStripeSubscriptionToSupabase(adminClient, {
          ...normalizedSession,
          ...subscriptionData,
          eventId: event.id,
          eventType: event.type,
          payload: event,
          stripeStatus: subscriptionData?.stripeStatus ?? "active",
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const normalizedSubscription =
          normalizeStripeSubscriptionForSync(subscription);

        await syncStripeSubscriptionToSupabase(adminClient, {
          ...normalizedSubscription,
          eventId: event.id,
          eventType: event.type,
          payload: event,
        });
        break;
      }

      default: {
        await markWebhookProcessed(adminClient, {
          eventId: event.id,
          eventType: event.type,
          payload: event,
          processed: true,
        });
      }
    }

    return jsonResponse(200, { received: true });
  } catch (error) {
    await markWebhookProcessed(adminClient, {
      eventId: event.id,
      eventType: event.type,
      payload: event,
      processed: false,
      processingError:
        error instanceof Error ? error.message : "Unknown Stripe webhook error.",
    });

    return jsonResponse(500, {
      error:
        error instanceof Error
          ? error.message
          : "Stripe webhook processing failed.",
    });
  }
});
