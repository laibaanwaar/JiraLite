function FieldLabel({ htmlFor, children, required = false }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-slate-800">
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
      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1f46b8] focus:ring-4 focus:ring-blue-100"
    />
  )
}

function TextAreaField({ id, name, value, onChange, placeholder }) {
  return (
    <textarea
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows="3"
      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1f46b8] focus:ring-4 focus:ring-blue-100"
    />
  )
}

function SelectField({ id, name, value, onChange, placeholder, options, disabled = false }) {
  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-[#1f46b8] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
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

function CreateProjectModal({
  isOpen,
  formData,
  ownerOptions,
  onClose,
  onChange,
  onSubmit,
  isSubmitting,
  errorMessage,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl shadow-slate-900/15">
        <div className="flex items-center justify-between px-6 pb-4 pt-5 sm:px-8">
          <h2 className="text-[1.85rem] font-bold tracking-tight text-slate-900">Create Project</h2>
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
            <FieldLabel htmlFor="addUser" required>
              Add User
            </FieldLabel>
            <TextField
              id="addUser"
              name="addUser"
              value={formData.addUser}
              onChange={onChange}
              placeholder="Enter user name or email"
            />
          </div>

          <div>
            <FieldLabel htmlFor="projectName" required>
              Project Name
            </FieldLabel>
            <TextField
              id="projectName"
              name="projectName"
              value={formData.projectName}
              onChange={onChange}
              placeholder="Enter project name"
            />
          </div>

          <div>
            <FieldLabel htmlFor="projectKey" required>
              Project Key
            </FieldLabel>
            <TextField
              id="projectKey"
              name="projectKey"
              value={formData.projectKey}
              onChange={onChange}
              placeholder="Enter project key"
            />
            <p className="mt-2 text-xs text-slate-400">Short, unique key (e.g., ALPHA)</p>
          </div>

          <div>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <TextAreaField
              id="description"
              name="description"
              value={formData.description}
              onChange={onChange}
              placeholder="Enter project description"
            />
          </div>

          <div>
            <FieldLabel htmlFor="projectOwner" required>
              Project Owner
            </FieldLabel>
            <SelectField
              id="projectOwner"
              name="projectOwner"
              value={formData.projectOwner}
              onChange={onChange}
              placeholder="Select project owner"
              options={ownerOptions}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="startDate">Start Date</FieldLabel>
              <TextField
                id="startDate"
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={onChange}
                placeholder="Select start date"
              />
              <p className="mt-2 text-xs text-slate-400">End date is optional</p>
            </div>

            <div>
              <FieldLabel htmlFor="endDate">End Date</FieldLabel>
              <TextField
                id="endDate"
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={onChange}
                placeholder="Select end date"
              />
            </div>
          </div>

          {errorMessage ? <p className="text-sm font-medium text-red-600">{errorMessage}</p> : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#2a65f5] px-6 text-sm font-semibold text-white transition hover:bg-[#2057de] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
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

export default CreateProjectModal
