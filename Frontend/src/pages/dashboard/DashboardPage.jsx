import DashboardEmptyState from '../../components/dashboard/DashboardEmptyState.jsx'
import DashboardErrorState from '../../components/dashboard/DashboardErrorState.jsx'
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton.jsx'
import DashboardStats from '../../components/dashboard/DashboardStats.jsx'
import TaskPriorityChart from '../../components/dashboard/TaskPriorityChart.jsx'
import TaskStatusChart from '../../components/dashboard/TaskStatusChart.jsx'
import RecentTasks from '../../components/dashboard/RecentTasks.jsx'
import { deleteTask } from '../../services/taskService.js'
import PageHeader from '../../components/layout/PageHeader.jsx'
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout.jsx'
import { getSafeNumber } from '../../components/dashboard/dashboardUtils.js'
import useDashboard from '../../hooks/useDashboard.js'
import { navigateTo } from '../../utils/navigation.js'

function ProjectFilter({ dashboardData, selectedProjectId, setSelectedProjectId }) {
  const options = dashboardData.project_options || []

  if (options.length === 0) {
    return null
  }

  return (
    <label className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 shadow-sm sm:w-[280px]">
      <span className="shrink-0">Project</span>
      <select
        value={selectedProjectId}
        onChange={(event) => setSelectedProjectId(event.target.value)}
        className="min-w-0 flex-1 bg-transparent font-bold text-slate-900 outline-none"
      >
        <option value="">{dashboardData.scope === 'managed' ? 'All Managed Projects' : 'All My Projects'}</option>
        {options.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function DashboardPage() {
  const {
    dashboardData,
    error,
    hasLoadedDashboard,
    isLoading,
    retry,
    selectedProjectId,
    setSelectedProjectId,
  } = useDashboard()
  const permissions = dashboardData.permissions || {}
  const isManagedScope = dashboardData.scope === 'managed'
  const hasNoProjects = getSafeNumber(dashboardData.summary?.total_projects) === 0
  const hasNoTasks = getSafeNumber(dashboardData.summary?.total_tasks) === 0
  const showEmptyState = hasLoadedDashboard && hasNoProjects && hasNoTasks

  return (
    <AuthenticatedLayout activePath="/dashboard" frameClassName="max-w-[1440px]" mainClassName="py-5 md:py-6">
      {isLoading && !hasLoadedDashboard ? <DashboardSkeleton /> : null}

      {!isLoading && !hasLoadedDashboard && error ? <DashboardErrorState message={error} onRetry={retry} /> : null}

      {hasLoadedDashboard ? (
        <section aria-labelledby="dashboard-title" className="space-y-5">
          <PageHeader
            eyebrow={isManagedScope ? 'Managed Scope' : 'Member Scope'}
            title="Dashboard"
            subtitle={
              isManagedScope
                ? 'Overview of the projects and tasks you manage.'
                : 'Overview of your projects and assigned tasks.'
            }
          />

          {error ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {error}
            </p>
          ) : null}

          <DashboardStats summary={dashboardData.summary} />

          {showEmptyState ? (
            <DashboardEmptyState
              actionLabel={permissions.can_create_project ? 'Create Your First Project' : ''}
              onAction={permissions.can_create_project ? () => navigateTo('/projects/create') : undefined}
              title={isManagedScope ? 'You are not managing any projects yet.' : 'You are not currently a member of any projects.'}
              description={
                isManagedScope
                  ? 'Create or join a project to start tracking your managed work.'
                  : 'Projects and assigned tasks will appear here after you join a project.'
              }
            />
          ) : (
            <>
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="min-w-0">
                  <TaskStatusChart totalTasks={dashboardData.summary.total_tasks} items={dashboardData.tasks_by_status} />
                </div>
                <div className="min-w-0">
                  <TaskPriorityChart items={dashboardData.tasks_by_priority} />
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <div className="min-w-0">
                  <RecentTasks
                    tasks={dashboardData.recent_tasks || []}
                    userId={dashboardData.current_user?.id}
                    onView={(task) => navigateTo(`/tasks/${task.id}`)}
                    onEdit={(task) => navigateTo(`/tasks/${task.id}/edit`)}
                    onUpdateStatus={(task) => navigateTo(`/tasks/${task.id}/edit`)}
                    onDelete={async (task) => {
                      if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return

                      try {
                        await deleteTask(task.id)
                        try { window.dispatchEvent(new CustomEvent('jira-lite:task-deleted', { detail: { taskId: task.id } })) } catch (e) {}
                      } catch (e) {
                        // ignore — could show error notification
                      }
                    }}
                    onTaskClick={(task) => navigateTo(`/tasks/${task.id}`)}
                  />
                </div>
              </div>

            </>
          )}
        </section>
      ) : null}
    </AuthenticatedLayout>
  )
}
