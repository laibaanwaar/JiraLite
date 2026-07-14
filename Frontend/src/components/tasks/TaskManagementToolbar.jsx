function ToolbarPill({ children }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
    >
      {children}
      <ChevronDownIcon />
    </button>
  )
}

function TaskManagementToolbar({ onCreateTask }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[2rem] font-black tracking-tight text-slate-900">
            Task Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage and track engineering tickets across infrastructure projects.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateTask}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#1f46b8] px-6 text-base font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#1a3c9f]"
        >
          <PlusIcon />
          <span>Create Task</span>
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm shadow-slate-200/30 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
          <ToolbarPill>
            <span className="text-xs uppercase tracking-[0.16em] text-slate-500">Project:</span>
            <span>All Projects</span>
          </ToolbarPill>

          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-[#1f46b8] transition hover:text-[#173792]"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-slate-500" stroke="currentColor" strokeWidth="1.8">
      <path d="m5.5 7.5 4.5 4.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
      <path d="M10 4.5v11M4.5 10h11" strokeLinecap="round" />
    </svg>
  )
}

export default TaskManagementToolbar
