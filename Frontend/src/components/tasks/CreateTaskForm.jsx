import { useState } from 'react'

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

export default function CreateTaskForm({ onCancel }) {
  const [formValues, setFormValues] = useState({
    project: '',
    title: '',
    description: '',
    assignee: '',
    priority: '',
    status: '',
    dueDate: '',
  })
  const [errors, setErrors] = useState({})

  const updateField = (event) => {
    const { name, value } = event.target

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
      form: '',
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = {}

    if (!formValues.project) {
      nextErrors.project = 'Select a project.'
    }

    if (!formValues.title.trim()) {
      nextErrors.title = 'Task title is required.'
    }

    if (!formValues.description.trim()) {
      nextErrors.description = 'Description is required.'
    }

    if (!formValues.assignee) {
      nextErrors.assignee = 'Select an assignee.'
    }

    if (!formValues.priority) {
      nextErrors.priority = 'Select a priority.'
    }

    if (!formValues.status) {
      nextErrors.status = 'Select a status.'
    }

    if (!formValues.dueDate) {
      nextErrors.dueDate = 'Select a due date.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      return
    }

    setErrors({
      form: 'Task API is not connected yet. This screen is frontend-only for now.',
    })
  }

  const inputClassName =
    'mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10'
  const selectClassName = `${inputClassName} appearance-none bg-[linear-gradient(45deg,transparent_50%,#64748b_50%),linear-gradient(135deg,#64748b_50%,transparent_50%)] bg-[length:5px_5px,5px_5px] bg-[position:calc(100%-18px)_50%,calc(100%-13px)_50%] bg-no-repeat pr-10`

  return (
    <form
      className="max-w-[520px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-7"
      onSubmit={handleSubmit}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-2xl font-extrabold text-slate-900">Create New Task</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Create a new task.</p>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4b36f4]"
          >
            Back
          </button>
        ) : null}
      </div>

      {errors.form ? (
        <p className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
          {errors.form}
        </p>
      ) : null}

      <div className="mt-5 grid gap-5">
        <div>
          <label htmlFor="taskProject" className="text-sm font-extrabold text-slate-800">
            Project
          </label>
          <select
            id="taskProject"
            name="project"
            value={formValues.project}
            onChange={updateField}
            className={selectClassName}
          >
            <option value="">Select project</option>
          </select>
          <FieldError>{errors.project}</FieldError>
        </div>

        <div>
          <label htmlFor="taskTitle" className="text-sm font-extrabold text-slate-800">
            Title
          </label>
          <input
            id="taskTitle"
            name="title"
            type="text"
            value={formValues.title}
            onChange={updateField}
            placeholder="Enter task title"
            autoComplete="off"
            className={inputClassName}
          />
          <FieldError>{errors.title}</FieldError>
        </div>

        <div>
          <label htmlFor="taskDescription" className="text-sm font-extrabold text-slate-800">
            Description
          </label>
          <textarea
            id="taskDescription"
            name="description"
            value={formValues.description}
            onChange={updateField}
            placeholder="Enter task description"
            rows={5}
            className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
          />
          <FieldError>{errors.description}</FieldError>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="taskAssignee" className="text-sm font-extrabold text-slate-800">
              Assignee
            </label>
            <select
              id="taskAssignee"
              name="assignee"
              value={formValues.assignee}
              onChange={updateField}
              className={selectClassName}
            >
              <option value="">Select assignee</option>
            </select>
            <FieldError>{errors.assignee}</FieldError>
          </div>

          <div>
            <label htmlFor="taskPriority" className="text-sm font-extrabold text-slate-800">
              Priority
            </label>
            <select
              id="taskPriority"
              name="priority"
              value={formValues.priority}
              onChange={updateField}
              className={selectClassName}
            >
              <option value="">Select priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <FieldError>{errors.priority}</FieldError>
          </div>

          <div>
            <label htmlFor="taskStatus" className="text-sm font-extrabold text-slate-800">
              Status
            </label>
            <select
              id="taskStatus"
              name="status"
              value={formValues.status}
              onChange={updateField}
              className={selectClassName}
            >
              <option value="">Select status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <FieldError>{errors.status}</FieldError>
          </div>
        </div>

        <div>
          <label htmlFor="taskDueDate" className="text-sm font-extrabold text-slate-800">
            Due Date
          </label>
          <div className="relative mt-2">
            <input
              id="taskDueDate"
              name="dueDate"
              type="date"
              value={formValues.dueDate}
              onChange={updateField}
              className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
              <CalendarIcon />
            </span>
          </div>
          <FieldError>{errors.dueDate}</FieldError>
        </div>
      </div>

      <div className="mt-7 flex justify-end">
        <button
          type="submit"
          className="min-h-12 w-full rounded-lg bg-linear-to-r from-[#4b36f4] to-[#3827d9] px-8 text-base font-extrabold text-white shadow-[0_12px_24px_rgba(64,48,232,0.2)] transition hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(64,48,232,0.26)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#4b36f4]/30 sm:w-[210px]"
        >
          Create Task
        </button>
      </div>
    </form>
  )
}
