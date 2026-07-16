export default function TaskTableSkeleton() {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="animate-pulse overflow-x-auto">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[60px_2fr_1.2fr_1fr_1fr_1.4fr_1fr_100px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-4 rounded bg-slate-200" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-[60px_2fr_1.2fr_1fr_1fr_1.4fr_1fr_100px] gap-4 border-b border-slate-100 px-5 py-5">
              {Array.from({ length: 8 }).map((__, cellIndex) => (
                <div key={cellIndex} className="h-4 rounded bg-slate-100" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
