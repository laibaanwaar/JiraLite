import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../../hooks/useTasks'

function FieldLabel({ htmlFor, children, required = false }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-base font-semibold text-slate-800">
      {children}
      {required ? <span className="ml-1 text-red-500">*</span> : null}
    </label>
  )
}

function TextField({
  id,
  name,
  value,
  onChange,
  placeholder,
  disabled,
  type = 'text',
}) {
  return (
    <input
      id={id}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1f46b8] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
    />
  )
}

function SelectField({ id, name, value, onChange, disabled, placeholder, options }) {
  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-12 w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-[#1f46b8] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={`${name}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
        <ChevronDownIcon />
      </span>
    </div>
  )
}

function TextAreaField({ id, name, value, onChange, placeholder, disabled }) {
  return (
    <textarea
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows="4"
      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1f46b8] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
    />
  )
}

function CreateTaskModal({
  isOpen,
  formData,
  projectOptions,
  assigneeOptions,
  assigneeError,
  onClose,
  onChange,
  onSubmit,
  isSubmitting,
  isUsersLoading,
  errorMessage,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl shadow-slate-900/15">
        <div className="flex items-center justify-between px-6 pb-4 pt-5 sm:px-8">
          <h2 className="text-[2rem] font-bold tracking-tight text-slate-900">Create Task</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 px-6 pb-6 sm:px-8 sm:pb-8">
          <div>
            <FieldLabel htmlFor="title" required>
              Title
            </FieldLabel>
            <TextField
              id="title"
              name="title"
              value={formData.title}
              onChange={onChange}
              placeholder="Enter task title"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <FieldLabel htmlFor="project" required>
              Project
            </FieldLabel>
            <SelectField
              id="project"
              name="project"
              value={formData.project}
              onChange={onChange}
              disabled={isSubmitting}
              placeholder="Select project"
              options={projectOptions}
            />
          </div>

          <div>
            <FieldLabel htmlFor="assignedTo" required>
              Assigned To
            </FieldLabel>
            <SelectField
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={onChange}
              disabled={isSubmitting || isUsersLoading || !formData.project}
              placeholder={
                !formData.project
                  ? 'Select project first'
                  : isUsersLoading
                    ? 'Loading users...'
                    : 'Select user'
              }
              options={assigneeOptions}
            />
            {assigneeError ? <p className="mt-2 text-sm font-medium text-red-600">{assigneeError}</p> : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="priority" required>
                Priority
              </FieldLabel>
              <SelectField
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={onChange}
                disabled={isSubmitting}
                placeholder="Select priority"
                options={TASK_PRIORITY_OPTIONS}
              />
            </div>

            <div>
              <FieldLabel htmlFor="status" required>
                Status
              </FieldLabel>
              <SelectField
                id="status"
                name="status"
                value={formData.status}
                onChange={onChange}
                disabled={isSubmitting}
                placeholder="Select status"
                options={TASK_STATUS_OPTIONS}
              />
            </div>
          </div>

          <div className="max-w-[17.5rem]">
            <FieldLabel htmlFor="dueDate" required>
              Due Date
            </FieldLabel>
            <TextField
              id="dueDate"
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={onChange}
              placeholder="Select due date"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <TextAreaField
              id="description"
              name="description"
              value={formData.description}
              onChange={onChange}
              placeholder="Enter task description (optional)"
              disabled={isSubmitting}
            />
          </div>

          {errorMessage ? <p className="text-sm font-medium text-red-600">{errorMessage}</p> : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 px-6 text-base font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-[#1f46b8] px-6 text-base font-semibold text-white transition hover:bg-[#1a3c9f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path d="m5.5 7.5 4.5 4.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
    </svg>
  )
}

export default CreateTaskModal
