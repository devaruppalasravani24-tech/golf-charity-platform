import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import CartButton from "../components/CartButton";
import DrawResultCard from "../components/DrawResultCard";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/authContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useScores } from "../hooks/useScores";
import { getUserCharitySelection } from "../services/charityService";
import { getLatestDrawResult, getUserWinners } from "../services/drawService";

export default function Dashboard() {
  const { profile, user } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { error: scoresError, scores, loading: scoresLoading } = useScores();
  const [charitySelection, setCharitySelection] = useState(null);
  const [latestDraw, setLatestDraw] = useState(null);
  const [winnerCount, setWinnerCount] = useState(0);
  const [overviewError, setOverviewError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      if (!user?.id) {
        return;
      }

      const [selectionResult, drawResult, winnerResult] = await Promise.all([
        getUserCharitySelection(user.id),
        getLatestDrawResult(user.id),
        getUserWinners(user.id),
      ]);

      if (!isMounted) {
        return;
      }

      setCharitySelection(selectionResult.data);
      setLatestDraw(drawResult.data);
      setWinnerCount(winnerResult.data.length);
      setOverviewError(
        selectionResult.error || drawResult.error || winnerResult.error || ""
      );
    }

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const averageScore = useMemo(() => {
    if (!scores.length) {
      return null;
    }

    return (
      scores.reduce((total, score) => total + Number(score.score || 0), 0) /
      scores.length
    ).toFixed(1);
  }, [scores]);

  return (
    <div className="min-h-screen bg-bg px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl lg:flex lg:items-start lg:gap-6">
        <Sidebar />
        <div className="mt-6 flex-1 lg:mt-0">
          <Header
            actions={[
              <CartButton key="scores" to="/scores">
                Manage scores
              </CartButton>,
              <CartButton key="charity" to="/charity" variant="secondary">
                Pick charity
              </CartButton>,
            ]}
            description="Your subscription, charity, score, and draw overview lives here."
            eyebrow="Member dashboard"
            title={`Welcome back, ${profile?.full_name?.split(" ")[0] || "Golfer"}`}
          />

          {overviewError || scoresError ? (
            <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {overviewError || scoresError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              label="Subscription"
              tone={
                subscription?.status === "active" ? "text-emerald-300" : "text-amber-300"
              }
              value={
                subscriptionLoading
                  ? "Checking"
                  : subscription?.status || "Not started"
              }
            />
            <MetricCard
              label="Plan"
              value={subscription?.plan || profile?.subscription_plan || "Pending"}
            />
            <MetricCard
              label="Average score"
              value={scoresLoading ? "Loading" : averageScore || "No rounds"}
            />
            <MetricCard label="Winner records" value={winnerCount} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card
              eyebrow="Charity"
              title={charitySelection?.charities?.name || "Choose your charity"}
            >
              <p className="text-sm leading-6 text-slate-300">
                {charitySelection?.charities?.description ||
                  "Direct part of each subscription toward a cause that matters to you."}
              </p>
              <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
                Current contribution: {profile?.charity_percentage || 10}%
              </div>
              <div className="mt-6">
                <CartButton to="/charity">Update charity selection</CartButton>
              </div>
            </Card>

            <Card eyebrow="Quick links" title="Keep your account draw-ready">
              <div className="grid gap-4 md:grid-cols-2">
                <QuickLink
                  body="Edit your latest five Stableford scores and keep your profile current."
                  title="Scores"
                  to="/scores"
                />
                <QuickLink
                  body="Activate or refresh your subscription through Stripe Checkout."
                  title="Subscription"
                  to="/subscription"
                />
                <QuickLink
                  body="Review published draw results, matched numbers, and payout history."
                  title="Draw results"
                  to="/draw-results"
                />
                {profile?.role === "admin" ? (
                  <QuickLink
                    body="Manage users, draws, charities, and winner verification."
                    title="Admin dashboard"
                    to="/admin"
                  />
                ) : null}
              </div>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            {latestDraw?.draw ? (
              <DrawResultCard draw={latestDraw.draw} entry={latestDraw.entry} />
            ) : (
              <Card eyebrow="Draw results" title="No published draw yet">
                <p className="text-sm leading-6 text-slate-300">
                  Once the first monthly draw is published, your latest results
                  and matched numbers will show here.
                </p>
              </Card>
            )}

            <Card eyebrow="At a glance" title="Account summary">
              <div className="space-y-4 text-sm text-slate-300">
                <SummaryRow
                  label="Subscription status"
                  value={subscription?.status || profile?.subscription_status || "inactive"}
                />
                <SummaryRow
                  label="Charity contribution"
                  value={`${profile?.charity_percentage || 10}%`}
                />
                <SummaryRow
                  label="Latest five-round average"
                  value={averageScore ? `${averageScore} pts` : "No rounds yet"}
                />
                <SummaryRow label="Recorded winnings" value={winnerCount} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, tone = "text-white", value }) {
  return (
    <Card className="bg-black/20">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
        {label}
      </p>
      <p className={`mt-3 font-display text-3xl font-black ${tone}`}>{value}</p>
    </Card>
  );
}

function QuickLink({ body, title, to }) {
  return (
    <Link
      className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 transition-transform duration-300 hover:-translate-y-1"
      to={to}
    >
      <h3 className="font-display text-2xl font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
    </Link>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
