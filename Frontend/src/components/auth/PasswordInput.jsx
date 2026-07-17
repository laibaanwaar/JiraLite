export default function PasswordInput({
  id,
  label,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  isVisible,
  onToggleVisibility,
  icon,
  error = '',
  required = false,
  disabled = false,
  readOnly = false,
}) {
  return (
    <label className="flex flex-col gap-1.5" htmlFor={id}>
      <span className="text-[0.82rem] font-semibold text-slate-800">{label}</span>
      <span
        className={`flex min-h-10 items-center rounded-lg border bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition duration-150 ${
          error
            ? 'border-rose-300 focus-within:border-rose-400 focus-within:shadow-[0_0_0_4px_rgba(244,63,94,0.12)]'
            : 'border-slate-300 hover:border-slate-300/80 focus-within:border-blue-600 focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]'
        } ${disabled ? 'bg-slate-50' : ''}`}
      >
        <span className="ml-3 inline-flex text-slate-400 [&_svg]:h-4 [&_svg]:w-4" aria-hidden="true">
          {icon}
        </span>
        <input
          id={id}
          name={name}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          readOnly={readOnly}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className="w-full border-0 bg-transparent px-3 py-2.5 pr-2 text-sm text-slate-900 outline-0 placeholder:text-slate-400"
        />
        <button
          type="button"
          className="mr-2 inline-flex items-center justify-center rounded-lg bg-transparent p-1.5 text-slate-400 transition duration-150 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 active:bg-blue-100"
          onClick={onToggleVisibility}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          disabled={disabled}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              d="M1.5 12s3.75-6 10.5-6 10.5 6 10.5 6-3.75 6-10.5 6S1.5 12 1.5 12Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="12"
              r="3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>
        </button>
      </span>
      {error ? <span className="text-xs font-semibold text-rose-600">{error}</span> : null}
    </label>
  )
}
