import { Link } from "react-router-dom";

export default function CartButton({
  children,
  className = "",
  disabled = false,
  onClick,
  to,
  type = "button",
  variant = "primary",
}) {
  const variants = {
    danger:
      "border border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20",
    ghost: "border border-white/10 text-white hover:bg-white/5",
    primary:
      "bg-gradient-to-r from-accent to-emerald-300 text-slate-950 hover:-translate-y-0.5",
    secondary:
      "border border-white/10 bg-black/10 text-white hover:bg-white/5",
  };

  const classes = `inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link className={classes} onClick={onClick} to={to}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  );
}
