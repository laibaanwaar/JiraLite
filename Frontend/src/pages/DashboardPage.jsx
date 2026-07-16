import AppShell from '../components/layout/AppShell.jsx'

function SectionCard({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] ${className}`}>
      {children}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AppShell activePath="/dashboard">
          <section aria-labelledby="dashboard-title">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
              <div className="space-y-3">
                <div className="h-8 w-56 rounded-lg bg-slate-100" aria-hidden="true" />
                <div className="h-5 w-72 rounded-lg bg-slate-100" aria-hidden="true" />
              </div>
              <div className="h-10 w-40 self-start rounded-xl bg-slate-100" aria-hidden="true" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SectionCard className="p-5">
                <div className="space-y-4">
                  <div className="h-4 w-24 rounded bg-slate-100" aria-hidden="true" />
                  <div className="h-12 w-full rounded-xl bg-slate-100" aria-hidden="true" />
                </div>
              </SectionCard>
              <SectionCard className="p-5">
                <div className="space-y-4">
                  <div className="h-4 w-24 rounded bg-slate-100" aria-hidden="true" />
                  <div className="h-12 w-full rounded-xl bg-slate-100" aria-hidden="true" />
                </div>
              </SectionCard>
              <SectionCard className="p-5">
                <div className="space-y-4">
                  <div className="h-4 w-24 rounded bg-slate-100" aria-hidden="true" />
                  <div className="h-12 w-full rounded-xl bg-slate-100" aria-hidden="true" />
                </div>
              </SectionCard>
              <SectionCard className="p-5">
                <div className="space-y-4">
                  <div className="h-4 w-24 rounded bg-slate-100" aria-hidden="true" />
                  <div className="h-12 w-full rounded-xl bg-slate-100" aria-hidden="true" />
                </div>
              </SectionCard>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
              <SectionCard className="p-5">
                <div className="space-y-5">
                  <div className="h-5 w-32 rounded bg-slate-100" aria-hidden="true" />
                  <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                    <div className="h-[220px] rounded-2xl bg-slate-100" aria-hidden="true" />
                    <div className="space-y-4">
                      <div className="h-10 rounded-xl bg-slate-100" aria-hidden="true" />
                      <div className="h-10 rounded-xl bg-slate-100" aria-hidden="true" />
                      <div className="h-10 rounded-xl bg-slate-100" aria-hidden="true" />
                      <div className="h-10 rounded-xl bg-slate-100" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard className="p-5">
                <div className="space-y-5">
                  <div className="h-5 w-32 rounded bg-slate-100" aria-hidden="true" />
                  <div className="flex h-[220px] items-end justify-between gap-4">
                    <div className="h-40 flex-1 rounded-2xl bg-slate-100" aria-hidden="true" />
                    <div className="h-52 flex-1 rounded-2xl bg-slate-100" aria-hidden="true" />
                    <div className="h-32 flex-1 rounded-2xl bg-slate-100" aria-hidden="true" />
                    <div className="h-44 flex-1 rounded-2xl bg-slate-100" aria-hidden="true" />
                  </div>
                </div>
              </SectionCard>
            </div>

            <SectionCard className="mt-6 p-5">
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="h-5 w-36 rounded bg-slate-100" aria-hidden="true" />
                  <div className="h-5 w-28 rounded bg-slate-100" aria-hidden="true" />
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="space-y-4">
                      <div className="h-5 w-40 rounded bg-slate-100" aria-hidden="true" />
                      <div className="h-8 w-24 rounded-full bg-slate-100" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="space-y-4">
                      <div className="h-5 w-40 rounded bg-slate-100" aria-hidden="true" />
                      <div className="h-8 w-24 rounded-full bg-slate-100" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="space-y-4">
                      <div className="h-5 w-40 rounded bg-slate-100" aria-hidden="true" />
                      <div className="h-8 w-24 rounded-full bg-slate-100" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </section>
    </AppShell>
  )
}
