import { formatCurrency, formatDate } from "../utils/dateUtils";
import InputField from "./InputField";
import Card from "./Card";

export default function WinnerCard({
  onChange,
  winner,
}) {
  return (
    <Card
      eyebrow={winner.match_type || "Winner"}
      title={winner.users?.full_name || winner.user_name || "Winner"}
    >
      <p className="text-sm text-slate-300">
        {winner.users?.email || "Winner email not available"}
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Prize
          </p>
          <p className="mt-2 font-display text-3xl font-black text-gold">
            {formatCurrency(winner.prize_amount || 0)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Draw
          </p>
          <p className="mt-2 text-sm text-slate-300">
            {winner.draws?.month || formatDate(winner.draws?.draw_date)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <InputField
          as="select"
          label="Verification"
          onChange={(event) =>
            onChange(winner.id, { verification_status: event.target.value })
          }
          options={[
            { label: "Pending", value: "pending" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
          ]}
          value={winner.verification_status || "pending"}
        />
        <InputField
          as="select"
          label="Payout"
          onChange={(event) =>
            onChange(winner.id, { payment_status: event.target.value })
          }
          options={[
            { label: "Pending", value: "pending" },
            { label: "Paid", value: "paid" },
          ]}
          value={winner.payment_status || "pending"}
        />
      </div>
    </Card>
  );
}
