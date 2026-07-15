import { useEffect, useState } from 'react'

const INITIAL_FORM_STATE = {
  roleName: '',
  roleCode: '',
  description: '',
  isActive: true,
}

function CreateRoleForm({ isOpen, onClose }) {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE)

  useEffect(() => {
    if (!isOpen) {
      setFormState(INITIAL_FORM_STATE)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormState((currentState) => ({
      ...currentState,
      [name]: value,
    }))
  }

  const handleToggle = () => {
    setFormState((currentState) => ({
      ...currentState,
      isActive: !currentState.isActive,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 px-4 py-8 backdrop-blur-[2px]">
      <div className="w-full max-w-[34rem] rounded-2xl bg-white p-6 shadow-2xl shadow-slate-900/15">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[1.55rem] font-black tracking-tight text-slate-900">Create Role</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close create role form"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <CloseIcon />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <FormField label="Role Name" htmlFor="role-name" required>
            <input
              id="role-name"
              name="roleName"
              value={formState.roleName}
              onChange={handleChange}
              placeholder="Enter role name"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#5d65e8] focus:ring-4 focus:ring-[#e8ebff]"
            />
          </FormField>

          <FormField label="Role Code" htmlFor="role-code" required>
            <input
              id="role-code"
              name="roleCode"
              value={formState.roleCode}
              onChange={handleChange}
              placeholder="Enter role code (e.g. admin, engineer)"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#5d65e8] focus:ring-4 focus:ring-[#e8ebff]"
            />
          </FormField>

          <FormField label="Description" htmlFor="role-description">
            <div>
              <textarea
                id="role-description"
                name="description"
                value={formState.description}
                onChange={handleChange}
                placeholder="Enter role description (optional)"
                rows="4"
                maxLength="200"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#5d65e8] focus:ring-4 focus:ring-[#e8ebff]"
              />
              <p className="mt-1 text-right text-[11px] text-slate-400">{formState.description.length}/200</p>
            </div>
          </FormField>

          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-600">Status</p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggle}
                aria-pressed={formState.isActive}
                aria-label="Toggle role status"
                className={`relative inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${
                  formState.isActive ? 'bg-[#6956ea]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    formState.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-slate-700">
                {formState.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#5a46e8] px-4 text-sm font-semibold text-white transition hover:bg-[#4a37d4]"
            >
              Create Role
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({ label, htmlFor, required = false, children }) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
    </svg>
  )
}

export default CreateRoleForm
