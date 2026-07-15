import AppShell from '../components/AppShell'
import UserTable from '../components/users/UserTable'
import UsersSummarySection from '../components/users/UsersSummarySection'
import UsersToolbar from '../components/users/UsersToolbar'
import { useUsers } from '../hooks/useUsers'

function Users() {
  const {
    actionError,
    dashboardError,
    handleToggleUserActivation,
    isLoadingSummary,
    isLoadingUsers,
    refreshDashboard,
    refreshUsers,
    summary,
    togglingUserId,
    totalCount,
    users,
    usersError,
  } = useUsers()

  return (
    <AppShell>
      <section className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="min-h-[calc(100vh-8rem)] rounded-[28px] border border-slate-200 bg-[#f8faff] px-4 py-4 sm:px-6 sm:py-6">
          <div className="space-y-5">
            <UsersToolbar />
            <UsersSummarySection
              summary={summary}
              isLoading={isLoadingSummary}
              errorMessage={dashboardError}
              onRetry={refreshDashboard}
            />
            <UserTable
              users={users}
              totalCount={totalCount}
              isLoading={isLoadingUsers}
              errorMessage={usersError}
              actionError={actionError}
              togglingUserId={togglingUserId}
              onRetry={refreshUsers}
              onToggleUser={handleToggleUserActivation}
            />
          </div>
        </div>
      </section>
    </AppShell>
  )
}

export default Users
