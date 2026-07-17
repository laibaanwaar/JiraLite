export default function Pagination({
  currentPage,
  hasNext,
  hasPrevious,
  onPageChange,
  onPageSizeChange,
  pageSize,
  totalCount,
  totalPages: providedTotalPages,
}) {
  const totalPages = providedTotalPages || Math.max(1, Math.ceil(totalCount / pageSize))
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)
  const canGoPrevious = hasPrevious ?? currentPage > 1
  const canGoNext = hasNext ?? currentPage < totalPages
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((pageNumber) => Math.abs(pageNumber - currentPage) <= 2 || pageNumber === 1 || pageNumber === totalPages)

  if (totalCount <= 0) {
    return null
  }

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] lg:flex-row lg:items-center lg:justify-between">
      <p className="m-0 text-sm font-semibold text-slate-500">
        Showing {startItem} to {endItem} of {totalCount} tasks
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canGoPrevious}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:enabled:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          {pageNumbers.map((pageNumber, index) => {
            const previousPageNumber = pageNumbers[index - 1]
            const showGap = previousPageNumber && pageNumber - previousPageNumber > 1

            return (
              <span key={pageNumber} className="inline-flex items-center gap-2">
                {showGap ? <span className="text-sm font-bold text-slate-400">...</span> : null}
                <button
                  type="button"
                  onClick={() => onPageChange(pageNumber)}
                  aria-current={pageNumber === currentPage ? 'page' : undefined}
                  className={`min-w-10 rounded-lg border px-3 py-2 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4] ${
                    pageNumber === currentPage
                      ? 'border-[#4b36f4] bg-[#eef0ff] text-[#4030e8]'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pageNumber}
                </button>
              </span>
            )
          })}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canGoNext}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:enabled:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
        {onPageSizeChange ? (
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
            aria-label="Tasks per page"
          >
            {[10, 20, 50].map((option) => (
              <option key={option} value={option}>
                {option} per page
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  )
}
