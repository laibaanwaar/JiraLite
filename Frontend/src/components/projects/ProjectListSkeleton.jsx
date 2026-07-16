export default function ProjectListSkeleton() {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <div className="min-w-[980px] animate-pulse">
          <div className="grid grid-cols-[70px_1.5fr_1.6fr_0.8fr_0.8fr_0.8fr_1.1fr_1.1fr_1fr] border-b border-slate-200 px-5 py-5">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="h-3 w-20 rounded bg-slate-100" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-[70px_1.5fr_1.6fr_0.8fr_0.8fr_0.8fr_1.1fr_1.1fr_1fr] items-center border-b border-slate-200 px-5 py-4 last:border-b-0"
            >
              <div className="h-4 w-4 rounded bg-slate-100" />
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-100" />
                <div className="h-4 w-32 rounded bg-slate-100" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-40 rounded bg-slate-100" />
                <div className="h-3 w-28 rounded bg-slate-100" />
              </div>
              <div className="h-7 w-16 rounded-lg bg-slate-100" />
              <div className="h-4 w-12 rounded bg-slate-100" />
              <div className="h-4 w-12 rounded bg-slate-100" />
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-slate-100" />
                <div className="h-3 w-16 rounded bg-slate-100" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-slate-100" />
                <div className="h-3 w-16 rounded bg-slate-100" />
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-14 rounded-lg bg-slate-100" />
                <div className="h-10 w-10 rounded-lg bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
