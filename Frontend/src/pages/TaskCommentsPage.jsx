import AppShell from '../components/layout/AppShell.jsx'

function CommentBadge() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-[#4b36f4] to-[#3827d9] text-lg font-extrabold text-white shadow-[0_12px_28px_rgba(64,48,232,0.24)]">
      7
    </div>
  )
}

function PlaceholderLine({ className = '' }) {
  return <div className={`rounded-full bg-slate-100 ${className}`} aria-hidden="true" />
}

export default function TaskCommentsPage() {
  return (
    <AppShell activePath="/task-comment">
          <section aria-labelledby="task-comments-title">
            <div className="flex items-start gap-4">
              <CommentBadge />
              <div className="min-w-0">
                <h1 id="task-comments-title" className="m-0 text-3xl font-extrabold uppercase tracking-wide text-[#4030e8]">
                  Task Comments
                </h1>
                <p className="mt-2 text-base font-semibold text-slate-500">
                  View and add comments on a task.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-7">
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#4b36f4] transition hover:text-[#3827d9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M19.5 12h-15m0 0 6-6m-6 6 6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back to Tasks
              </button>

              <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-4">
                  <PlaceholderLine className="h-8 w-72 max-w-full" />
                  <div className="flex flex-wrap gap-3">
                    <PlaceholderLine className="h-8 w-36" />
                    <PlaceholderLine className="h-8 w-40" />
                    <PlaceholderLine className="h-8 w-32" />
                    <PlaceholderLine className="h-8 w-28" />
                  </div>
                </div>
                <PlaceholderLine className="h-9 w-28" />
              </div>

              <div className="mt-8">
                <PlaceholderLine className="h-6 w-32" />

                <div className="mt-5 space-y-5">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-slate-100" aria-hidden="true" />
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <PlaceholderLine className="h-5 w-32" />
                            <PlaceholderLine className="h-4 w-28" />
                          </div>
                          <PlaceholderLine className="h-4 w-full" />
                          <PlaceholderLine className="h-4 w-3/4" />
                        </div>
                        <PlaceholderLine className="h-6 w-6 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <PlaceholderLine className="h-6 w-36" />
                <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                  <div className="min-h-[140px] rounded-xl bg-slate-50" aria-hidden="true" />
                  <div className="mt-4 flex justify-end">
                    <div className="h-12 w-40 rounded-xl bg-linear-to-r from-[#4b36f4] to-[#3827d9]" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          </section>
    </AppShell>
  )
}
