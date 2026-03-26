import { assertSupabaseConfigured } from "./supabaseClient";

const MOCK_SUBSCRIPTION_STORAGE_KEY =
  "golf-charity-platform.mock-subscriptions";
const MOCK_PAYMENT_DELAY_MS = Number(
  import.meta.env.VITE_MOCK_PAYMENT_DELAY_MS || 1100
);
const PLAN_PRICING = {
  monthly: 19.99,
  yearly: 199.99,
};

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
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
    provider: record?.provider || "mock",
    source: record?.source || "supabase",
    startsAt: record?.starts_at || null,
    status: record?.status || profile?.subscription_status || "inactive",
  };
}

function readMockSubscriptions() {
  try {
    const payload = window.localStorage.getItem(MOCK_SUBSCRIPTION_STORAGE_KEY);
    return payload ? JSON.parse(payload) : {};
  } catch {
    return {};
  }
}

function getLocalMockSubscription(userId) {
  if (!userId) {
    return null;
  }

  const subscriptions = readMockSubscriptions();
  return subscriptions[userId] || null;
}

function persistLocalMockSubscription(userId, subscription) {
  if (!userId) {
    return;
  }

  const subscriptions = readMockSubscriptions();
  subscriptions[userId] = subscription;
  window.localStorage.setItem(
    MOCK_SUBSCRIPTION_STORAGE_KEY,
    JSON.stringify(subscriptions)
  );
}

async function persistSupabaseMockSubscription(userId, subscription) {
  const supabase = assertSupabaseConfigured();
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let writeError = null;

  if (existingSubscription?.id) {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        ...subscription,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSubscription.id);

    writeError = error;
  } else {
    const { error } = await supabase.from("subscriptions").insert(subscription);
    writeError = error;
  }

  if (writeError) {
    throw writeError;
  }

  const { error: userError } = await supabase
    .from("users")
    .update({
      subscription_plan: subscription.plan,
      subscription_status: subscription.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (userError) {
    throw userError;
  }
}

export async function getUserSubscriptionSummary(userId, profile) {
  const localSubscription = getLocalMockSubscription(userId);

  try {
    const supabase = assertSupabaseConfigured();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return { data: normalizeSubscription(data, profile), error: null };
    }

    if (localSubscription) {
      return {
        data: normalizeSubscription(localSubscription, profile),
        error: null,
      };
    }

    return {
      data: normalizeSubscription(
        {
          provider: "mock",
          source: "profile",
        },
        profile
      ),
      error: null,
    };
  } catch {
    if (localSubscription) {
      return {
        data: normalizeSubscription(localSubscription, profile),
        error: null,
      };
    }

    return {
      data: normalizeSubscription(
        {
          provider: "mock",
          source: "profile",
        },
        profile
      ),
      error: null,
    };
  }
}

export async function startCheckoutSession({
  email,
  plan,
  userId,
}) {
  const normalizedPlan = String(plan || "").toLowerCase();

  if (!userId) {
    return { data: null, error: "You must be signed in to activate a plan." };
  }

  if (!Object.hasOwn(PLAN_PRICING, normalizedPlan)) {
    return { data: null, error: "Please choose a valid subscription plan." };
  }

  const startsAt = new Date().toISOString();
  const mockSubscription = {
    amount: PLAN_PRICING[normalizedPlan],
    currency: "GBP",
    customer_id: email || null,
    ends_at: buildEndsAt(normalizedPlan, startsAt),
    paid_at: startsAt,
    plan: normalizedPlan,
    provider: "mock",
    starts_at: startsAt,
    status: "active",
    user_id: userId,
  };

  await wait(MOCK_PAYMENT_DELAY_MS);

  let mode = "local";

  try {
    await persistSupabaseMockSubscription(userId, mockSubscription);
    mode = "supabase";
  } catch {
    mode = "local";
  }

  const storedSubscription = {
    ...mockSubscription,
    source: mode,
  };

  persistLocalMockSubscription(userId, storedSubscription);

  return {
    data: {
      message:
        mode === "supabase"
          ? "Mock payment approved and synced to Supabase."
          : "Mock payment approved locally while backend sync is unavailable.",
      mode,
      subscription: normalizeSubscription(storedSubscription),
    },
    error: null,
  };
}
