import { useMemo } from "react";
import Card from "../components/Card";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import SubscriptionCard from "../components/SubscriptionCard";
import { useAuth } from "../context/authContext";
import { useSubscription } from "../context/SubscriptionContext";

export default function Subscription() {
  const { profile } = useAuth();
  const {
    checkoutLoading,
    error,
    loading,
    message,
    startCheckout,
    subscription,
  } =
    useSubscription();

  const plans = useMemo(
    () => [
      {
        amount: 19.99,
        description:
          "Monthly demo access to score tracking, draw readiness, and charity selection.",
        features: [
          "Score tracking for your latest five rounds",
          "Monthly draw participation flow",
          "Manage your charity split at any time",
        ],
        plan: "Monthly",
        value: "monthly",
      },
      {
        amount: 199.99,
        description:
          "Yearly demo access with the same core features and lower annual cost.",
        features: [
          "Everything in monthly",
          "Useful for long-term recurring supporters",
          "Simpler annual billing cadence",
        ],
        highlighted: true,
        plan: "Yearly",
        value: "yearly",
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-bg px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl lg:flex lg:items-start lg:gap-6">
        <Sidebar />
        <div className="mt-6 flex-1 lg:mt-0">
          <Header
            description="Activate a demo subscription instantly with a mock payment flow."
            eyebrow="Subscription"
            title="Choose the right billing cycle"
          />

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card eyebrow="Current status" title="Subscription summary">
              <div className="space-y-4 text-sm text-slate-300">
                <SummaryRow
                  label="Status"
                  value={loading ? "Checking..." : subscription?.status || "inactive"}
                />
                <SummaryRow
                  label="Plan"
                  value={subscription?.plan || profile?.subscription_plan || "Not selected"}
                />
                <SummaryRow
                  label="Charity contribution"
                  value={`${profile?.charity_percentage || 10}%`}
                />
              </div>
              {error ? (
                <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}
              {message ? (
                <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  {message}
                </div>
              ) : null}
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {plans.map((plan) => (
                <SubscriptionCard
                  amount={plan.amount}
                  current={(subscription?.plan || "").toLowerCase() === plan.value}
                  description={plan.description}
                  disabled={checkoutLoading}
                  features={plan.features}
                  highlighted={plan.highlighted}
                  key={plan.value}
                  onSelect={() => startCheckout(plan.value)}
                  plan={plan.plan}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
