import { useEffect, useState } from 'react'

const INITIAL_FORM_STATE = {
  name: '',
  code: '',
  description: '',
  isActive: true,
}

function CreateRoleModal({ isOpen, isSubmitting, onClose, onSubmit }) {
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSubmit(formState)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6 backdrop-blur-[2px]">
      <div className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl shadow-slate-900/20 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Create Role</h2>
            <p className="mt-1 text-sm text-slate-500">
              Define a workspace role and prepare its permissions for future API wiring.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close create role modal"
          >
            <CloseIcon />
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Role Name *" htmlFor="role-name">
              <input
                id="role-name"
                name="name"
                value={formState.name}
                onChange={handleChange}
                placeholder="Enter role name"
                className="h-12 w-full rounded-xl border border-slate-200 bg-[#fbfcff] px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#4f6ed8] focus:bg-white focus:ring-4 focus:ring-blue-100"
                required
              />
            </Field>

            <Field label="Role Code *" htmlFor="role-code">
              <input
                id="role-code"
                name="code"
                value={formState.code}
                onChange={handleChange}
                placeholder="Enter role code"
                className="h-12 w-full rounded-xl border border-slate-200 bg-[#fbfcff] px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#4f6ed8] focus:bg-white focus:ring-4 focus:ring-blue-100"
                required
              />
            </Field>
          </div>

          <Field label="Description" htmlFor="role-description">
            <textarea
              id="role-description"
              name="description"
              value={formState.description}
              onChange={handleChange}
              placeholder="Write a short description"
              rows="4"
              className="w-full rounded-xl border border-slate-200 bg-[#fbfcff] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#4f6ed8] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </Field>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-[#f8faff] px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Active Status</p>
              <p className="mt-1 text-xs text-slate-500">
                New roles can start active and be connected to permissions later.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggle}
              className={`relative inline-flex h-7 w-13 items-center rounded-full p-1 transition ${
                formState.isActive ? 'bg-[#3355c5]' : 'bg-slate-300'
              }`}
              aria-pressed={formState.isActive}
              aria-label="Toggle active status"
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
                  formState.isActive ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[#1f46b8] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#173792] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block space-y-2">
      <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
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

export default CreateRoleModal
