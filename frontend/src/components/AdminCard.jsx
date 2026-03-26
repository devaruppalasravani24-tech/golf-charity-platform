import Card from "./Card";

export default function AdminCard({ label, tone = "text-white", value }) {
  return (
    <Card className="bg-black/20">
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
        {label}
      </p>
      <p className={`mt-3 font-display text-4xl font-black ${tone}`}>{value}</p>
    </Card>
  );
}
