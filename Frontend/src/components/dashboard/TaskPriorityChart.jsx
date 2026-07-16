import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { getPriorityColor, getSafeNumber } from './dashboardUtils.js'

export default function TaskPriorityChart({ items }) {
  const fallbackItems = [
    { priority: 'LOW', label: 'Low', count: 0 },
    { priority: 'MEDIUM', label: 'Medium', count: 0 },
    { priority: 'HIGH', label: 'High', count: 0 },
    { priority: 'URGENT', label: 'Urgent', count: 0 },
  ]
  const sourceItems = Array.isArray(items) && items.length > 0 ? items : fallbackItems
  const chartItems = sourceItems.map((item) => ({
    ...item,
    count: getSafeNumber(item?.count),
    fill: getPriorityColor(item?.priority),
  }))

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <h2 className="text-lg font-extrabold text-slate-900">Tasks by Priority</h2>
      <div className="mt-6 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartItems} barCategoryGap={28} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
            <Bar dataKey="count" radius={[12, 12, 12, 12]}>
              {chartItems.map((item) => (
                <Cell key={item.priority || item.label} fill={item.fill} />
              ))}
              <LabelList dataKey="count" position="top" fill="#0f172a" fontSize={13} fontWeight={800} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {chartItems.map((item) => (
          <div key={item.priority} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} aria-hidden="true" />
            {item.label}: {item.count}
          </div>
        ))}
      </div>
    </section>
  )
}
