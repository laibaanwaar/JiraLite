function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" aria-hidden="true">
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

export default function ProjectEmptyState({ onCreateProject }) {
  return (
    <section className="mt-6 flex min-h-[460px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14">
      <div className="flex max-w-[480px] flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f0efff] text-[#4b36f4]">
          <FolderIcon />
        </div>
        <h2 className="mt-7 text-2xl font-black text-slate-900">
          No projects have been created yet.
        </h2>
        <p className="mt-4 text-base font-semibold leading-7 text-slate-500">
          Create your first project to start managing tasks and team members.
        </p>
        <button
          type="button"
          onClick={onCreateProject}
          className="mt-6 min-h-12 rounded-lg bg-[#4b36f4] px-7 text-base font-extrabold text-white shadow-[0_14px_24px_rgba(75,54,244,0.2)] transition hover:bg-[#3827d9] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#4b36f4]/30"
        >
          New Project
        </button>
      </div>
    </section>
  )
}
