import TaskPriorityBadge from './TaskPriorityBadge.jsx'
import TaskStatusBadge from './TaskStatusBadge.jsx'
import { canManageTask, canUpdateAssignedTask } from './taskPermissions.js'

function getInitials(assignee) {
  const first = assignee?.first_name?.charAt(0) || ''
  const last = assignee?.last_name?.charAt(0) || ''
  return `${first}${last}`.toUpperCase() || 'NA'
}

export default function TaskTable({ onDelete, onEdit, onUpdateStatus, onView, tasks, userId }) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full text-left">
          <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-4">#</th>
              <th className="px-5 py-4">Task Title</th>
              <th className="px-5 py-4">Project</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Priority</th>
              <th className="px-5 py-4">Assignee</th>
              <th className="px-5 py-4">Due Date</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => {
              const isAssignedToCurrentUser = canUpdateAssignedTask(task, userId)
              const isManager = canManageTask(task)

              return (
                <tr key={task.id} className="border-t border-slate-100 align-middle">
                  <td className="px-5 py-4 text-sm font-bold text-slate-500">{index + 1}</td>
                  <td className="px-5 py-4">
                    <p className="m-0 text-sm font-extrabold text-slate-900">{task.title}</p>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-600">{task?.project?.name || 'Unknown project'}</td>
                  <td className="px-5 py-4"><TaskStatusBadge status={task.status} /></td>
                  <td className="px-5 py-4"><TaskPriorityBadge priority={task.priority} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef0ff] text-xs font-extrabold text-[#4030e8]">
                        {getInitials(task.assignee)}
                      </div>
                      <div>
                        <p className="m-0 text-sm font-bold text-slate-900">
                          {[task?.assignee?.first_name, task?.assignee?.last_name].filter(Boolean).join(' ') || 'Unassigned'}
                        </p>
                        <p className="m-0 text-xs font-semibold text-slate-500">{task?.assignee?.email || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-600">{task.due_date || 'No due date'}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onView(task)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
                      >
                        View
                      </button>
                      {isAssignedToCurrentUser ? (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(task)}
                          className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                        >
                          Update Status
                        </button>
                      ) : null}
                      {isManager ? (
                        <button
                          type="button"
                          onClick={() => onEdit(task)}
                          className="rounded-lg border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                        >
                          Edit
                        </button>
                      ) : null}
                      {isManager ? (
                        <button
                          type="button"
                          onClick={() => onDelete(task)}
                          className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
