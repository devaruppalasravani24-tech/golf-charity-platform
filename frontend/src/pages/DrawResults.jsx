import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import DrawResultCard from "../components/DrawResultCard";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/authContext";
import { useScores } from "../hooks/useScores";
import {
  getLatestDrawResult,
  getPublishedDraws,
  getUserDrawHistory,
  getUserWinners,
} from "../services/drawService";
import { buildEntryNumbersFromScores } from "../utils/drawLogic";
import { formatCurrency, formatDate } from "../utils/dateUtils";

export default function DrawResults() {
  const { user } = useAuth();
  const { scores } = useScores();
  const [latestDraw, setLatestDraw] = useState(null);
  const [drawHistory, setDrawHistory] = useState([]);
  const [publishedDraws, setPublishedDraws] = useState([]);
  const [winners, setWinners] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadResults() {
      if (!user?.id) {
        return;
      }

      const [latestResult, historyResult, publishedResult, winnerResult] =
        await Promise.all([
          getLatestDrawResult(user.id),
          getUserDrawHistory(user.id),
          getPublishedDraws(),
          getUserWinners(user.id),
        ]);

      if (!isMounted) {
        return;
      }

      setLatestDraw(latestResult.data);
      setDrawHistory(historyResult.data);
      setPublishedDraws(publishedResult.data);
      setWinners(winnerResult.data);
      setError(
        latestResult.error ||
          historyResult.error ||
          publishedResult.error ||
          winnerResult.error ||
          ""
      );
    }

    loadResults();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const projectedNumbers = useMemo(
    () => buildEntryNumbersFromScores(scores),
    [scores]
  );

  const totalWinnings = useMemo(
    () =>
      winners.reduce(
        (total, winner) => total + Number(winner.prize_amount || 0),
        0
      ),
    [winners]
  );

  return (
    <div className="min-h-screen bg-bg px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl lg:flex lg:items-start lg:gap-6">
        <Sidebar />
        <div className="mt-6 flex-1 lg:mt-0">
          <Header
            description="Review published draws, your latest entry history, and any verified winnings."
            eyebrow="Draw results"
            title="Monthly results and winner tracking"
          />

          {error ? (
            <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {error}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            {latestDraw?.draw ? (
              <DrawResultCard
                draw={latestDraw.draw}
                entry={latestDraw.entry}
                winner={winners[0]}
              />
            ) : (
              <Card eyebrow="Latest draw" title="No published results yet">
                <p className="text-sm leading-6 text-slate-300">
                  Results will appear here after the first draw is published.
                </p>
              </Card>
            )}

            <Card eyebrow="Projected entry" title="Algorithmic score-based preview">
              <p className="text-sm leading-6 text-slate-300">
                Based on your latest saved scores, these numbers show the
                current algorithmic projection for an entry profile.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {projectedNumbers.map((number) => (
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/20 bg-accent/10 font-semibold text-accent"
                    key={number}
                  >
                    {number}
                  </span>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-gold">
                Total verified winnings: {formatCurrency(totalWinnings)}
              </div>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card eyebrow="Your draw history" title="Recent entries">
              <div className="space-y-3">
                {drawHistory.map((entry) => (
                  <div
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                    key={entry.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">
                          {entry.draws?.month || "Monthly draw"}
                        </p>
                        <p className="text-sm text-slate-400">
                          {formatDate(entry.draws?.draw_date || entry.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(entry.numbers || []).map((number) => (
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-sm text-white"
                            key={number}
                          >
                            {number}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {!drawHistory.length ? (
                  <p className="text-sm text-slate-400">
                    No personal draw entries were found yet.
                  </p>
                ) : null}
              </div>
            </Card>

            <Card eyebrow="Published draws" title="Recent monthly releases">
              <div className="space-y-3">
                {publishedDraws.map((draw) => (
                  <div
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                    key={draw.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">
                          {draw.month || "Monthly draw"}
                        </p>
                        <p className="text-sm text-slate-400">
                          {formatDate(draw.draw_date || draw.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(draw.draw_numbers || []).map((number) => (
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/20 bg-gold/10 text-sm font-semibold text-gold"
                            key={number}
                          >
                            {number}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
