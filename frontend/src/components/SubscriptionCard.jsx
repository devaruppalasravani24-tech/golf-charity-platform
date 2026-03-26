import { formatCurrency } from "../utils/dateUtils";
import CartButton from "./CartButton";
import Card from "./Card";

export default function SubscriptionCard({
  amount,
  current = false,
  description,
  disabled,
  features = [],
  highlighted = false,
  onSelect,
  plan,
}) {
  return (
    <Card
      className={`relative ${highlighted ? "border-accent/30 bg-accent/5" : ""}`}
      eyebrow={highlighted ? "Recommended" : "Plan"}
      title={plan}
    >
      <p className="font-display text-4xl font-black text-white">
        {formatCurrency(amount)}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
      <ul className="mt-5 space-y-2 text-sm text-slate-300">
        {features.map((feature) => (
          <li key={feature}>• {feature}</li>
        ))}
      </ul>
      <div className="mt-6">
        <CartButton
          className="w-full"
          disabled={disabled || current}
          onClick={onSelect}
          variant={current ? "secondary" : "primary"}
        >
          {current ? "Current plan" : "Choose plan"}
        </CartButton>
      </div>
    </Card>
  );
}
