import CartButton from "./CartButton";
import Card from "./Card";

export default function CharityCard({
  charity,
  isSelected,
  onSelect,
  percentage,
}) {
  return (
    <Card
      className={`transition-transform duration-300 hover:-translate-y-1 ${
        isSelected ? "border-accent/40 bg-accent/5" : ""
      }`}
      eyebrow={charity.category || "Featured charity"}
      title={charity.name}
      actions={
        charity.is_featured ? (
          <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
            Featured
          </span>
        ) : null
      }
    >
      <p className="text-sm leading-6 text-slate-300">
        {charity.description || "Support this charity with part of your subscription."}
      </p>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>{percentage}% contribution</span>
        <span>{charity.slug || "active"}</span>
      </div>
      <div className="mt-6">
        <CartButton className="w-full" onClick={() => onSelect(charity)}>
          {isSelected ? "Selected charity" : "Select charity"}
        </CartButton>
      </div>
    </Card>
  );
}
