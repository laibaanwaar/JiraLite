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
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          readOnly={readOnly}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className="w-full border-0 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-0 placeholder:text-slate-400"
        />
      </span>
      {error ? <span className="text-xs font-semibold text-rose-600">{error}</span> : null}
    </label>
  )
}
