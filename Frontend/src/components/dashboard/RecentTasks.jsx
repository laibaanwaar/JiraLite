import TaskPriorityBadge from '../tasks/TaskPriorityBadge.jsx'
import TaskStatusBadge from '../tasks/TaskStatusBadge.jsx'
import { formatDisplayDate, getAssigneeName } from './dashboardUtils.js'

export default function RecentTasks({ tasks, onTaskClick }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-extrabold text-slate-900">Recent Tasks</h2>
      </div>

      {tasks.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm font-semibold text-slate-500">
          No recent tasks available.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onTaskClick(task)}
              className="flex w-full flex-col gap-3 rounded-[22px] border border-slate-200 px-4 py-4 text-left transition hover:border-[#cfc8ff] hover:shadow-[0_12px_30px_rgba(75,54,244,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{task.title || 'Untitled Task'}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{task?.project?.name || 'No project'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <TaskStatusBadge status={task.status} />
                  <TaskPriorityBadge priority={task.priority} />
                </div>
              </div>

              <div className="grid gap-3 text-sm font-semibold text-slate-500 sm:grid-cols-3">
                <p>Assignee: <span className="text-slate-700">{getAssigneeName(task?.assignee)}</span></p>
                <p>Due: <span className="text-slate-700">{formatDisplayDate(task?.due_date)}</span></p>
                <p>Updated: <span className="text-slate-700">{formatDisplayDate(task?.updated_at)}</span></p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
