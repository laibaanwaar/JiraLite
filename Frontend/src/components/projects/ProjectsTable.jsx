const TABLE_HEADERS = ['Project Name', 'Owner', 'Status', 'Members', 'Completion', 'Actions']

function formatStatusLabel(status) {
  if (typeof status !== 'string') {
    return 'Unknown'
  }

  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getStatusStyles(status) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-[#e7efff] text-[#3658c8]'
    case 'ARCHIVED':
      return 'bg-[#edf1f7] text-[#627187]'
    case 'ON_HOLD':
      return 'bg-[#fdebec] text-[#cf4b4f]'
    default:
      return 'bg-slate-100 text-slate-500'
  }
}

function getCompletionBarColor(percentage) {
  if (percentage >= 100) {
    return 'bg-slate-700'
  }

  if (percentage >= 50) {
    return 'bg-[#2142a5]'
  }

  return 'bg-[#c93d44]'
}

function EmptyProjectsState() {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-base font-semibold text-slate-700">No projects found yet.</p>
      <p className="mt-2 text-sm text-slate-500">
        Create a project to start populating this workspace.
      </p>
    </div>
  )
}

function ProjectsTable({ projects, totalCount, isLoading, errorMessage, onRetry }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#f5f7ff] text-left">
              {TABLE_HEADERS.map((heading) => (
                <th
                  key={heading}
                  className="border-b border-slate-200 px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <tr key={`project-row-placeholder-${index}`} className="animate-pulse">
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                      <td key={`project-cell-placeholder-${cellIndex}`} className="border-b border-slate-100 px-5 py-5">
                        <div className="h-4 rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}

            {!isLoading && errorMessage ? (
              <tr>
                <td colSpan="6" className="px-6 py-16 text-center">
                  <p className="text-base font-semibold text-red-600">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#1f46b8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a3c9f]"
                  >
                    Try Again
                  </button>
                </td>
              </tr>
            ) : null}

            {!isLoading && !errorMessage && projects.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <EmptyProjectsState />
                </td>
              </tr>
            ) : null}

            {!isLoading && !errorMessage
              ? projects.map((project) => (
                  <tr key={project.id} className="transition hover:bg-slate-50/80">
                    <td className="border-b border-slate-100 px-5 py-5 align-top">
                      <p className="font-semibold text-slate-900">{project.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {project.key || 'No project key'}
                      </p>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-5 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dce7ff] text-xs font-bold text-[#2142a5]">
                          {project.ownerInitials || 'NA'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{project.ownerName}</p>
                          {project.ownerRole ? (
                            <p className="text-xs text-slate-400">{project.ownerRole}</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-5 align-top">
                      <span
                        className={`inline-flex rounded px-2.5 py-1 text-xs font-semibold ${getStatusStyles(project.status)}`}
                      >
                        {formatStatusLabel(project.status)}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-5 align-top">
                      <div className="flex items-center gap-1.5">
                        {project.members.slice(0, 3).map((member) => {
                          const initials = [member.first_name, member.last_name]
                            .map((part) => part?.[0] || '')
                            .join('')
                            .toUpperCase()

                          return (
                            <div
                              key={`member-${project.id}-${member.id}`}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600"
                              title={`${member.first_name || ''} ${member.last_name || ''}`.trim()}
                            >
                              {initials || 'NA'}
                            </div>
                          )
                        })}
                        {project.membersCount > 3 ? (
                          <div className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#eef2ff] px-1.5 text-[10px] font-bold text-[#2142a5]">
                            +{project.membersCount - 3}
                          </div>
                        ) : null}
                        {project.membersCount === 0 ? (
                          <span className="text-sm text-slate-400">0</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-5 align-top">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${getCompletionBarColor(project.completionPercentage)}`}
                            style={{ width: `${Math.min(project.completionPercentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-600">
                          {Math.round(project.completionPercentage)}%
                        </span>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-5 align-top">
                      <button
                        type="button"
                        aria-label={`More actions for ${project.name}`}
                        className="text-slate-400 transition hover:text-slate-600"
                      >
                        <MoreIcon />
                      </button>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-200 bg-[#fbfcff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Showing {projects.length === 0 ? 0 : 1}-{projects.length} of {totalCount} projects
        </p>

        <div className="flex items-center gap-2">
          <PaginationPill className="w-16" />
          <PaginationPill active />
          <PaginationPill />
          <PaginationPill />
          <span className="px-1 text-slate-300">...</span>
          <PaginationPill />
          <PaginationPill className="w-12" />
        </div>
      </div>
    </div>
  )
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <circle cx="10" cy="4.75" r="1.25" />
      <circle cx="10" cy="10" r="1.25" />
      <circle cx="10" cy="15.25" r="1.25" />
    </svg>
  )
}

function PaginationPill({ active = false, className = 'w-8' }) {
  return (
    <div
      className={`h-8 rounded border ${className} ${
        active ? 'border-[#1f46b8] bg-[#1f46b8]' : 'border-slate-200 bg-white'
      }`}
    />
  )
}

export default ProjectsTable
