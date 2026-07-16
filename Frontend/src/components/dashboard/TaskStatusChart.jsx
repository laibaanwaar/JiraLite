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
  const emptyChartItems = [
    { label: 'To Do', count: 1, color: getChartStatusColor('TO_DO') },
    { label: 'In Progress', count: 1, color: getChartStatusColor('IN_PROGRESS') },
    { label: 'In Review', count: 1, color: getChartStatusColor('IN_REVIEW') },
    { label: 'Done', count: 1, color: getChartStatusColor('DONE') },
  ]

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <h2 className="text-[18px] font-extrabold text-slate-900">Tasks Overview</h2>
      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr] lg:items-center">
        <div className="relative h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={hasData ? chartItems : emptyChartItems}
                dataKey="count"
                innerRadius={68}
                outerRadius={106}
                paddingAngle={1}
                strokeWidth={0}
              >
                {(hasData ? chartItems : emptyChartItems).map((item) => (
                  <Cell key={item.label} fill={item.color} fillOpacity={hasData ? 1 : 0.28} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black tracking-tight text-slate-900">{safeTotal}</span>
            <span className="mt-2 text-base font-medium text-slate-500">Total</span>
          </div>
        </div>

        <div className="space-y-5">
          {chartItems.map((item) => (
            <div key={item.status || item.label} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
                <span className="text-[15px] font-medium text-slate-700">{item.label}</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900">{item.count}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
