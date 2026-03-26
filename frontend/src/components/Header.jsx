export default function Header({ actions, eyebrow, title, description }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-sm uppercase tracking-[0.28em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-display text-4xl font-black text-white">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
