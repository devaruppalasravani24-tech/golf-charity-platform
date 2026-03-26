import { formatCurrency, formatDate, getMonthLabel } from "../utils/dateUtils";
import Card from "./Card";

export default function DrawResultCard({ draw, entry, winner }) {
  const drawnNumbers = draw.draw_numbers || [];
  const entryNumbers = entry?.numbers || [];

  return (
    <Card
      eyebrow={draw.status || "published"}
      title={draw.month || getMonthLabel(draw.draw_date || draw.created_at)}
    >
      <p className="text-sm text-slate-300">
        Published {formatDate(draw.draw_date || draw.created_at)}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {drawnNumbers.map((number) => (
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/20 font-semibold text-white"
            key={number}
          >
            {number}
          </span>
        ))}
      </div>

      {entryNumbers.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Your numbers
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {entryNumbers.map((number) => (
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-sm font-semibold text-accent"
                key={number}
              >
                {number}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {winner ? (
        <div className="mt-6 rounded-2xl border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-gold">
          Winner payout: {formatCurrency(winner.prize_amount || 0)}
        </div>
      ) : null}
    </Card>
  );
}
