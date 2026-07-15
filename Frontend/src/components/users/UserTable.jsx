import EmptyState from './EmptyState'
import Pagination from './Pagination'
import UserTableRow from './UserTableRow'

const TABLE_HEADERS = ['Member Name', 'Email', 'Role', 'Status', 'Last Active', 'Actions']

function UserTable({
  users,
  totalCount,
  isLoading,
  errorMessage,
  actionError,
  togglingUserId,
  onRetry,
  onToggleUser,
}) {
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
              ? Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`users-loading-row-${index}`} className="animate-pulse">
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                      <td key={`users-loading-cell-${cellIndex}`} className="border-b border-slate-100 px-5 py-5">
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

            {!isLoading && !errorMessage && actionError ? (
              <tr>
                <td colSpan="6" className="border-b border-slate-100 px-5 py-4 text-sm font-medium text-red-600">
                  {actionError}
                </td>
              </tr>
            ) : null}

            {!isLoading && !errorMessage && users.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <EmptyState
                    title="No users found yet."
                    description="Once members are available, they will appear here."
                  />
                </td>
              </tr>
            ) : null}

            {!isLoading && !errorMessage
              ? users.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    isToggling={togglingUserId === user.id}
                    onToggle={() => onToggleUser(user.id)}
                  />
                ))
              : null}
          </tbody>
        </table>
      </div>

      <Pagination totalCount={totalCount} visibleCount={users.length} />
    </div>
  )
}

export default UserTable
