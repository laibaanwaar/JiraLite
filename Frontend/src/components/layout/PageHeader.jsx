export default function PageHeader({
  actions = null,
  eyebrow = '',
  subtitle = '',
  title,
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#4b36f4]">{eyebrow}</p>
        ) : null}
        <h1 className="m-0 text-3xl font-black tracking-tight text-slate-900 lg:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm font-semibold text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  )
}
