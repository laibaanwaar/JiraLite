function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="m20 20-4.2-4.2M10.75 18a7.25 7.25 0 1 1 0-14.5 7.25 7.25 0 0 1 0 14.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export default function ProjectFilters({ role, search, onRoleChange, onSearchChange }) {
  return (
    <div className="mt-6 flex flex-col gap-4 md:flex-row">
      <label className="sr-only" htmlFor="projectRoleFilter">
        Filter projects by role
      </label>
      <select
        id="projectRoleFilter"
        value={role}
        onChange={(event) => onRoleChange(event.target.value)}
        className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10 md:w-[200px]"
      >
        <option value="">All Roles</option>
        <option value="OWNER">Owner</option>
        <option value="ADMIN">Admin</option>
        <option value="MEMBER">Member</option>
      </select>

      <label className="sr-only" htmlFor="projectSearch">
        Search projects
      </label>
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          <SearchIcon />
        </span>
        <input
          id="projectSearch"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search projects..."
          className="h-12 w-full rounded-lg border border-slate-200 bg-white px-12 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
        />
      </div>
    </div>
  )
}
