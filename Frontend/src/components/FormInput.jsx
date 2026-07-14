function FormInput({
  id,
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled = false,
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-100 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </div>
  )
}

export default FormInput
