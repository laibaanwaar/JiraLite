import AdminDashboardEmptyState from '../../components/dashboard/AdminDashboardEmptyState.jsx'
import DashboardErrorState from '../../components/dashboard/DashboardErrorState.jsx'
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton.jsx'
import RecentProjects from '../../components/dashboard/RecentProjects.jsx'
import SummaryCard from '../../components/dashboard/SummaryCard.jsx'
import TaskStatusChart from '../../components/dashboard/TaskStatusChart.jsx'
import { getSafeNumber } from '../../components/dashboard/dashboardUtils.js'
import AppShell from '../../components/layout/AppShell.jsx'
import useAdminDashboard from '../../hooks/useAdminDashboard.js'

function navigateTo(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export default function AdminDashboardPage() {
  const {
    dashboardData,
    error,
    hasLoadedDashboard,
    loading,
    projectFilterAvailable,
    projectOptions,
    projectOptionsError,
    retry,
    selectedProjectId,
    setSelectedProjectId,
  } = useAdminDashboard()

  const summary = dashboardData?.summary || {}
  const permissions = dashboardData?.permissions || {}
  const primaryCards = [
    {
      label: 'Projects',
      value: getSafeNumber(summary.total_projects),
      subtitle: 'Total Projects',
    },
    {
      label: 'Tasks',
      value: getSafeNumber(summary.total_tasks),
      subtitle: 'Total Tasks',
    },
    {
      label: 'In Progress',
      value: getSafeNumber(summary.in_progress_tasks),
      subtitle: 'Tasks',
    },
    {
      label: 'Completed',
      value: getSafeNumber(summary.completed_tasks),
      subtitle: 'Tasks',
    },
  ]
  const hasNoManagedProjects =
    getSafeNumber(summary.total_projects) === 0 &&
    dashboardData.recent_projects.length === 0 &&
    dashboardData.recent_tasks.length === 0 &&
    dashboardData.upcoming_deadlines.length === 0

  const showPermissionsEmptyState =
    hasNoManagedProjects &&
    !permissions.can_create_task &&
    !permissions.can_invite_users &&
    !permissions.can_manage_members

  return (
    <AppShell activePath="/dashboard">
          {loading && !hasLoadedDashboard ? <DashboardSkeleton /> : null}

          {!loading && !hasLoadedDashboard && error ? <DashboardErrorState message={error} onRetry={retry} /> : null}

          {!loading && hasLoadedDashboard ? (
            <section aria-labelledby="dashboard-title" className="space-y-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h1 id="dashboard-title" className="text-4xl font-black tracking-tight text-slate-900">
                    Dashboard
                  </h1>
                  {dashboardData?.selected_project?.name ? (
                    <p className="mt-3 text-sm font-medium text-slate-400">Focused on {dashboardData.selected_project.name}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {projectFilterAvailable ? (
                    <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
                      <span>Project</span>
                      <select
                        value={selectedProjectId}
                        onChange={(event) => setSelectedProjectId(event.target.value)}
                        className="bg-transparent font-bold text-slate-900 outline-none"
                      >
                        <option value="">All Managed Projects</option>
                        {projectOptions.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  {permissions.can_create_project ? (
                    <button
                      type="button"
                      onClick={() => navigateTo('/projects/create')}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#4b36f4] px-6 py-4 text-base font-extrabold text-white shadow-[0_16px_34px_rgba(75,54,244,0.28)] transition hover:bg-[#3726c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
                    >
                      <PlusIcon />
                      New Project
                    </button>
                  ) : null}
                </div>
              </div>

              {error ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  {error}
                </p>
              ) : null}

              {!projectFilterAvailable && projectOptionsError ? (
                <p className="text-xs font-semibold text-slate-400">{projectOptionsError}</p>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {primaryCards.map((card) => (
                  <SummaryCard key={card.label} label={card.label} value={card.value} subtitle={card.subtitle} />
                ))}
              </div>

              {showPermissionsEmptyState ? (
                <AdminDashboardEmptyState
                  canCreateProject={permissions.can_create_project}
                  onCreateProject={() => navigateTo('/projects/create')}
                  title="You do not currently manage any projects."
                  description="Create a project to start managing tasks and team members."
                />
              ) : hasNoManagedProjects ? (
                <AdminDashboardEmptyState
                  canCreateProject={permissions.can_create_project}
                  onCreateProject={() => navigateTo('/projects/create')}
                  title="No admin dashboard data yet."
                  description="Create a project to start managing tasks and team members."
                />
              ) : (
                <div className="grid gap-6 xl:grid-cols-[1.05fr_1.45fr]">
                  <RecentProjects
                    projects={dashboardData.recent_projects}
                    showProjectsLink={Boolean(permissions.can_create_project)}
                    onViewAllProjects={permissions.can_create_project ? () => navigateTo('/projects/create') : undefined}
                  />
                  <TaskStatusChart totalTasks={summary.total_tasks} items={dashboardData.tasks_by_status} />
                </div>
              )}
            </section>
          ) : null}
    </AppShell>
  )
}
