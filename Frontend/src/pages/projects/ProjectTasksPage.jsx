import { useEffect, useState } from 'react'
import Pagination from '../../components/common/Pagination.jsx'
import AppShell from '../../components/layout/AppShell.jsx'
import TaskEmptyState from '../../components/tasks/TaskEmptyState.jsx'
import TaskTable from '../../components/tasks/TaskTable.jsx'
import TaskTableSkeleton from '../../components/tasks/TaskTableSkeleton.jsx'
import { canCreateTask } from '../../components/tasks/taskPermissions.js'
import { TASK_STATUS_OPTIONS } from '../../components/tasks/taskMeta.js'
import useAuth from '../../hooks/useAuth.js'
import useTaskCommentCounts from '../../hooks/useTaskCommentCounts.js'
import useTasks from '../../hooks/useTasks.js'
import { getProject } from '../../services/projectService.js'
import { getProjectTasks } from '../../services/taskService.js'

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path
        d="M4 7.5h6l1.7 2H20v8.75H4V7.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function MembersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M16 19a4.5 4.5 0 0 0-8 0M12 12.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM20 18a3.4 3.4 0 0 0-3.25-2.5M17.5 11.5a2.25 2.25 0 1 0 0-4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function TasksIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M8 7.5h8M8 12h8M8 16.5h5M5.5 7.5l.01.01M5.5 12l.01.01M5.5 16.5l.01.01M17.5 5.5h1a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17V7a1.5 1.5 0 0 1 1.5-1.5h1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

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

function navigateTo(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function getRoleLabel(role) {
  if (!role) {
    return 'Member'
  }

  return String(role).toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase())
}

async function loadStatusCounts(projectId, signal) {
  const pageSize = 100
  let page = 1
  let allTasks = []
  let totalCount = 0

  do {
    const response = await getProjectTasks(projectId, { page, page_size: pageSize }, { signal })
    totalCount = response.count
    allTasks = [...allTasks, ...response.results]
    page += 1
  } while (allTasks.length < totalCount)

  return TASK_STATUS_OPTIONS.reduce(
    (counts, option) => ({
      ...counts,
      [option.value]: allTasks.filter((task) => task.status === option.value).length,
    }),
    { all: allTasks.length },
  )
}

export default function ProjectTasksPage({ projectId }) {
  const { roleCode, user } = useAuth()
  const [project, setProject] = useState(null)
  const [projectError, setProjectError] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  })
  const [searchValue, setSearchValue] = useState('')
  const [statusCounts, setStatusCounts] = useState({ all: 0 })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { count, errorMessage, isLoading, next, previous, refetch, tasks, totalPages } = useTasks({
    filters,
    mode: 'project',
    page,
    pageSize,
    projectId,
  })
  const commentCounts = useTaskCommentCounts(tasks)

  useEffect(() => {
    const url = new URL(window.location.href)
    const nextStatus = url.searchParams.get('status') || ''
    const nextSearch = url.searchParams.get('search') || ''

    setFilters({
      status: nextStatus,
      search: nextSearch,
    })
    setSearchValue(nextSearch)
    setPage(Math.max(1, Number(url.searchParams.get('page') || 1)))
    setPageSize(Math.max(1, Number(url.searchParams.get('page_size') || 10)))
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    getProject(projectId, undefined, { signal: controller.signal })
      .then((response) => {
        setProject(response.project)
        setProjectError('')
      })
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') {
          setProject(null)
          setProjectError('Unable to load project details.')
        }
      })

    return () => controller.abort()
  }, [projectId])

  useEffect(() => {
    const controller = new AbortController()

    loadStatusCounts(projectId, controller.signal)
      .then(setStatusCounts)
      .catch(() => setStatusCounts({ all: 0 }))

    return () => controller.abort()
  }, [projectId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFilters((currentFilters) => ({
        ...currentFilters,
        search: searchValue.trim(),
      }))
      setPage(1)
    }, 400)

    return () => window.clearTimeout(timeoutId)
  }, [searchValue])

  useEffect(() => {
    const url = new URL(window.location.href)

    if (filters.status) {
      url.searchParams.set('status', filters.status)
    } else {
      url.searchParams.delete('status')
    }

    if (filters.search) {
      url.searchParams.set('search', filters.search)
    } else {
      url.searchParams.delete('search')
    }

    if (page > 1) {
      url.searchParams.set('page', String(page))
    } else {
      url.searchParams.delete('page')
    }

    if (pageSize !== 10) {
      url.searchParams.set('page_size', String(pageSize))
    } else {
      url.searchParams.delete('page_size')
    }

    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`)
  }, [filters, page, pageSize])

  useEffect(() => {
    if (!isLoading && count > 0 && page > totalPages) {
      setPage(totalPages)
    }
  }, [count, isLoading, page, totalPages])

  const updatePageSize = (nextPageSize) => {
    setPageSize(nextPageSize)
    setPage(1)
  }

  const updateStatus = (status) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      status,
    }))
    setPage(1)
  }

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

  const clearFilters = () => {
    setFilters({
      status: '',
      search: '',
    })
    setSearchValue('')
    setPage(1)
  }

  const hasActiveFilters = Boolean(filters.status || filters.search)
  const projectName = project?.name || `Project #${projectId}`
  const canCreateProjectTask = roleCode === 'ADMIN' && canCreateTask(project)

  return (
    <AppShell activePath="/projects">
      <section aria-labelledby="project-tasks-title">
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500" aria-label="Breadcrumb">
          <button type="button" onClick={() => navigateTo('/projects')} className="text-[#4b36f4] hover:underline">
            Projects
          </button>
          <span>/</span>
          <button type="button" onClick={() => navigateTo(`/projects/${projectId}`)} className="text-[#4b36f4] hover:underline">
            {projectName}
          </button>
          <span>/</span>
          <span className="text-slate-700">Tasks</span>
        </nav>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 id="project-tasks-title" className="m-0 mt-2 text-3xl font-extrabold text-slate-900">
              Project Tasks
            </h1>
          </div>
          {canCreateProjectTask ? (
            <button
              type="button"
              onClick={() => navigateTo(`/tasks/create?project_id=${encodeURIComponent(projectId)}&return_to=${encodeURIComponent(`/projects/${projectId}/tasks`)}`)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#4b36f4] to-[#3827d9] px-5 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(64,48,232,0.2)] transition hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(64,48,232,0.26)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#4b36f4]/30"
            >
              <PlusIcon />
              New Task
            </button>
          ) : null}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="grid gap-4 lg:grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr] lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#4b36f4] text-white">
                <FolderIcon />
              </div>
              <div>
                <p className="m-0 text-base font-black text-slate-900">{projectName}</p>
                <p className="m-0 mt-1 text-sm font-semibold text-slate-500">{project?.description || 'No description provided.'}</p>
              </div>
            </div>
            <div>
              <span className="rounded-lg bg-[#efe8ff] px-3 py-1.5 text-xs font-extrabold text-[#5b35f5]">
                {getRoleLabel(project?.current_user_role)}
              </span>
            </div>
            <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-700">
              <MembersIcon />
              <span>
                <span className="block text-xs font-black uppercase text-slate-400">Members</span>
                {project?.total_members ?? 'N/A'}
              </span>
            </div>
            <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-700">
              <TasksIcon />
              <span>
                <span className="block text-xs font-black uppercase text-slate-400">Total Tasks</span>
                {statusCounts.all || project?.total_tasks || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {[{ value: '', label: 'All', count: statusCounts.all || 0 }, ...TASK_STATUS_OPTIONS.map((option) => ({
            ...option,
            count: statusCounts[option.value] || 0,
          }))].map((option) => (
            <button
              key={option.value || 'all'}
              type="button"
              onClick={() => updateStatus(option.value)}
              className={`rounded-xl border px-4 py-3 text-center text-sm font-black transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4] ${
                filters.status === option.value
                  ? 'border-[#4b36f4] bg-[#f3f1ff] text-[#4b36f4]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-[#4b36f4]/40'
              }`}
            >
              <span className="block">{option.label}</span>
              <span className="mt-1 block">{option.count}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_240px_auto]">
          <label className="relative block">
            <span className="sr-only">Search tasks</span>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              name="search"
              type="search"
              value={searchValue}
              onChange={updateFilter}
              placeholder="Search tasks..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
            />
          </label>
          <select
            name="status"
            value={filters.status}
            onChange={updateFilter}
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm font-bold text-slate-600 outline-none transition hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
          >
            <option value="">All Status</option>
            {TASK_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
            >
              Clear
            </button>
          ) : null}
        </div>

        {projectError ? (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {projectError}
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
              currentPage={page}
              onDelete={(task) => navigateTo(`/tasks/${task.id}`)}
              onEdit={(task) => navigateTo(`/tasks/${task.id}/edit`)}
              onComments={(task) => navigateTo(`/tasks/${task.id}/comments`)}
              onUpdateStatus={(task) => navigateTo(`/tasks/${task.id}/edit`)}
              onView={(task) => navigateTo(`/tasks/${task.id}`)}
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
          <TaskEmptyState isFiltered={false} />
        ) : null}
      </section>
    </AppShell>
  )
}
