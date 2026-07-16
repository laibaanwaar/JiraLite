import { useEffect, useMemo, useState } from 'react'
import AppShell from '../../components/layout/AppShell.jsx'
import TaskForm from '../../components/tasks/TaskForm.jsx'
import { canManageTask, canUpdateAssignedTask } from '../../components/tasks/taskPermissions.js'
import useTask from '../../hooks/useTask.js'
import { getProjects } from '../../services/projectService.js'
import { getStoredUser } from '../../services/authService.js'

function navigateTo(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function EditTaskPage({ taskId }) {
  const currentUser = useMemo(() => getStoredUser(), [])
  const { errorMessage, fieldErrors, isLoading, isSaving, saveTask, successMessage, task } = useTask(taskId)
  const [projects, setProjects] = useState([])
  const isManager = canManageTask(task)
  const canUpdateStatusOnly = canUpdateAssignedTask(task, currentUser?.id) && !isManager

  useEffect(() => {
    const controller = new AbortController()

    getProjects({}, undefined, { signal: controller.signal })
      .then((response) => setProjects(response.results))
      .catch(() => {})

    return () => controller.abort()
  }, [])

  const handleSubmit = async (values) => {
    const payload = canUpdateStatusOnly
      ? {
          status: values.status,
        }
      : {
          title: values.title,
          description: values.description,
          assignee_id: Number(values.assignee_id),
          priority: values.priority,
          status: values.status,
          due_date: values.due_date || null,
        }

    const result = await saveTask(payload)

    if (result.ok) {
      navigateTo(`/tasks/${taskId}`)
    }
  }

  const initialValues = task
    ? {
        project_id: task?.project?.id,
        title: task.title,
        description: task.description,
        assignee_id: task?.assignee?.project_member_id,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
      }
    : null

  return (
    <AppShell activePath="/tasks">
          {isLoading ? <p className="text-sm font-semibold text-slate-500">Loading task...</p> : null}
          {successMessage ? <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{successMessage}</p> : null}
          {errorMessage ? <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{errorMessage}</p> : null}

          {task ? (
            <section className="max-w-[860px]">
              <TaskForm
                backLabel="Back to Task"
                backendErrors={fieldErrors}
                initialValues={initialValues}
                isSubmitting={isSaving}
                onCancel={() => navigateTo(`/tasks/${taskId}`)}
                onSubmit={handleSubmit}
                projects={projects}
                readOnlyStatusOnly={canUpdateStatusOnly}
                requiresProject={false}
                submitLabel={canUpdateStatusOnly ? 'Update Status' : 'Save Changes'}
                submitLoadingLabel={canUpdateStatusOnly ? 'Updating Task...' : 'Updating Task...'}
                title={canUpdateStatusOnly ? 'Update Task Status' : 'Edit Task'}
              />
            </section>
          ) : null}
    </AppShell>
  )
}
