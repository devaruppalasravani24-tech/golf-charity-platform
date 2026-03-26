import { assertSupabaseConfigured } from "./supabaseClient";

const PAYMENT_LINKS = {
  monthly: import.meta.env.VITE_RAZORPAY_MONTHLY_PAYMENT_LINK,
  yearly: import.meta.env.VITE_RAZORPAY_YEARLY_PAYMENT_LINK,
};

function formatError(error) {
  return error?.message || "Razorpay checkout could not be started.";
}

function buildReturnUrl(pathname, status) {
  const url = new URL(pathname, window.location.origin);
  url.searchParams.set("status", status);
  return url.toString();
}

function buildHostedLink(link) {
  return String(link);
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
      return { data: null, error: formatError(error) };
    }

    return {
        data: {
          plan: data?.plan || data?.price_interval || profile?.subscription_plan || null,
          status: data?.status || profile?.subscription_status || "inactive",
          customerId:
            data?.razorpay_customer_id ||
            data?.customer_id ||
            profile?.razorpay_customer_id ||
            profile?.customer_id ||
            null,
        },
        error: null,
      };
  } catch {
    return {
      data: {
        plan: profile?.subscription_plan || null,
        status: profile?.subscription_status || "inactive",
        customerId: profile?.razorpay_customer_id || profile?.customer_id || null,
      },
      error: null,
    };
  }
}

export async function startCheckoutSession({
  cancelPath = "/dashboard",
  email,
  plan,
  successPath = "/dashboard",
  userId,
}) {
  try {
    const directLink = PAYMENT_LINKS[plan];

    if (directLink) {
      window.location.assign(buildHostedLink(directLink));
      return { data: { redirectUrl: directLink }, error: null };
    }

    const functionName = import.meta.env.VITE_SUPABASE_RAZORPAY_FUNCTION;

    if (!functionName) {
      return {
        data: null,
        error:
          "No Razorpay checkout route is configured. Add payment links or set VITE_SUPABASE_RAZORPAY_FUNCTION.",
      };
    }

    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        cancel_url: buildReturnUrl(cancelPath, "checkout_cancelled"),
        email,
        plan,
        success_url: buildReturnUrl(successPath, "checkout_success"),
        user_id: userId,
      },
    });

    if (error) {
      return { data: null, error: formatError(error) };
    }

    const redirectUrl = data?.url || data?.sessionUrl;

    if (!redirectUrl) {
      return {
        data: null,
        error: "The Razorpay function did not return a checkout URL.",
      };
    }

    window.location.assign(redirectUrl);
    return { data: { redirectUrl }, error: null };
  } catch (error) {
    return { data: null, error: formatError(error) };
  }
}
