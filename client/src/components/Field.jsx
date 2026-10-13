export default function Field({ label, hint, error, icon: Icon, ...props }) {
  return (
    <div className="field">
      <label htmlFor={props.id}>
        {Icon && <Icon size={14} strokeWidth={1.75} aria-hidden="true" />} {label}
      </label>
      <input {...props} className={error ? 'error' : ''} aria-invalid={!!error} aria-describedby={error ? `${props.id}-err` : undefined} />
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="err" id={`${props.id}-err`}>{error}</span>}
    </div>
  )
}
