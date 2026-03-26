import { assertSupabaseConfigured } from "./supabaseClient";

const STRIPE_SCRIPT_SRC = "https://js.stripe.com/v3/";
const STRIPE_SCRIPT_ID = "stripe-js-sdk";

const PAYMENT_LINKS = {
  monthly: import.meta.env.VITE_STRIPE_MONTHLY_PAYMENT_LINK,
  yearly: import.meta.env.VITE_STRIPE_YEARLY_PAYMENT_LINK,
};

let stripeLoaderPromise = null;

function formatError(error) {
  return error?.message || "Stripe checkout could not be started.";
}

function buildReturnUrl(pathname, status) {
  const url = new URL(pathname, window.location.origin);
  url.searchParams.set("status", status);
  return url.toString();
}

function normalizeSubscription(record, profile) {
  return {
    amount: Number(record?.amount ?? 0),
    currency: record?.currency || "GBP",
    customerId: record?.customer_id || profile?.customer_id || null,
    endsAt: record?.ends_at || null,
    paidAt: record?.paid_at || null,
    plan: record?.plan || record?.price_interval || profile?.subscription_plan || null,
    provider: record?.provider || "stripe",
    source: record?.source || "supabase",
    startsAt: record?.starts_at || null,
    status: record?.status || profile?.subscription_status || "inactive",
  };
}

function loadStripeScript() {
  if (window.Stripe) {
    return Promise.resolve(window.Stripe);
  }

  if (stripeLoaderPromise) {
    return stripeLoaderPromise;
  }

  stripeLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(STRIPE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.Stripe), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Stripe.js failed to load.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = STRIPE_SCRIPT_ID;
    script.src = STRIPE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(window.Stripe);
    script.onerror = () => reject(new Error("Stripe.js failed to load."));
    document.head.appendChild(script);
  });

  return stripeLoaderPromise;
}

async function getStripeClient() {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error(
      "VITE_STRIPE_PUBLISHABLE_KEY is missing. Add your Stripe publishable key to frontend/.env."
    );
  }

  const Stripe = await loadStripeScript();

  if (typeof Stripe !== "function") {
    throw new Error("Stripe.js is not available in the browser.");
  }

  return Stripe(publishableKey);
}

export async function getUserSubscriptionSummary(userId, profile) {
  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      return { data: normalizeSubscription(null, profile), error: null };
    }

    return { data: normalizeSubscription(data, profile), error: null };
  } catch {
    return { data: normalizeSubscription(null, profile), error: null };
  }
}

export async function startCheckoutSession({
  cancelPath = "/subscription",
  email,
  plan,
  successPath = "/dashboard",
  userId,
}) {
  const normalizedPlan = String(plan || "").toLowerCase();

  if (!userId) {
    return { data: null, error: "You must be signed in to start checkout." };
  }

  if (!PAYMENT_LINKS[normalizedPlan] && !["monthly", "yearly"].includes(normalizedPlan)) {
    return { data: null, error: "Please choose a valid subscription plan." };
  }

  try {
    const directLink = PAYMENT_LINKS[normalizedPlan];

    if (directLink) {
      window.location.assign(directLink);
      return {
        data: {
          message: "Redirecting to Stripe Checkout...",
          redirectUrl: directLink,
        },
        error: null,
      };
    }

    const functionName = import.meta.env.VITE_SUPABASE_STRIPE_FUNCTION;

    if (!functionName) {
      return {
        data: null,
        error:
          "Stripe checkout is not fully configured. Add Stripe payment links or set VITE_SUPABASE_STRIPE_FUNCTION.",
      };
    }

    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        cancel_url: buildReturnUrl(cancelPath, "checkout_cancelled"),
        email,
        plan: normalizedPlan,
        success_url: buildReturnUrl(successPath, "checkout_success"),
        user_id: userId,
      },
    });

    if (error) {
      return { data: null, error: formatError(error) };
    }

    if (data?.url) {
      window.location.assign(data.url);
      return {
        data: {
          message: "Redirecting to Stripe Checkout...",
          redirectUrl: data.url,
        },
        error: null,
      };
    }

    if (data?.sessionId) {
      const stripe = await getStripeClient();
      const redirectResult = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (redirectResult?.error) {
        return { data: null, error: formatError(redirectResult.error) };
      }

      return {
        data: {
          message: "Redirecting to Stripe Checkout...",
          sessionId: data.sessionId,
        },
        error: null,
      };
    }

    return {
      data: null,
      error: "The Stripe checkout function did not return a checkout URL or session ID.",
    };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}
