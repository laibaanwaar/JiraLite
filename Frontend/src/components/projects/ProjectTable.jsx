function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M4 7.5h6l1.7 2H20v8.75H4V7.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function MembersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M16 19a4.5 4.5 0 0 0-8 0M12 12.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM20 18a3.4 3.4 0 0 0-3.25-2.5M17.5 11.5a2.25 2.25 0 1 0 0-4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function TasksIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M8 7.5h8M8 12h8M8 16.5h5M5.5 7.5l.01.01M5.5 12l.01.01M5.5 16.5l.01.01M17.5 5.5h1a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17V7a1.5 1.5 0 0 1 1.5-1.5h1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M6.5 12h.01M12 12h.01M17.5 12h.01"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  )
}

function ChevronIcon({ direction = 'right' }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d={direction === 'right' ? 'm9 5 7 7-7 7' : 'm15 5-7 7 7 7'}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function formatDateTime(value) {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Not available'
  }

  const parts = new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date)
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${lookup.day} ${lookup.month} ${lookup.year}\n${lookup.hour}:${lookup.minute} ${lookup.dayPeriod || ''}`.trim()
}

function getRoleLabel(role) {
  if (!role) {
    return 'Member'
  }

  return String(role).toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase())
}

function getRoleClassName(role) {
  const normalizedRole = String(role || '').toUpperCase()

  if (normalizedRole === 'OWNER') {
    return 'bg-[#efe8ff] text-[#5b35f5]'
  }

  if (normalizedRole === 'ADMIN') {
    return 'bg-[#e3f8ef] text-[#16a36a]'
  }

  return 'bg-[#eaf0ff] text-[#315dff]'
}

function getIconClassName(index) {
  const styles = [
    'bg-[#f0efff] text-[#4b36f4]',
    'bg-[#dcfaee] text-[#21bf83]',
    'bg-[#fff3df] text-[#f59e0b]',
    'bg-[#f0efff] text-[#7c5cff]',
    'bg-[#ffeaf0] text-[#ef5d85]',
  ]

  return styles[index % styles.length]
}

function getCount(value) {
  if (value === undefined || value === null || value === '') {
    return 'N/A'
  }

  return value
}

export default function ProjectTable({
  currentPage,
  onPageChange,
  pageSize,
  projects,
  totalCount,
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-white text-xs font-black uppercase text-slate-500">
              <th className="w-14 px-5 py-5">#</th>
              <th className="px-5 py-5">Project Name</th>
              <th className="px-5 py-5">Description</th>
              <th className="px-5 py-5">Role</th>
              <th className="px-5 py-5">Members</th>
              <th className="px-5 py-5">Tasks</th>
              <th className="px-5 py-5">Created At</th>
              <th className="px-5 py-5">Updated At</th>
              <th className="px-5 py-5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, index) => (
              <tr key={project.id} className="border-b border-slate-200 last:border-b-0">
                <td className="px-5 py-4 text-sm font-bold text-slate-700">
                  {(currentPage - 1) * pageSize + index + 1}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${getIconClassName(index)}`}>
                      <FolderIcon />
                    </div>
                    <span className="text-sm font-black text-slate-900">{project.name}</span>
                  </div>
                </td>
                <td className="max-w-[210px] px-5 py-4 text-sm font-semibold leading-6 text-slate-500">
                  {project.description || 'No description provided.'}
                </td>
                <td className="px-5 py-4">
                  <span className={`rounded-lg px-3 py-1.5 text-xs font-extrabold ${getRoleClassName(project.current_user_role)}`}>
                    {getRoleLabel(project.current_user_role)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                    <MembersIcon />
                    {getCount(project.total_members)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                    <TasksIcon />
                    {getCount(project.total_tasks)}
                  </span>
                </td>
                <td className="whitespace-pre-line px-5 py-4 text-sm font-semibold leading-6 text-slate-600">
                  {formatDateTime(project.created_at)}
                </td>
                <td className="whitespace-pre-line px-5 py-4 text-sm font-semibold leading-6 text-slate-600">
                  {formatDateTime(project.updated_at)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-900 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-900 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
                      aria-label={`Open actions for ${project.name}`}
                    >
                      <DotsIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-sm font-semibold text-slate-500">
          Showing {startItem} to {endItem} of {totalCount} projects
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:enabled:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4] disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="Previous projects page"
          >
            <ChevronIcon direction="left" />
          </button>

          {Array.from({ length: totalPages }).map((_, index) => {
            const page = index + 1

            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`h-9 min-w-9 rounded-lg border px-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4] ${
                  page === currentPage
                    ? 'border-[#4b36f4] bg-[#f3f1ff] text-[#4b36f4]'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:enabled:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4] disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="Next projects page"
          >
            <ChevronIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
