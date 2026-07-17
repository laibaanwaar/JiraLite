function SkeletonCard() {
  return (
    <div className="min-h-[132px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-24 rounded-full bg-slate-200" />
        <div className="h-9 w-20 rounded-full bg-slate-200" />
        <div className="h-4 w-20 rounded-full bg-slate-200" />
      </div>
    </div>
  )
}

function SkeletonPanel({ className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-36 rounded-full bg-slate-200" />
        <div className="h-[240px] rounded-2xl bg-slate-100" />
      </div>
    </div>
  )
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="animate-pulse rounded-[30px]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="h-8 w-40 rounded-full bg-slate-200" />
            <div className="h-5 w-72 max-w-full rounded-full bg-slate-200" />
          </div>
          <div className="h-10 w-40 rounded-xl bg-slate-200" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SkeletonPanel />
        <SkeletonPanel />
      </div>
    </div>
  )
}
