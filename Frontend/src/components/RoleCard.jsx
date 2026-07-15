function formatCount(value) {
  return String(value).padStart(2, '0')
}

function RoleCard({ title, value, tone = 'blue', isLoading = false, icon }) {
  const tones = {
    blue: {
      iconWrap: 'bg-[#edf2ff] text-[#2346b7]',
      value: 'text-[#173792]',
    },
    violet: {
      iconWrap: 'bg-[#efe7ff] text-[#7d5de0]',
      value: 'text-[#5f3dc4]',
    },
    slate: {
      iconWrap: 'bg-[#eef1f7] text-[#5f6f86]',
      value: 'text-[#173792]',
    },
  }

  const palette = tones[tone] ?? tones.blue

  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm shadow-slate-200/30">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${palette.iconWrap}`}
          aria-hidden="true"
        >
          {icon}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          {isLoading ? (
            <div className="h-8 w-14 animate-pulse rounded-lg bg-slate-100" />
          ) : typeof value === 'number' ? (
            <p className={`text-[2rem] font-black leading-none tracking-tight ${palette.value}`}>
              {formatCount(value)}
            </p>
          ) : (
            <div className="h-8 w-16 rounded-lg border border-dashed border-slate-200 bg-slate-50" />
          )}
        </div>
      </div>
    </article>
  )
}

export default RoleCard
