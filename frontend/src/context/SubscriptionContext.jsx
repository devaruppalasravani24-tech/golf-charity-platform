import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./authContext";
import {
  getUserSubscriptionSummary,
  startCheckoutSession,
} from "../services/subscriptionService";

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { profile, refreshProfile, user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSubscription() {
      if (!user?.id) {
        if (isMounted) {
          setSubscription(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const result = await getUserSubscriptionSummary(user.id, profile);
      if (!isMounted) return;

      if (result.error) {
        setError(result.error);
      } else {
        setSubscription(result.data);
        setError("");
      }

      setLoading(false);
    }

    loadSubscription();
    return () => {
      isMounted = false;
    };
  }, [profile, user?.id]);

  async function startCheckout(plan, originPath = "/dashboard") {
    if (!user?.id) {
      const result = { error: "You must be signed in before starting checkout." };
      setError(result.error);
      return result;
    }

    setCheckoutLoading(true);
    setError("");

    const result = await startCheckoutSession({
      cancelPath: originPath,
      email: user.email,
      plan,
      successPath: "/dashboard",
      userId: user.id,
    });

    setCheckoutLoading(false);

    if (result.error) {
      setError(result.error);
      return result;
    }

    await refreshProfile();
    return result;
  }

  const value = useMemo(
    () => ({
      checkoutLoading,
      error,
      loading,
      startCheckout,
      subscription,
    }),
    [checkoutLoading, error, loading, subscription]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider."
    );
  }
  return context;
}
