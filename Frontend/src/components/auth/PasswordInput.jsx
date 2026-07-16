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
}) {
  return (
    <label className="flex flex-col gap-2.5" htmlFor={id}>
      <span className="text-[0.96rem] font-semibold text-slate-800">{label}</span>
      <span className="flex min-h-[58px] items-center rounded-xl border border-slate-300 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition duration-150 hover:border-slate-300/80 focus-within:-translate-y-px focus-within:border-blue-500 focus-within:shadow-[0_0_0_4px_rgba(79,115,255,0.14)]">
        <span className="ml-3.5 inline-flex text-slate-400" aria-hidden="true">
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
          className="w-full border-0 bg-transparent px-3 py-[17px] pr-2 text-slate-900 outline-0 placeholder:text-slate-400"
        />
        <button
          type="button"
          className="mr-2 inline-flex items-center justify-center rounded-[10px] bg-transparent p-2 text-slate-400 transition duration-150 hover:bg-blue-500/8 hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 active:bg-blue-500/14"
          onClick={onToggleVisibility}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
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
    </label>
  )
}
