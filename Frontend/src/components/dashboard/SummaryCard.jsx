export default function SummaryCard({
  label,
  value,
  subtitle,
}) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div>
        <p className="text-[15px] font-bold text-slate-600">{label}</p>
        <p className="mt-4 text-[52px] leading-none font-black tracking-tight text-slate-900">{value}</p>
        <p className="mt-3 text-base font-medium text-slate-500">{subtitle}</p>
      </div>
    </article>
  )
}
