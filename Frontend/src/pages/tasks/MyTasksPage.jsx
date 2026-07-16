import { useEffect, useMemo, useState } from 'react'
import AppShell from '../../components/layout/AppShell.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import TaskEmptyState from '../../components/tasks/TaskEmptyState.jsx'
import TaskFilters from '../../components/tasks/TaskFilters.jsx'
import TaskTable from '../../components/tasks/TaskTable.jsx'
import TaskTableSkeleton from '../../components/tasks/TaskTableSkeleton.jsx'
import useTasks from '../../hooks/useTasks.js'
import { getStoredUser } from '../../services/authService.js'
import { getProjects } from '../../services/projectService.js'

function navigateTo(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function MyTasksPage() {
  const [filters, setFilters] = useState({
    project_id: '',
    status: '',
    priority: '',
    search: '',
  })
  const [searchValue, setSearchValue] = useState('')
  const [page, setPage] = useState(1)
  const [projects, setProjects] = useState([])
  const currentUser = useMemo(() => getStoredUser(), [])
  const { count, errorMessage, isLoading, tasks } = useTasks({
    filters,
    mode: 'mine',
    page,
    pageSize: 10,
  })

  useEffect(() => {
    const controller = new AbortController()

    getProjects({}, undefined, { signal: controller.signal })
      .then((response) => setProjects(response.results))
      .catch(() => {})

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFilters((current) => ({
        ...current,
        search: searchValue,
      }))
      setPage(1)
    }, 400)

    return () => window.clearTimeout(timeoutId)
  }, [searchValue])

  const updateFilter = (event) => {
    const { name, value } = event.target
    setPage(1)

    if (name === 'search') {
      setSearchValue(value)
      return
    }

    setFilters((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const hasActiveFilters = Boolean(filters.project_id || filters.status || filters.priority || filters.search)

  const clearFilters = () => {
    setFilters({
      project_id: '',
      status: '',
      priority: '',
      search: '',
    })
    setSearchValue('')
    setPage(1)
  }

  return (
    <AppShell activePath="/tasks">
          <section aria-labelledby="my-tasks-title">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 id="my-tasks-title" className="m-0 text-3xl font-extrabold text-slate-900">My Tasks</h1>
                <p className="mt-2 text-sm font-semibold text-slate-500">Tasks currently assigned to you.</p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('/tasks')}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#4b36f4]/30"
              >
                All Tasks
              </button>
            </div>

            <TaskFilters
              filters={{
                ...filters,
                search: searchValue,
              }}
              hasActiveFilters={hasActiveFilters}
              onChange={updateFilter}
              onClear={clearFilters}
              projects={projects}
            />

            {errorMessage ? <p className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{errorMessage}</p> : null}
            {isLoading ? <TaskTableSkeleton /> : null}
            {!isLoading && !errorMessage && tasks.length > 0 ? (
              <>
                <TaskTable
                  onDelete={(task) => navigateTo(`/tasks/${task.id}`)}
                  onEdit={(task) => navigateTo(`/tasks/${task.id}/edit`)}
                  onUpdateStatus={(task) => navigateTo(`/tasks/${task.id}/edit`)}
                  onView={(task) => navigateTo(`/tasks/${task.id}`)}
                  tasks={tasks}
                  userId={currentUser?.id}
                />
                <Pagination currentPage={page} pageSize={10} totalCount={count} onPageChange={setPage} />
              </>
            ) : null}
            {!isLoading && !errorMessage && tasks.length === 0 ? (
              <TaskEmptyState isFiltered={hasActiveFilters} onClearFilters={clearFilters} />
            ) : null}
          </section>
    </AppShell>
  )
}
