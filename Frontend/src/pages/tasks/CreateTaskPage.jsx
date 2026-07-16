import { useEffect, useMemo, useState } from 'react'
import AppShell from '../../components/layout/AppShell.jsx'
import TaskForm from '../../components/tasks/TaskForm.jsx'
import { canCreateTask } from '../../components/tasks/taskPermissions.js'
import { getProjects } from '../../services/projectService.js'
import { createTask, normalizeTaskError } from '../../services/taskService.js'

function navigateTo(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function CreateTaskPage() {
  const [projects, setProjects] = useState([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [projectsLoadFailed, setProjectsLoadFailed] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoadingProjects(true)
    setProjectsLoadFailed(false)

    getProjects({}, undefined, { signal: controller.signal })
      .then((response) => {
        setProjects(response.results)
        setProjectsLoadFailed(false)
      })
      .catch((error) => {
        const normalized = normalizeTaskError(error)

        if (!normalized.canceled) {
          setProjects([])
          setProjectsLoadFailed(true)
          setErrorMessage('')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingProjects(false)
        }
      })

    return () => controller.abort()
  }, [])

  const creatableProjects = useMemo(() => {
    const projectsWithRoleMetadata = projects.filter(
      (project) =>
        project?.current_user_role ||
        project?.project_role ||
        project?.membership_role ||
        project?.role ||
        project?.project_membership?.role,
    )

    if (projectsWithRoleMetadata.length === 0) {
      return projects
    }

    return projects.filter(canCreateTask)
  }, [projects])

  const handleSubmit = async (values) => {
    setIsSubmitting(true)
    setErrorMessage('')
    setFieldErrors({})
    setSuccessMessage('')

    try {
      const response = await createTask(values.project_id, {
        title: values.title,
        description: values.description,
        assignee_id: Number(values.assignee_id),
        priority: values.priority,
        status: values.status,
        due_date: values.due_date || null,
      })

      setSuccessMessage(response.message || 'Task created successfully.')
      navigateTo(`/tasks/${response.task?.id || ''}`)
    } catch (error) {
      const normalized = normalizeTaskError(error)
      setErrorMessage(normalized.message)
      setFieldErrors(normalized.fieldErrors || {})
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell activePath="/tasks">
          <section aria-labelledby="create-task-title" className="max-w-[860px]">
            <div className="mb-6">
              <h1 id="create-task-title" className="m-0 text-3xl font-extrabold text-slate-900">Create Task</h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">Create a task for a project where you can manage work.</p>
            </div>

            {successMessage ? (
              <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">
                {successMessage}
              </p>
            ) : null}

            {errorMessage && !projectsLoadFailed ? (
              <p className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
                {errorMessage}
              </p>
            ) : null}

            {isLoadingProjects ? (
              <p className="text-sm font-semibold text-slate-500">Loading projects...</p>
            ) : projectsLoadFailed ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Unable to load your accessible projects for task creation right now. This screen depends on a working project list endpoint, such as `GET /api/projects/`.
              </p>
            ) : creatableProjects.length === 0 ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                No accessible projects were found for task creation.
              </p>
            ) : (
              <TaskForm
                backendErrors={fieldErrors}
                isSubmitting={isSubmitting}
                onCancel={() => navigateTo('/tasks')}
                onSubmit={handleSubmit}
                projects={creatableProjects}
              />
            )}
          </section>
    </AppShell>
  )
}
