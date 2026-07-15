function PagePill({ active = false, className = 'w-8', children = '' }) {
  return (
    <div
      className={`flex h-8 items-center justify-center rounded border text-sm font-semibold ${className} ${
        active ? 'border-[#1f46b8] bg-[#1f46b8] text-white' : 'border-slate-200 bg-white text-slate-500'
      }`}
    >
      {children}
    </div>
  )
}

function Pagination({ totalCount, visibleCount }) {
  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 bg-[#fbfcff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing {visibleCount === 0 ? 0 : 1}-{visibleCount} of {totalCount} users
      </p>

      <div className="flex items-center gap-2">
        <PagePill className="w-16" />
        <PagePill active className="w-8">
          1
        </PagePill>
        <PagePill className="w-8">2</PagePill>
        <PagePill className="w-12" />
      </div>
    </div>
  )
}

export default Pagination
