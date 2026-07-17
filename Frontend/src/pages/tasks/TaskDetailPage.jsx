import { useMemo, useState } from 'react'
import AppShell from '../../components/layout/AppShell.jsx'
import DeleteTaskModal from '../../components/tasks/DeleteTaskModal.jsx'
import TaskPriorityBadge from '../../components/tasks/TaskPriorityBadge.jsx'
import TaskStatusBadge from '../../components/tasks/TaskStatusBadge.jsx'
import { canManageTask, canUpdateAssignedTask } from '../../components/tasks/taskPermissions.js'
import useTask from '../../hooks/useTask.js'
import { getStoredUser } from '../../services/authService.js'

function navigateTo(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function TaskDetailPage({ taskId }) {
  const currentUser = useMemo(() => getStoredUser(), [])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { errorMessage, isDeleting, isLoading, removeTask, successMessage, task } = useTask(taskId)
  const isManager = canManageTask(task) || Boolean(task?.permissions?.canDelete || task?.permissions?.can_delete)
  const canUpdateStatusOnly = canUpdateAssignedTask(task, currentUser?.id)

  const handleDelete = async () => {
    const result = await removeTask()

    if (result.ok) {
      navigateTo('/tasks')
    }
  }

  return (
    <AppShell activePath="/tasks">
          <button
            type="button"
            onClick={() => navigateTo('/tasks')}
            className="mb-6 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
          >
            Back to Tasks
          </button>

          {isLoading ? <p className="text-sm font-semibold text-slate-500">Loading task...</p> : null}
          {successMessage ? <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{successMessage}</p> : null}
          {errorMessage ? <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{errorMessage}</p> : null}

          {task ? (
            <section className="max-w-[860px] rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="m-0 text-3xl font-extrabold text-slate-900">{task.title}</h1>
                  <p className="mt-2 text-sm font-semibold text-slate-500">Project: {task?.project?.name || 'Unknown project'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isManager ? (
                    <button type="button" onClick={() => navigateTo(`/tasks/${task.id}/edit`)} className="rounded-lg bg-[#4b36f4] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#3827d9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]">
                      Edit Task
                    </button>
                  ) : null}
                  {canUpdateStatusOnly ? (
                    <button type="button" onClick={() => navigateTo(`/tasks/${task.id}/edit`)} className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-extrabold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
                      Update Status
                    </button>
                  ) : null}
                  {isManager ? (
                    <button type="button" onClick={() => setShowDeleteModal(true)} className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-extrabold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500">
                      Delete Task
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} />
              </div>

              <dl className="mt-8 grid gap-5 md:grid-cols-2">
                <div>
                  <dt className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Description</dt>
                  <dd className="m-0 mt-2 text-sm font-semibold leading-7 text-slate-700">{task.description || 'No description provided.'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Assignee</dt>
                  <dd className="m-0 mt-2 text-sm font-semibold text-slate-700">
                    {[task?.assignee?.first_name, task?.assignee?.last_name].filter(Boolean).join(' ') || 'Unassigned'}
                    {task?.assignee?.email ? ` - ${task.assignee.email}` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Due Date</dt>
                  <dd className="m-0 mt-2 text-sm font-semibold text-slate-700">{task.due_date || 'No due date'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Created By</dt>
                  <dd className="m-0 mt-2 text-sm font-semibold text-slate-700">{[task?.created_by?.first_name, task?.created_by?.last_name].filter(Boolean).join(' ') || 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Created At</dt>
                  <dd className="m-0 mt-2 text-sm font-semibold text-slate-700">{task.created_at || 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Updated At</dt>
                  <dd className="m-0 mt-2 text-sm font-semibold text-slate-700">{task.updated_at || 'Unknown'}</dd>
                </div>
              </dl>

              {isManager ? (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-extrabold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                  >
                    Delete Task
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

      <DeleteTaskModal
        isDeleting={isDeleting}
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        taskTitle={task?.title || 'this task'}
      />
    </AppShell>
  )
}
