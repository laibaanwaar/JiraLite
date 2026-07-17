export default function FormInput({
  id,
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  icon,
  error = '',
  required = false,
  readOnly = false,
  disabled = false,
}) {
  return (
    <label className="flex flex-col gap-2.5" htmlFor={id}>
      <span className="text-[0.96rem] font-semibold text-slate-800">{label}</span>
      <span
        className={`flex min-h-[58px] items-center rounded-xl border bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition duration-150 ${
          error
            ? 'border-rose-300 focus-within:border-rose-400 focus-within:shadow-[0_0_0_4px_rgba(244,63,94,0.12)]'
            : 'border-slate-300 hover:border-slate-300/80 focus-within:-translate-y-px focus-within:border-blue-500 focus-within:shadow-[0_0_0_4px_rgba(79,115,255,0.14)]'
        } ${disabled ? 'bg-slate-50' : ''}`}
      >
        <span className="ml-3.5 inline-flex text-slate-400" aria-hidden="true">
          {icon}
        </span>
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          readOnly={readOnly}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className="w-full border-0 bg-transparent px-3 py-[17px] text-slate-900 outline-0 placeholder:text-slate-400"
        />
      </span>
      {error ? <span className="text-sm font-semibold text-rose-600">{error}</span> : null}
    </label>
  )
}
