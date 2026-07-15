function SummaryCard({ title, value, icon: Icon, iconClassName, isLoading }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm shadow-slate-200/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>
          {isLoading ? (
            <div className="mt-5 h-9 w-20 rounded-lg bg-slate-100" />
          ) : (
            <p className="mt-5 text-4xl font-black tracking-tight text-[#2142a5]">{value}</p>
          )}
        </div>

        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconClassName}`}>
          <Icon />
        </div>
      </div>
    </article>
  )
}

export default SummaryCard
