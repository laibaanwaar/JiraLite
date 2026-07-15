import EmptyState from './EmptyState'

const TABLE_HEADERS = ['Role Name', 'Role Code', 'Description', 'Users', 'Status', 'Actions']

function RoleTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#f4f7ff] text-left">
              {TABLE_HEADERS.map((heading) => (
                <th
                  key={heading}
                  className="border-b border-slate-200 px-5 py-4 text-sm font-bold text-slate-600"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr>
              <td colSpan="6">
                <EmptyState
                  title="No roles created yet"
                  description="This table is ready for API data, but it is intentionally empty for now."
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>Showing 0-0 of 0 roles</p>

        <div className="flex items-center gap-2">
          <PaginationButton ariaLabel="Previous page" disabled>
            <ChevronLeftIcon />
          </PaginationButton>
          <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#1f46b8] px-3 text-sm font-semibold text-white">
            1
          </span>
          <PaginationButton ariaLabel="Next page" disabled>
            <ChevronRightIcon />
          </PaginationButton>
        </div>
      </div>
    </div>
  )
}

function PaginationButton({ children, ariaLabel, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {children}
    </button>
  )
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path d="m11.5 5.5-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path d="m8.5 5.5 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default RoleTable
