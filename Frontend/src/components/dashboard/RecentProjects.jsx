function ProjectGlyph({ index }) {
  const styles = [
    'bg-blue-100 text-[#3563ff]',
    'bg-emerald-100 text-[#26b36a]',
    'bg-amber-100 text-[#f59e0b]',
    'bg-violet-100 text-[#7c5cff]',
  ]
  const className = styles[index % styles.length]

  return (
    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${className}`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M8 6.75V6a2.25 2.25 0 0 1 4.5 0v.75M7 8.25h10a1.25 1.25 0 0 1 1.25 1.25v7.75A2.75 2.75 0 0 1 15.5 20h-7A2.75 2.75 0 0 1 5.75 17.25V9.5A1.25 1.25 0 0 1 7 8.25Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    </span>
  )
}

function formatRelativeUpdate(value) {
  if (!value) {
    return 'Updated recently'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Updated recently'
  }

  const diffMs = Date.now() - date.getTime()

  if (diffMs < 0) {
    return 'Updated recently'
  }

  const hour = 60 * 60 * 1000
  const day = 24 * hour

  if (diffMs < day) {
    const hours = Math.max(1, Math.round(diffMs / hour))
    return `Updated ${hours}h ago`
  }

  const days = Math.max(1, Math.round(diffMs / day))
  return `Updated ${days}d ago`
}

export default function RecentProjects({ projects, onProjectClick, showProjectsLink = false, onViewAllProjects }) {
  const canViewAllProjects = typeof onViewAllProjects === 'function'

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[18px] font-extrabold text-slate-900">Recent Projects</h2>
        {showProjectsLink && canViewAllProjects ? (
          <button
            type="button"
            onClick={onViewAllProjects}
            className="text-sm font-extrabold text-[#4b36f4] transition hover:text-[#3726c9]"
          >
            View all projects
          </button>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm font-semibold text-slate-500">
          No recent projects available.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {projects.slice(0, 4).map((project, index) => {
            const isClickable = typeof onProjectClick === 'function'

            return (
              <article
                key={project.id || project.name}
                className={`flex items-center justify-between gap-4 rounded-[22px] transition ${
                  isClickable ? 'cursor-pointer hover:bg-slate-50' : ''
                }`}
                onClick={isClickable ? () => onProjectClick(project) : undefined}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <ProjectGlyph index={index} />
                  <div className="min-w-0">
                    <h3 className="truncate text-[17px] font-extrabold text-slate-900">{project.name || 'Untitled Project'}</h3>
                    <p className="mt-1 truncate text-sm font-medium text-slate-400">
                      {project.description || 'Project activity available in your workspace.'}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold text-slate-400">{formatRelativeUpdate(project?.updated_at)}</p>
              </article>
            )
          })}
        </div>
      )}

      {!showProjectsLink && canViewAllProjects ? (
        <button
          type="button"
          onClick={onViewAllProjects}
          className="mt-8 text-base font-extrabold text-[#4b36f4] transition hover:text-[#3726c9]"
        >
          View all projects
        </button>
      ) : null}
    </section>
  )
}
