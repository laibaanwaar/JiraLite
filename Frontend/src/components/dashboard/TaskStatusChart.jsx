import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { calculatePercentage, getSafeNumber } from './dashboardUtils.js'

function getChartStatusColor(status) {
  if (status === 'TO_DO') {
    return '#2f6bff'
  }

  if (status === 'IN_PROGRESS') {
    return '#7c5cff'
  }

  if (status === 'IN_REVIEW') {
    return '#f8a11c'
  }

  if (status === 'DONE') {
    return '#35c98a'
  }

  return '#94a3b8'
}

export default function TaskStatusChart({ totalTasks, items }) {
  const safeTotal = getSafeNumber(totalTasks)
  const fallbackItems = [
    { status: 'TO_DO', label: 'To Do', count: 0 },
    { status: 'IN_PROGRESS', label: 'In Progress', count: 0 },
    { status: 'IN_REVIEW', label: 'In Review', count: 0 },
    { status: 'DONE', label: 'Done', count: 0 },
  ]
  const sourceItems = Array.isArray(items) && items.length > 0 ? items : fallbackItems
  const chartItems = sourceItems.map((item) => ({
    ...item,
    count: getSafeNumber(item?.count),
    color: getChartStatusColor(item?.status),
    percentage: calculatePercentage(item?.count, safeTotal),
  }))

  const hasData = chartItems.some((item) => item.count > 0)

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-extrabold text-slate-900">Tasks Overview</h2>
      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center">
        <div className="relative h-[240px] min-w-0">
          {hasData ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartItems}
                    dataKey="count"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={1}
                    strokeWidth={0}
                  >
                    {chartItems.map((item) => (
                      <Cell key={item.label} fill={item.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black tracking-tight text-slate-900">{safeTotal}</span>
                <span className="mt-1 text-sm font-medium text-slate-500">Total</span>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
              No task data available.
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-3">
          {chartItems.map((item) => (
            <div key={item.status || item.label} className="flex min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
                <span className="truncate text-sm font-medium text-slate-700">{item.label}</span>
              </div>
              <div className="shrink-0 text-sm font-extrabold text-slate-900">{item.count}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
