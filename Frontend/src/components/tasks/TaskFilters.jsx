import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from './taskMeta.js'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="m20 20-4.2-4.2M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export default function TaskFilters({
  filters,
  hasActiveFilters,
  hideProjectFilter = false,
  onChange,
  onClear,
  projects,
}) {
  const selectClassName =
    'h-11 rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm font-bold text-slate-600 outline-none transition hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10'

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className={`grid gap-3 ${hideProjectFilter ? 'lg:grid-cols-[150px_150px_1fr]' : 'lg:grid-cols-[170px_150px_150px_1fr]'}`}>
        {!hideProjectFilter ? (
          <select
            name="project_id"
            value={filters.project_id}
            onChange={onChange}
            className={selectClassName}
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        ) : null}

        <select name="status" value={filters.status} onChange={onChange} className={selectClassName}>
          <option value="">All Status</option>
          {TASK_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select name="priority" value={filters.priority} onChange={onChange} className={selectClassName}>
          <option value="">All Priority</option>
          {TASK_PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="relative block">
          <span className="sr-only">Search tasks</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </span>
          <input
            name="search"
            type="search"
            value={filters.search}
            onChange={onChange}
            placeholder="Search tasks..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
          />
        </label>
      </div>

      {hasActiveFilters ? (
        <div className="flex justify-start">
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
          >
            Clear Filters
          </button>
        </div>
      ) : null}
    </div>
  )
}
