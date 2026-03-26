export default function Card({
  children,
  className = "",
  eyebrow,
  title,
  actions,
}) {
  return (
    <section
      className={`rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl ${className}`}
    >
      {(eyebrow || title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {eyebrow && (
              <p className="text-xs uppercase tracking-[0.28em] text-accent">
                {eyebrow}
              </p>
            )}
            {title && (
              <h3 className="mt-2 font-display text-2xl font-bold text-white">
                {title}
              </h3>
            )}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
