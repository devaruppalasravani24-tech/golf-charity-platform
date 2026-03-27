# Stripe Supabase Edge Functions

This project now includes two Supabase Edge Functions for Stripe subscriptions:

- `create-stripe-checkout-session`
- `stripe-webhook`

## Required secrets

Set these in Supabase:

```bash
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
supabase secrets set STRIPE_WEBHOOK_SIGNING_SECRET=your_stripe_webhook_secret
```

Supabase already provides:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deploy

```bash
supabase functions deploy create-stripe-checkout-session
supabase functions deploy stripe-webhook
```

## Stripe webhook endpoint

Point Stripe to:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

Listen for:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Frontend env

Set this in Vercel and local frontend env:

```env
VITE_SUPABASE_STRIPE_FUNCTION=create-stripe-checkout-session
```

The frontend can still keep Stripe Payment Link envs as a fallback, but the app should prefer the checkout-session function for the real subscription flow.
