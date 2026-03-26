export default function InputField({
  as = "input",
  className = "",
  error,
  helperText,
  label,
  options = [],
  ...props
}) {
  const baseClassName =
    "w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-accent";
  const stateClassName = error ? "border-rose-400/40" : "";

  return (
    <label className="block">
      {label ? (
        <span className="mb-2 block text-sm font-medium text-slate-200">
          {label}
        </span>
      ) : null}

      {as === "textarea" ? (
        <textarea className={`${baseClassName} ${stateClassName} ${className}`} {...props} />
      ) : as === "select" ? (
        <select className={`${baseClassName} ${stateClassName} ${className}`} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input className={`${baseClassName} ${stateClassName} ${className}`} {...props} />
      )}

      {error ? (
        <span className="mt-2 block text-xs text-rose-300">{error}</span>
      ) : helperText ? (
        <span className="mt-2 block text-xs text-slate-400">{helperText}</span>
      ) : null}
    </label>
  );
}
