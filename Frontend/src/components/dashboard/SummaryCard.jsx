export default function SummaryCard({
  label,
  value,
  subtitle,
}) {
  return (
    <article className="min-h-[132px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-bold text-slate-600">{label}</p>
        <p className="mt-3 text-4xl leading-none font-black tracking-tight text-slate-900">{value}</p>
        <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p>
      </div>
    </article>
  )
}
