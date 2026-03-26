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
      "border border-emerald-200/40 bg-gradient-to-r from-emerald-300 via-accent to-gold text-slate-950 shadow-[0_14px_34px_rgba(0,229,160,0.22)] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(0,229,160,0.3)]",
    secondary:
      "border border-white/10 bg-black/10 text-white hover:bg-white/5",
  };

  const classes = `inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold no-underline transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`;

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
