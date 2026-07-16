function SkeletonCard() {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-24 rounded-full bg-slate-200" />
        <div className="h-12 w-24 rounded-full bg-slate-200" />
        <div className="h-4 w-20 rounded-full bg-slate-200" />
      </div>
    </div>
  )
}

function SkeletonPanel({ className = '' }) {
  return (
    <div className={`rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)] ${className}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-36 rounded-full bg-slate-200" />
        <div className="h-52 rounded-[24px] bg-slate-100" />
      </div>
    </div>
  )
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse rounded-[30px]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-4">
            <div className="h-10 w-44 rounded-full bg-slate-200" />
            <div className="h-8 w-80 max-w-full rounded-full bg-slate-200" />
          </div>
          <div className="h-14 w-40 rounded-2xl bg-slate-200" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SkeletonPanel />
        <SkeletonPanel />
      </div>
    </div>
  )
}
