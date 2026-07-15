const CARD_CONFIG = [
  {
    title: 'Active Projects',
    subtitle: 'Currently in active status',
    icon: FolderIcon,
    iconClassName: 'bg-[#eef2ff] text-[#4e63d8]',
    valueKey: 'activeProjects',
  },
  {
    title: 'Archived Projects',
    subtitle: 'Archived across all teams',
    icon: ClockIcon,
    iconClassName: 'bg-[#f3efff] text-[#7a60d8]',
    valueKey: 'archivedProjects',
  },
  {
    title: 'Avg. Completion',
    subtitle: 'Average across all projects',
    icon: CheckIcon,
    iconClassName: 'bg-[#eef8ef] text-[#2f9253]',
    valueKey: 'averageCompletion',
  },
]

function formatCardValue(value, valueKey) {
  if (valueKey === 'averageCompletion') {
    return `${value}%`
  }

  return String(value).padStart(2, '0')
}

function ProjectsOverviewCards({ summary, isLoading }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {CARD_CONFIG.map(({ title, subtitle, icon: Icon, iconClassName, valueKey }) => (
        <article
          key={title}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm shadow-slate-200/30"
        >
          <div className="flex items-start gap-4">
            <div className={`flex h-11 w-11 items-center justify-center rounded-full ${iconClassName}`}>
              <Icon />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {title}
              </p>
              {isLoading ? (
                <>
                  <div className="mt-4 h-9 w-16 rounded-lg bg-slate-100" />
                  <div className="mt-3 h-3 w-32 rounded-full bg-slate-100" />
                </>
              ) : (
                <>
                  <p className="mt-4 text-4xl font-black tracking-tight text-slate-900">
                    {formatCardValue(summary[valueKey] ?? 0, valueKey)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
                </>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M2.75 6.5A1.75 1.75 0 0 1 4.5 4.75h3l1.3 1.5H15.5A1.75 1.75 0 0 1 17.25 8v7.5a1.75 1.75 0 0 1-1.75 1.75h-11A1.75 1.75 0 0 1 2.75 15.5Z" strokeLinejoin="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <circle cx="10" cy="10" r="6.25" />
      <path d="M10 6.75v3.5l2.25 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="m5.75 10 2.5 2.5 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default ProjectsOverviewCards
