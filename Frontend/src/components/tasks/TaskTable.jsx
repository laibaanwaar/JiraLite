function formatDisplayText(value, fallback = 'N/A') {
  if (typeof value !== 'string') {
    return fallback
  }

  const normalizedValue = value.replace(/_/g, ' ').trim()

  if (!normalizedValue) {
    return fallback
  }

  return normalizedValue.replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatDueDate(value) {
  if (!value) {
    return 'N/A'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

function getPriorityStyles(priority) {
  switch (priority?.toUpperCase()) {
    case 'HIGH':
      return 'bg-[#fde8e7] text-[#d14343]'
    case 'MEDIUM':
      return 'bg-[#ffe6c5] text-[#b96f1a]'
    case 'LOW':
      return 'bg-[#e6efff] text-[#5f7bb8]'
    default:
      return 'bg-slate-100 text-slate-500'
  }
}

function getStatusStyles(status) {
  switch (status?.toUpperCase()) {
    case 'IN_PROGRESS':
      return 'bg-[#7c6cff]'
    case 'REVIEW':
      return 'bg-[#ffb282]'
    case 'DONE':
      return 'bg-[#40b786]'
    default:
      return 'bg-slate-300'
  }
}

function EmptyState({ message }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-base font-semibold text-slate-700">{message}</p>
      <p className="mt-2 text-sm text-slate-500">
        Create a task to start populating this workspace.
      </p>
    </div>
  )
}

function TaskTable({ tasks, totalCount, isLoading, errorMessage, onRetry }) {
  const visibleCount = tasks.length

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#f5f7ff] text-left">
              {['Task ID', 'Title', 'Project', 'Assigned', 'Priority', 'Status', 'Due Date'].map(
                (heading) => (
                  <th
                    key={heading}
                    className="border-b border-slate-200 px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={`loading-row-${index}`} className="animate-pulse">
                  {Array.from({ length: 7 }).map((__, cellIndex) => (
                    <td key={`loading-cell-${cellIndex}`} className="border-b border-slate-100 px-5 py-5">
                      <div className="h-4 rounded bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : null}

            {!isLoading && errorMessage ? (
              <tr>
                <td colSpan="7" className="px-6 py-16 text-center">
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

            {!isLoading && !errorMessage && tasks.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <EmptyState message="No tasks found yet." />
                </td>
              </tr>
            ) : null}

            {!isLoading && !errorMessage
              ? tasks.map((task) => (
                  <tr key={task.id} className="transition hover:bg-slate-50/80">
                    <td className="border-b border-slate-100 px-5 py-5 align-top text-lg font-black tracking-tight text-[#2142a5]">
                      {task.identifier}
                    </td>
                    <td className="border-b border-slate-100 px-5 py-5 align-top">
                      <p className="max-w-xs text-[1.05rem] font-semibold leading-7 text-slate-800">
                        {task.title}
                      </p>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-5 align-top">
                      <span className="inline-flex rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-slate-600">
                        {task.projectLabel}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-5 align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dce7ff] text-xs font-bold text-[#2142a5]">
                          {task.assigneeLabel
                            .split(' ')
                            .slice(0, 2)
                            .map((part) => part[0] || '')
                            .join('')
                            .toUpperCase()}
                        </div>
                        <span className="text-base font-medium text-slate-700">{task.assigneeLabel}</span>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-5 align-top">
                      <span
                        className={`inline-flex rounded px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] ${getPriorityStyles(task.priority)}`}
                      >
                        {formatDisplayText(task.priority)}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-5 align-top">
                      <div className="flex items-center gap-2.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${getStatusStyles(task.status)}`} />
                        <span className="text-base font-semibold text-slate-600">
                          {formatDisplayText(task.status)}
                        </span>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-5 align-top text-base font-medium text-slate-700">
                      {formatDueDate(task.dueDate)}
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-200 bg-[#fbfcff] px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {visibleCount === 0 ? 0 : 1}-{visibleCount} of {totalCount} results
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-400"
          >
            <ChevronLeftIcon />
          </button>
          {[1, 2, 3].map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={`inline-flex h-8 w-8 items-center justify-center rounded border text-sm font-semibold ${
                pageNumber === 1
                  ? 'border-[#1f46b8] bg-[#1f46b8] text-white'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <span className="px-1 text-slate-400">...</span>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-500"
          >
            5
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-500"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </div>
  )
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path d="m11.75 5.5-4.5 4.5 4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path d="m8.25 5.5 4.5 4.5-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default TaskTable
