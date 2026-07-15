function ToolbarButton({ children, variant = 'secondary', onClick }) {
  const classes =
    variant === 'primary'
      ? 'bg-[#1f46b8] text-white hover:bg-[#1a3c9f]'
      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition ${classes}`}
    >
      {children}
    </button>
  )
}

function ProjectsToolbar({ onCreateProject }) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h1 className="text-[2rem] font-black tracking-tight text-slate-900">Projects</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage and monitor organizational workflow across all departments.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ToolbarButton>
          <FilterIcon />
          <span>Filter</span>
        </ToolbarButton>
        <ToolbarButton>
          <SortIcon />
          <span>Sort</span>
        </ToolbarButton>
        <ToolbarButton variant="primary" onClick={onCreateProject}>
          <PlusIcon />
          <span>Create Project</span>
        </ToolbarButton>
      </div>
    </div>
  )
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path d="M3.75 5.25h12.5l-5 5.42v4.08l-2.5-1.34v-2.74l-5-5.42Z" strokeLinejoin="round" />
    </svg>
  )
}

function SortIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 4.25v11.5M6 15.75l-2-2M6 15.75l2-2M14 15.75V4.25M14 4.25l-2 2M14 4.25l2 2" strokeLinecap="round" strokeLinejoin="round" />
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

export default ProjectsToolbar
