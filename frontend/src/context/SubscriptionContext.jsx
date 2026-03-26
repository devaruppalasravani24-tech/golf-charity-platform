import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./authContext";
import {
  getUserSubscriptionSummary,
  startCheckoutSession,
} from "../services/subscriptionService";

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { profile, user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
        setMessage("");
      }

      setLoading(false);
    }

    loadSubscription();
    return () => {
      isMounted = false;
    };
  }, [profile, user?.id]);

  async function startCheckout(plan) {
    if (!user?.id) {
      const result = { error: "You must be signed in before starting checkout." };
      setError(result.error);
      return result;
    }

    setCheckoutLoading(true);
    setError("");
    setMessage("");

    const result = await startCheckoutSession({
      email: user.email,
      plan,
      userId: user.id,
    });

    setCheckoutLoading(false);

    if (result.error) {
      setError(result.error);
      return result;
    }

    setSubscription(result.data?.subscription ?? null);
    setMessage(result.data?.message || "Mock payment completed.");
    setError("");
    return result;
  }

  const value = useMemo(
    () => ({
      checkoutLoading,
      error,
      loading,
      message,
      startCheckout,
      subscription,
    }),
    [checkoutLoading, error, loading, message, subscription]
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
