import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import TaskEmptyState from '../../components/tasks/TaskEmptyState.jsx'
import TaskFilters from '../../components/tasks/TaskFilters.jsx'
import TaskTable from '../../components/tasks/TaskTable.jsx'
import TaskTableSkeleton from '../../components/tasks/TaskTableSkeleton.jsx'
import useAuth from '../../hooks/useAuth.js'
import useTaskCommentCounts from '../../hooks/useTaskCommentCounts.js'
import useTasks from '../../hooks/useTasks.js'
import { getProjects } from '../../services/projectService.js'

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export default function TasksPage() {
  const { roleCode, user } = useAuth()
  const [filters, setFilters] = useState({
    project_id: '',
    status: '',
    priority: '',
    search: '',
  })
  const [searchValue, setSearchValue] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [projects, setProjects] = useState([])
  const [notice, setNotice] = useState('')
  const canCreateTasks = roleCode === 'ADMIN' || roleCode === 'OWNER'
  const { count, errorMessage, isLoading, next, previous, refetch, tasks, totalPages } = useTasks({
    filters,
    mode: canCreateTasks ? 'all' : 'mine',
    page,
    pageSize,
  })
  const commentCounts = useTaskCommentCounts(tasks)

  useEffect(() => {
    const url = new URL(window.location.href)
    const nextProjectId = url.searchParams.get('project_id') || ''
    const nextStatus = url.searchParams.get('status') || ''
    const nextPriority = url.searchParams.get('priority') || ''
    const nextSearch = url.searchParams.get('search') || ''

    setFilters({
      project_id: nextProjectId,
      status: nextStatus,
      priority: nextPriority,
      search: nextSearch,
    })
    setSearchValue(nextSearch)
    setPage(Math.max(1, Number(url.searchParams.get('page') || 1)))
    setPageSize(Math.max(1, Number(url.searchParams.get('page_size') || 10)))
    setNotice(window.history.state?.tasksNotice || '')

    if (window.history.state?.tasksNotice) {
      window.history.replaceState({}, '', `${url.pathname}${url.search}`)
    }
  }, [])

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
        search: searchValue.trim(),
      }))
      setPage(1)
    }, 400)

    return () => window.clearTimeout(timeoutId)
  }, [searchValue])

  useEffect(() => {
    const url = new URL(window.location.href)
    Object.entries({
      project_id: filters.project_id,
      status: filters.status,
      priority: filters.priority,
      search: filters.search,
      page: String(page),
      page_size: String(pageSize),
    }).forEach(([key, value]) => {
      if (value && !(key === 'page' && value === '1') && !(key === 'page_size' && value === '10')) {
        url.searchParams.set(key, value)
      } else {
        url.searchParams.delete(key)
      }
    })

    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`)
  }, [filters, page, pageSize])

  useEffect(() => {
    if (!isLoading && count > 0 && page > totalPages) {
      setPage(totalPages)
    }
  }, [count, isLoading, page, totalPages])

  const updateFilter = (event) => {
    const { name, value } = event.target
    setPage(1)

    if (name === 'search') {
      setSearchValue(value)
      return
    }

    setFilters((currentFilters) => ({
      ...currentFilters,
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

  const updatePageSize = (nextPageSize) => {
    setPageSize(nextPageSize)
    setPage(1)
  }

  const goTo = (path) => {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <AppShell activePath="/tasks">
          <section aria-labelledby="tasks-title">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 id="tasks-title" className="m-0 text-3xl font-extrabold text-slate-900">
                Tasks
              </h1>
              {canCreateTasks ? (
                <button
                  type="button"
                  onClick={() => goTo('/tasks/create')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#4b36f4] to-[#3827d9] px-5 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(64,48,232,0.2)] transition hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(64,48,232,0.26)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#4b36f4]/30"
                >
                  <PlusIcon />
                  New Task
                </button>
              ) : null}
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

            {notice ? (
              <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">
                {notice}
              </p>
            ) : null}

            {errorMessage ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5">
                <p className="m-0 text-sm font-semibold text-rose-700">{errorMessage}</p>
                <button
                  type="button"
                  onClick={refetch}
                  className="mt-3 rounded-lg border border-rose-300 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {isLoading ? <TaskTableSkeleton /> : null}

            {!isLoading && !errorMessage && tasks.length > 0 ? (
              <>
                <TaskTable
                  commentCounts={commentCounts}
                  onDelete={(task) => goTo(`/tasks/${task.id}`)}
                  onEdit={(task) => goTo(`/tasks/${task.id}/edit`)}
                  onComments={(task) => goTo(`/tasks/${task.id}/comments`)}
                  onUpdateStatus={(task) => goTo(`/tasks/${task.id}/edit`)}
                  onView={(task) => goTo(`/tasks/${task.id}`)}
                  currentPage={page}
                  pageSize={pageSize}
                  tasks={tasks}
                  userId={user?.id}
                />
                <Pagination
                  currentPage={page}
                  hasNext={next ? true : page < totalPages}
                  hasPrevious={previous ? true : page > 1}
                  onPageChange={setPage}
                  onPageSizeChange={updatePageSize}
                  pageSize={pageSize}
                  totalCount={count}
                  totalPages={totalPages}
                />
              </>
            ) : null}

            {!isLoading && !errorMessage && tasks.length === 0 ? (
              <TaskEmptyState
                isFiltered={hasActiveFilters}
                onClearFilters={clearFilters}
                onCreate={canCreateTasks ? () => goTo('/tasks/create') : undefined}
              />
            ) : null}
          </section>
    </AppShell>
  )
}
