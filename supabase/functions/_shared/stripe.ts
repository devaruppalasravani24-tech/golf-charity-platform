import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";

export const STRIPE_API_VERSION = "2024-06-20";

export function createStripeClient() {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!secretKey) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY. Add it to your Supabase Edge Function secrets."
    );
  }

  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export function createStripeCryptoProvider() {
  return Stripe.createSubtleCryptoProvider();
}
