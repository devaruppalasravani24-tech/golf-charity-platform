import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { corsHeaders } from "../_shared/cors.ts";
import { createStripeClient } from "../_shared/stripe.ts";

const PLAN_CONFIG = {
  monthly: {
    interval: "month",
    name: "Golf Gives Monthly Subscription",
    unitAmount: 1999,
  },
  yearly: {
    interval: "year",
    name: "Golf Gives Yearly Subscription",
    unitAmount: 19999,
  },
};

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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authorization = request.headers.get("Authorization");

    if (!supabaseUrl || !supabaseAnonKey || !authorization) {
      return jsonResponse(401, { error: "Missing Supabase auth context." });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse(401, { error: "You must be signed in to start Stripe checkout." });
    }

    const body = await request.json();
    const plan = String(body.plan || "").toLowerCase();
    const planConfig = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG];

    if (!planConfig) {
      return jsonResponse(400, { error: "Please choose a valid subscription plan." });
    }

    const successUrl = String(body.success_url || "").trim();
    const cancelUrl = String(body.cancel_url || "").trim();

    if (!successUrl || !cancelUrl) {
      return jsonResponse(400, {
        error: "Both success_url and cancel_url are required to create a checkout session.",
      });
    }

    if (body.user_id && body.user_id !== user.id) {
      return jsonResponse(403, {
        error: "The requested user does not match the signed-in user.",
      });
    }

    const stripe = createStripeClient();

    const session = await stripe.checkout.sessions.create({
      allow_promotion_codes: true,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: planConfig.name,
            },
            recurring: {
              interval: planConfig.interval,
            },
            unit_amount: planConfig.unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan,
        user_id: user.id,
      },
      mode: "subscription",
      subscription_data: {
        metadata: {
          plan,
          user_id: user.id,
        },
      },
      success_url: successUrl,
    });

    return jsonResponse(200, {
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    return jsonResponse(500, {
      error:
        error instanceof Error
          ? error.message
          : "Stripe checkout session could not be created.",
    });
  }
});
