function formatDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function getRoleLabel(role) {
  if (!role) {
    return 'Member'
  }

  return String(role).toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase())
}

export default function ProjectCard({ project }) {
  const updatedDate = formatDate(project.updated_at)
  const hasMembers = project.total_members !== undefined && project.total_members !== null
  const hasTasks = project.total_tasks !== undefined && project.total_tasks !== null

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-slate-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="m-0 text-xl font-black text-slate-900">{project.name}</h2>
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-500">
            {project.description || 'No description provided.'}
          </p>
        </div>
        <span className="self-start rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#4030e8]">
          {getRoleLabel(project.current_user_role)}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
        {hasMembers ? <span>{project.total_members} members</span> : null}
        {hasTasks ? <span>{project.total_tasks} tasks</span> : null}
        {updatedDate ? <span>Updated {updatedDate}</span> : null}
      </div>

      <button
        type="button"
        className="mt-5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
      >
        View Project
      </button>
    </article>
  )
}
