import { useState } from 'react'
import Sidebar from '../../components/layout/Sidebar.jsx'
import CreateTaskForm from '../../components/tasks/CreateTaskForm.jsx'

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
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

export default function TasksPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [filters, setFilters] = useState({
    project: '',
    status: '',
    priority: '',
    search: '',
  })

  const updateFilter = (event) => {
    const { name, value } = event.target

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }))
  }

  const selectClassName =
    'h-11 rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm font-bold text-slate-600 outline-none transition hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10'

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1180px] border-x border-slate-200 bg-white">
        <div className="hidden md:block">
          <Sidebar activePath="/tasks" />
        </div>

        {isSidebarOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/30"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar"
            />
            <div className="absolute left-0 top-0 h-full w-[260px] bg-white shadow-2xl">
              <Sidebar activePath="/tasks" onNavigate={() => setIsSidebarOpen(false)} />
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 md:px-10 md:py-8">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4] md:hidden"
          >
            <MenuIcon />
            Menu
          </button>

          {isCreatingTask ? (
            <section aria-labelledby="create-task-title">
              <CreateTaskForm onCancel={() => setIsCreatingTask(false)} />
            </section>
          ) : (
            <section aria-labelledby="tasks-title">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 id="tasks-title" className="m-0 text-3xl font-extrabold text-slate-900">
                  Tasks
                </h1>
                <button
                  type="button"
                  onClick={() => setIsCreatingTask(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#4b36f4] to-[#3827d9] px-5 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(64,48,232,0.2)] transition hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(64,48,232,0.26)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#4b36f4]/30"
                >
                  <PlusIcon />
                  New Task
                </button>
              </div>

              <div className="mt-6 grid gap-3 lg:grid-cols-[150px_150px_150px_1fr]">
                <label className="sr-only" htmlFor="taskProjectFilter">
                  Filter by project
                </label>
                <select
                  id="taskProjectFilter"
                  name="project"
                  value={filters.project}
                  onChange={updateFilter}
                  className={selectClassName}
                >
                  <option value="">All Projects</option>
                </select>

                <label className="sr-only" htmlFor="taskStatusFilter">
                  Filter by status
                </label>
                <select
                  id="taskStatusFilter"
                  name="status"
                  value={filters.status}
                  onChange={updateFilter}
                  className={selectClassName}
                >
                  <option value="">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>

                <label className="sr-only" htmlFor="taskPriorityFilter">
                  Filter by priority
                </label>
                <select
                  id="taskPriorityFilter"
                  name="priority"
                  value={filters.priority}
                  onChange={updateFilter}
                  className={selectClassName}
                >
                  <option value="">All Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
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
                    onChange={updateFilter}
                    placeholder="Search tasks..."
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
                  />
                </label>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <div className="overflow-x-auto">
                  <table className="min-w-[760px] w-full text-left">
                    <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4">#</th>
                        <th className="px-5 py-4">Task Title</th>
                        <th className="px-5 py-4">Project</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Priority</th>
                        <th className="px-5 py-4">Assignee</th>
                        <th className="px-5 py-4">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan="7" className="px-5 py-16 text-center">
                          <p className="text-base font-extrabold text-slate-800">
                            No tasks have been created yet.
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-500">
                            Click New Task to open the task form.
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
