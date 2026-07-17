import { useEffect, useMemo, useState } from 'react'
import useProjectMembers from '../../hooks/useProjectMembers.js'
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from './taskMeta.js'

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M7.5 4.5v3M16.5 4.5v3M5 9h14M5.5 6.5h13v12h-13v-12Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function FieldError({ children }) {
  if (!children) {
    return null
  }

  return <p className="mt-1.5 text-xs font-semibold text-rose-600">{children}</p>
}

function normalizeTaskValues(initialValues) {
  return {
    project_id: initialValues?.project_id ? String(initialValues.project_id) : '',
    title: initialValues?.title || '',
    description: initialValues?.description || '',
    assignee_id: initialValues?.assignee_id ? String(initialValues.assignee_id) : '',
    priority: initialValues?.priority || '',
    status: initialValues?.status || 'TO_DO',
    due_date: initialValues?.due_date || '',
  }
}

function getFieldError(errors, fieldName) {
  const value = errors?.[fieldName]
  if (Array.isArray(value)) {
    return value.find(Boolean) || ''
  }

  return typeof value === 'string' ? value : ''
}

function validateTask(values, members, requiresProject = true, readOnlyStatusOnly = false) {
  const nextErrors = {}
  const today = '2026-07-16'
  const normalizedTitle = values.title.trim()
  const normalizedDescription = values.description.trim()

  if (requiresProject && !values.project_id) {
    nextErrors.project_id = 'Select a project.'
  }

  if (!normalizedTitle) {
    nextErrors.title = 'Task title is required.'
  } else if (normalizedTitle.length > 200) {
    nextErrors.title = 'Title must be 200 characters or less.'
  }

  if (normalizedDescription.length > 5000) {
    nextErrors.description = 'Description must be 5000 characters or less.'
  }

  if (!readOnlyStatusOnly) {
    if (!values.assignee_id) {
      nextErrors.assignee_id = 'Select an assignee.'
    } else if (!members.some((member) => String(member.id || member.project_member_id) === values.assignee_id)) {
      nextErrors.assignee_id = 'Select a valid assignee from this project.'
    }

    if (!TASK_PRIORITY_OPTIONS.some((option) => option.value === values.priority)) {
      nextErrors.priority = 'Select a valid priority.'
    }

    if (values.due_date) {
      const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(values.due_date)

      if (!isValidDate) {
        nextErrors.due_date = 'Use YYYY-MM-DD format.'
      } else if (values.due_date < today) {
        nextErrors.due_date = 'Due date cannot be in the past.'
      }
    }
  }

  if (!TASK_STATUS_OPTIONS.some((option) => option.value === values.status)) {
    nextErrors.status = 'Select a valid status.'
  }

  return nextErrors
}

export default function TaskForm({
  backLabel = 'Back',
  backendErrors = {},
  initialValues,
  isSubmitting,
  onCancel,
  onSubmit,
  projects,
  readOnlyStatusOnly = false,
  requiresProject = true,
  submitLabel = 'Create Task',
  submitLoadingLabel = 'Creating Task...',
  title = 'Create New Task',
}) {
  const [formValues, setFormValues] = useState(() => normalizeTaskValues(initialValues))
  const [clientErrors, setClientErrors] = useState({})
  const { errorMessage: membersError, isLoading: isLoadingMembers, members } = useProjectMembers(formValues.project_id)

  useEffect(() => {
    setFormValues(normalizeTaskValues(initialValues))
    setClientErrors({})
  }, [initialValues])

  const activeMembers = useMemo(() => {
    return members.filter((member) => member?.is_active !== false && member?.user?.is_active !== false)
  }, [members])

  useEffect(() => {
    if (!formValues.assignee_id) {
      return
    }

    const stillExists = activeMembers.some(
      (member) => String(member.id || member.project_member_id) === formValues.assignee_id,
    )

    if (!stillExists) {
      setFormValues((current) => ({
        ...current,
        assignee_id: '',
      }))
    }
  }, [activeMembers, formValues.assignee_id])

  const fieldErrors = {
    ...backendErrors,
    ...clientErrors,
  }
  const assigneeError = getFieldError(fieldErrors, 'assignee_id') || membersError

  const inputClassName =
    'mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10'
  const selectClassName = `${inputClassName} appearance-none bg-[linear-gradient(45deg,transparent_50%,#64748b_50%),linear-gradient(135deg,#64748b_50%,transparent_50%)] bg-[length:5px_5px,5px_5px] bg-[position:calc(100%-18px)_50%,calc(100%-13px)_50%] bg-no-repeat pr-10`

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormValues((currentValues) => {
      const nextValues = {
        ...currentValues,
        [name]: value,
      }

      if (name === 'project_id') {
        nextValues.assignee_id = ''
      }

      return nextValues
    })

    setClientErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedValues = {
      ...formValues,
      title: formValues.title.trim(),
      description: formValues.description.trim(),
    }

    const validationErrors = validateTask(trimmedValues, activeMembers, requiresProject, readOnlyStatusOnly)
    setClientErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    await onSubmit(trimmedValues)
  }

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-7"
      onSubmit={handleSubmit}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-2xl font-extrabold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Complete the task details below.</p>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
          >
            {backLabel}
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-5">
        {requiresProject ? (
          <div>
            <label htmlFor="taskProject" className="text-sm font-extrabold text-slate-800">
              Project <span className="text-rose-500">*</span>
            </label>
            <select
              id="taskProject"
              name="project_id"
              value={formValues.project_id}
              onChange={handleChange}
              className={selectClassName}
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <FieldError>{getFieldError(fieldErrors, 'project_id')}</FieldError>
          </div>
        ) : null}

        <div>
          <label htmlFor="taskTitle" className="text-sm font-extrabold text-slate-800">
            Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="taskTitle"
            name="title"
            type="text"
            value={formValues.title}
            onChange={handleChange}
            disabled={readOnlyStatusOnly}
            placeholder="Enter task title"
            autoComplete="off"
            maxLength={200}
            className={inputClassName}
          />
          <FieldError>{getFieldError(fieldErrors, 'title')}</FieldError>
        </div>

        <div>
          <label htmlFor="taskDescription" className="text-sm font-extrabold text-slate-800">
            Description
          </label>
          <textarea
            id="taskDescription"
            name="description"
            value={formValues.description}
            onChange={handleChange}
            disabled={readOnlyStatusOnly}
            placeholder="Enter task description"
            rows={5}
            maxLength={5000}
            className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
          />
          <div className="flex items-center justify-between gap-3">
            <FieldError>{getFieldError(fieldErrors, 'description')}</FieldError>
            <span className="text-xs font-semibold text-slate-400">{formValues.description.length}/5000</span>
          </div>
        </div>

        <div className={`grid gap-4 ${readOnlyStatusOnly ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
          {!readOnlyStatusOnly ? (
            <>
              <div>
            <label htmlFor="taskAssignee" className="text-sm font-extrabold text-slate-800">
              Assignee <span className="text-rose-500">*</span>
            </label>
            <select
              id="taskAssignee"
              name="assignee_id"
              value={formValues.assignee_id}
              onChange={handleChange}
              disabled={readOnlyStatusOnly || !formValues.project_id || isLoadingMembers}
              className={selectClassName}
            >
              <option value="">
                {!formValues.project_id ? 'Select project first' : isLoadingMembers ? 'Loading members...' : 'Select assignee'}
              </option>
              {activeMembers.map((member) => {
                const memberId = member.id || member.project_member_id
                const firstName = member.first_name || member.user?.first_name || ''
                const lastName = member.last_name || member.user?.last_name || ''
                const email = member.email || member.user?.email || ''

                return (
                  <option key={memberId} value={memberId}>
                    {[firstName, lastName].filter(Boolean).join(' ')}{email ? ` - ${email}` : ''}
                  </option>
                )
              })}
            </select>
            <FieldError>{assigneeError}</FieldError>
              </div>

              <div>
            <label htmlFor="taskPriority" className="text-sm font-extrabold text-slate-800">
              Priority <span className="text-rose-500">*</span>
            </label>
            <select
              id="taskPriority"
              name="priority"
              value={formValues.priority}
              onChange={handleChange}
              disabled={readOnlyStatusOnly}
              className={selectClassName}
            >
              <option value="">Select priority</option>
              {TASK_PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError>{getFieldError(fieldErrors, 'priority')}</FieldError>
              </div>
            </>
          ) : null}

          <div>
            <label htmlFor="taskStatus" className="text-sm font-extrabold text-slate-800">
              Status <span className="text-rose-500">*</span>
            </label>
            <select
              id="taskStatus"
              name="status"
              value={formValues.status}
              onChange={handleChange}
              className={selectClassName}
            >
              {TASK_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError>{getFieldError(fieldErrors, 'status')}</FieldError>
          </div>
        </div>

        <div>
          <label htmlFor="taskDueDate" className="text-sm font-extrabold text-slate-800">
            Due Date
          </label>
          {!readOnlyStatusOnly ? (
            <div className="relative mt-2">
              <input
                id="taskDueDate"
                name="due_date"
                type="date"
                min="2026-07-16"
                value={formValues.due_date}
                onChange={handleChange}
                disabled={readOnlyStatusOnly}
                className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                <CalendarIcon />
              </span>
            </div>
          ) : null}
          <FieldError>{getFieldError(fieldErrors, 'due_date')}</FieldError>
        </div>
      </div>

      <div className="mt-7 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="min-h-12 w-full rounded-lg bg-linear-to-r from-[#4b36f4] to-[#3827d9] px-8 text-base font-extrabold text-white shadow-[0_12px_24px_rgba(64,48,232,0.2)] transition hover:enabled:-translate-y-px hover:enabled:shadow-[0_16px_28px_rgba(64,48,232,0.26)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#4b36f4]/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-[220px]"
        >
          {isSubmitting ? submitLoadingLabel : submitLabel}
        </button>
      </div>
    </form>
  )
}
