export default function TaskEmptyState({ isFiltered, onClearFilters, onCreate }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef0ff] text-[#4b36f4]">
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
          <path
            d="M7 6.75h10M7 12h10m-10 5.25h6M5.75 4.75h12.5a1 1 0 0 1 1 1v12.5a1 1 0 0 1-1 1H5.75a1 1 0 0 1-1-1V5.75a1 1 0 0 1 1-1Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </div>
      <p className="mt-5 text-lg font-extrabold text-slate-900">
        {isFiltered ? 'No tasks match your current filters.' : 'No tasks have been created yet.'}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-500">
        {isFiltered ? 'Try adjusting or clearing your filters.' : 'Click New Task to open the task form.'}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        {isFiltered ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
          >
            Clear Filters
          </button>
        ) : null}
        {onCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="rounded-lg bg-linear-to-r from-[#4b36f4] to-[#3827d9] px-4 py-2 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(64,48,232,0.2)] transition hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
          >
            New Task
          </button>
        ) : null}
      </div>
    </div>
  )
}
