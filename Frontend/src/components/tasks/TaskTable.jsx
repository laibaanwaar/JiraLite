import TaskPriorityBadge from './TaskPriorityBadge.jsx'
import TaskStatusBadge from './TaskStatusBadge.jsx'
import { canManageTask, canUpdateAssignedTask } from './taskPermissions.js'

function getInitials(assignee) {
  const first = assignee?.first_name?.charAt(0) || ''
  const last = assignee?.last_name?.charAt(0) || ''
  return `${first}${last}`.toUpperCase() || 'NA'
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M6.5 17.5 4 20V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5V15a2.5 2.5 0 0 1-2.5 2.5h-11Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export default function TaskTable({
  commentCounts = {},
  currentPage = 1,
  onComments,
  onDelete,
  onEdit,
  onUpdateStatus,
  onView,
  pageSize = 10,
  tasks,
  userId,
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="overflow-x-auto">
        <table className="min-w-[1020px] w-full text-left">
          <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-4">#</th>
              <th className="px-5 py-4">Task Title</th>
              <th className="px-5 py-4">Project</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Priority</th>
              <th className="px-5 py-4">Assignee</th>
              <th className="px-5 py-4">Due Date</th>
              <th className="px-5 py-4">Comments</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => {
              const isAssignedToCurrentUser = canUpdateAssignedTask(task, userId)
              const isManager = canManageTask(task)
              const rowNumber = (currentPage - 1) * pageSize + index + 1
              const projectName = task.projectName || task?.project?.name || 'Unknown project'
              const assignee = task.assignee || {}
              const assigneeName =
                task.assigneeName ||
                [assignee.first_name, assignee.last_name].filter(Boolean).join(' ') ||
                'Unassigned'
              const assigneeEmail = task.assigneeEmail || assignee.email || ''
              const dueDate = task.dueDate || task.due_date || 'No due date'
              const commentCount = commentCounts[task.id] ?? task.comment_count ?? task.comments_count ?? 0

              return (
                <tr key={task.id} className="border-t border-slate-100 align-middle">
                  <td
                    className="cursor-pointer px-5 py-4 text-sm font-bold text-slate-500"
                    onClick={() => onView(task)}
                  >
                    {rowNumber}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => onView(task)}
                      className="m-0 text-left text-sm font-extrabold text-slate-900 transition hover:text-[#4b36f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
                    >
                      {task.title}
                    </button>
                  </td>
                  <td className="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-600" onClick={() => onView(task)}>{projectName}</td>
                  <td
                    className="cursor-pointer px-5 py-4"
                    onClick={() => (isAssignedToCurrentUser ? onUpdateStatus?.(task) : onView?.(task))}
                  >
                    <TaskStatusBadge status={task.status} />
                  </td>
                  <td className="cursor-pointer px-5 py-4" onClick={() => onView(task)}><TaskPriorityBadge priority={task.priority} /></td>
                  <td className="cursor-pointer px-5 py-4" onClick={() => onView(task)}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef0ff] text-xs font-extrabold text-[#4030e8]">
                        {getInitials(assignee)}
                      </div>
                      <div>
                        <p className="m-0 text-sm font-bold text-slate-900">
                          {assigneeName}
                        </p>
                        <p className="m-0 text-xs font-semibold text-slate-500">{assigneeEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-600" onClick={() => onView(task)}>{dueDate}</td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => onComments?.(task)}
                      className="inline-flex min-h-10 min-w-14 items-center justify-center gap-2 rounded-lg border border-[#d8d2ff] bg-white px-3 text-sm font-black text-[#4b36f4] transition hover:bg-[#f3f1ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
                      aria-label={`View ${commentCount} comments for ${task.title}`}
                    >
                      <CommentIcon />
                      {commentCount}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onView(task)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
                      >
                        View
                      </button>
                      {/* Update Status handled by clicking the status badge for assignees */}
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
