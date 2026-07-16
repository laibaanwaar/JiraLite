import TaskPriorityBadge from '../tasks/TaskPriorityBadge.jsx'
import TaskStatusBadge from '../tasks/TaskStatusBadge.jsx'
import { formatDisplayDate, getAssigneeName, isToday } from './dashboardUtils.js'

export default function UpcomingDeadlines({ items, onTaskClick }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-extrabold text-slate-900">Upcoming Deadlines</h2>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm font-semibold text-slate-500">
          No upcoming deadlines.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <button
              key={`${item.task_id}-${item.due_date}`}
              type="button"
              onClick={() => onTaskClick(item)}
              className="flex w-full flex-col gap-3 rounded-[22px] border border-slate-200 px-4 py-4 text-left transition hover:border-[#cfc8ff] hover:shadow-[0_12px_30px_rgba(75,54,244,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">{item.title || 'Untitled Task'}</h3>
                    {isToday(item?.due_date) ? (
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-rose-700">
                        Due Today
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{item.project_name || 'No project'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <TaskStatusBadge status={item.status} />
                  <TaskPriorityBadge priority={item.priority} />
                </div>
              </div>

              <div className="grid gap-3 text-sm font-semibold text-slate-500 sm:grid-cols-2">
                <p>Assignee: <span className="text-slate-700">{getAssigneeName(item?.assignee)}</span></p>
                <p>Due: <span className="text-slate-700">{formatDisplayDate(item?.due_date)}</span></p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
