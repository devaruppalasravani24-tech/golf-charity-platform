import { assertSupabaseConfigured } from "./supabaseClient";

const STRIPE_SCRIPT_SRC = "https://js.stripe.com/v3/";
const STRIPE_SCRIPT_ID = "stripe-js-sdk";
const PENDING_STRIPE_CHECKOUT_STORAGE_KEY =
  "golf-charity-platform.pending-stripe-checkout";

const PAYMENT_LINKS = {
  monthly: import.meta.env.VITE_STRIPE_MONTHLY_PAYMENT_LINK,
  yearly: import.meta.env.VITE_STRIPE_YEARLY_PAYMENT_LINK,
};

const PLAN_PRICING = {
  monthly: 19.99,
  yearly: 199.99,
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

function buildEndsAt(plan, startsAt) {
  const date = new Date(startsAt);
  if (plan === "yearly") {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString();
}

function normalizeSubscription(record, profile) {
  return {
    amount: Number(record?.amount ?? PLAN_PRICING[record?.plan] ?? 0),
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

function readPendingStripeCheckout() {
  try {
    const payload = window.localStorage.getItem(
      PENDING_STRIPE_CHECKOUT_STORAGE_KEY
    );
    return payload ? JSON.parse(payload) : null;
  } catch {
    return null;
  }
}

function persistPendingStripeCheckout(payload) {
  window.localStorage.setItem(
    PENDING_STRIPE_CHECKOUT_STORAGE_KEY,
    JSON.stringify(payload)
  );
}

function clearPendingStripeCheckout() {
  window.localStorage.removeItem(PENDING_STRIPE_CHECKOUT_STORAGE_KEY);
}

function removeStatusFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("status")) {
    return;
  }

  url.searchParams.delete("status");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
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

async function persistSupabaseStripeSubscription({ email, plan, userId }) {
  const supabase = assertSupabaseConfigured();
  const startsAt = new Date().toISOString();
  const subscriptionPayload = {
    amount: PLAN_PRICING[plan],
    currency: "GBP",
    customer_id: email || null,
    ends_at: buildEndsAt(plan, startsAt),
    paid_at: startsAt,
    plan,
    provider: "stripe",
    starts_at: startsAt,
    status: "active",
    updated_at: startsAt,
    user_id: userId,
  };

  const { data: existingSubscription, error: existingError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    throw existingError;
  }

  if (existingSubscription?.id) {
    const { error } = await supabase
      .from("subscriptions")
      .update(subscriptionPayload)
      .eq("id", existingSubscription.id);

    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase
      .from("subscriptions")
      .insert(subscriptionPayload);

    if (error) {
      throw error;
    }
  }

  const { error: userError } = await supabase
    .from("users")
    .update({
      subscription_plan: plan,
      subscription_status: "active",
      updated_at: startsAt,
    })
    .eq("id", userId);

  if (userError) {
    throw userError;
  }

  return normalizeSubscription(subscriptionPayload);
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

export async function syncStripeCheckoutStatus({ profile, userId }) {
  const status = new URLSearchParams(window.location.search).get("status");

  if (!status || !userId) {
    return { data: null, error: null, message: "", handled: false };
  }

  const pendingCheckout = readPendingStripeCheckout();
  removeStatusFromUrl();

  if (status === "checkout_cancelled") {
    clearPendingStripeCheckout();
    return {
      data: null,
      error: null,
      message: "Stripe checkout was cancelled.",
      handled: true,
    };
  }

  if (status !== "checkout_success") {
    return { data: null, error: null, message: "", handled: false };
  }

  if (!pendingCheckout?.plan || pendingCheckout.userId !== userId) {
    return {
      data: normalizeSubscription(null, profile),
      error:
        "Stripe returned successfully, but no matching pending subscription was found to save.",
      message: "",
      handled: true,
    };
  }

  try {
    const data = await persistSupabaseStripeSubscription({
      email: pendingCheckout.email,
      plan: pendingCheckout.plan,
      userId,
    });

    clearPendingStripeCheckout();

    return {
      data,
      error: null,
      message: "Stripe payment saved to Supabase successfully.",
      handled: true,
    };
  } catch (error) {
    return {
      data: normalizeSubscription(null, profile),
      error: `Stripe payment succeeded, but saving it in Supabase failed: ${formatError(error)}`,
      message: "",
      handled: true,
    };
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
      persistPendingStripeCheckout({
        email,
        plan: normalizedPlan,
        startedAt: new Date().toISOString(),
        userId,
      });
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
      persistPendingStripeCheckout({
        email,
        plan: normalizedPlan,
        startedAt: new Date().toISOString(),
        userId,
      });
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
      persistPendingStripeCheckout({
        email,
        plan: normalizedPlan,
        startedAt: new Date().toISOString(),
        userId,
      });
      const redirectResult = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (redirectResult?.error) {
        clearPendingStripeCheckout();
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
