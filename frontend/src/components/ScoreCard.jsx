import { formatDate } from "../utils/dateUtils";
import CartButton from "./CartButton";
import Card from "./Card";

export default function ScoreCard({
  score,
  onDelete,
  onEdit,
}) {
  return (
    <Card className="border-white/10 bg-black/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-display text-3xl font-black text-white">
            {score.score} pts
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Played {formatDate(score.played_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <CartButton onClick={() => onEdit(score)} variant="secondary">
            Edit
          </CartButton>
          <CartButton onClick={() => onDelete(score.id)} variant="danger">
            Delete
          </CartButton>
        </div>
      </div>
    </Card>
  );
}
