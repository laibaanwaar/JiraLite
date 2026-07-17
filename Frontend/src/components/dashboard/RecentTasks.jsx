import TaskPriorityBadge from '../tasks/TaskPriorityBadge.jsx'
import TaskStatusBadge from '../tasks/TaskStatusBadge.jsx'
import { formatDisplayDate, getAssigneeName } from './dashboardUtils.js'
import { canManageTask, canUpdateAssignedTask } from '../tasks/taskPermissions.js'

export default function RecentTasks({ tasks, onTaskClick, onView, onEdit, onDelete, onUpdateStatus, userId }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-extrabold text-slate-900">Recent Tasks</h2>
      </div>

      {tasks.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
          No recent tasks available.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {tasks.map((task) => {
            const isAssignedToCurrentUser = canUpdateAssignedTask(task, userId)
            const isManager = canManageTask(task)

            return (
              <div
                key={task.id}
                className="flex w-full flex-col gap-2.5 rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-[#cfc8ff] hover:shadow-[0_12px_30px_rgba(75,54,244,0.08)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{task.title || 'Untitled Task'}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{task?.project?.name || 'No project'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-2">
                      <TaskStatusBadge status={task.status} />
                      <TaskPriorityBadge priority={task.priority} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onView?.(task)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        View
                      </button>
                      {isAssignedToCurrentUser ? (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus?.(task)}
                          className="rounded-lg border border-blue-100 px-2 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
                        >
                          Update Status
                        </button>
                      ) : null}
                      {isManager ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit?.(task)}
                            className="rounded-lg border border-violet-100 px-2 py-1 text-xs font-bold text-violet-700 transition hover:bg-violet-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete?.(task)}
                            className="rounded-lg border border-rose-100 px-2 py-1 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 text-sm font-semibold text-slate-500 sm:grid-cols-3">
                  <p>Assignee: <span className="text-slate-700">{getAssigneeName(task?.assignee)}</span></p>
                  <p>Due: <span className="text-slate-700">{formatDisplayDate(task?.due_date)}</span></p>
                  <p>Updated: <span className="text-slate-700">{formatDisplayDate(task?.updated_at)}</span></p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
