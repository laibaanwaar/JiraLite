import { useMemo, useState } from 'react'
import FormInput from '../auth/FormInput.jsx'
import { normalizeInvitationError, sendProjectInvitation } from '../../services/invitationService.js'

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        d="M3.75 6.75h16.5v10.5H3.75V6.75Zm0 .75L12 13.5l8.25-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

function normalizeRoleOptions(roleOptions) {
  if (!Array.isArray(roleOptions)) {
    return []
  }

  return roleOptions
    .map((option) => {
      if (typeof option === 'string') {
        return { label: option, value: option }
      }

      if (!option) {
        return null
      }

      return {
        label: option.label || option.name || option.code || option.value,
        value: option.value || option.code || option.name || option.label,
      }
    })
    .filter((option) => option?.label && option?.value)
}

export default function InviteMemberForm({ canInvite, projectId, roleOptions = [] }) {
  const normalizedRoleOptions = useMemo(() => normalizeRoleOptions(roleOptions), [roleOptions])
  const [formValues, setFormValues] = useState({
    email: '',
    project_role: normalizedRoleOptions[0]?.value || '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [duplicateError, setDuplicateError] = useState('')
  const [memberError, setMemberError] = useState('')

  if (!canInvite) {
    return null
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
    }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!formValues.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!isValidEmail(formValues.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (normalizedRoleOptions.length > 0 && !formValues.project_role) {
      nextErrors.project_role = 'Select a project role.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')
    setDuplicateError('')
    setMemberError('')

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        email: formValues.email.trim(),
        ...(normalizedRoleOptions.length > 0 ? { project_role: formValues.project_role } : {}),
      }
      const response = await sendProjectInvitation(projectId, payload)

      setSubmitSuccess(response?.message || 'Invitation sent successfully.')
      setFormValues({
        email: '',
        project_role: normalizedRoleOptions[0]?.value || '',
      })
      setFieldErrors({})
    } catch (error) {
      const normalized = normalizeInvitationError(error, 'Unable to send the invitation right now.')

      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        email: normalized.fieldErrors.email || '',
        project_role: normalized.fieldErrors.project_role || normalized.fieldErrors.role || '',
      }))

      if (normalized.isDuplicate) {
        setDuplicateError(normalized.message)
        return
      }

      if (normalized.isAlreadyMember) {
        setMemberError(normalized.message)
        return
      }

      setSubmitError(normalized.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-xl font-black text-slate-900">Invite Member</h2>
        <p className="m-0 text-sm font-semibold text-slate-500">
          Send a project invitation to a teammate.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <FormInput
          id="inviteEmail"
          name="email"
          label="Email"
          type="email"
          value={formValues.email}
          onChange={handleChange}
          placeholder="teammate@example.com"
          autoComplete="email"
          icon={<MailIcon />}
          error={fieldErrors.email}
          required
        />

        {normalizedRoleOptions.length > 0 ? (
          <label className="flex flex-col gap-2.5" htmlFor="inviteProjectRole">
            <span className="text-[0.96rem] font-semibold text-slate-800">Project Role</span>
            <select
              id="inviteProjectRole"
              name="project_role"
              value={formValues.project_role}
              onChange={handleChange}
              className={`min-h-[58px] rounded-xl border bg-white px-4 py-3 text-slate-900 outline-none transition ${
                fieldErrors.project_role
                  ? 'border-rose-300 focus:border-rose-400'
                  : 'border-slate-300 focus:border-blue-500'
              }`}
            >
              {normalizedRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.project_role ? (
              <span className="text-sm font-semibold text-rose-600">{fieldErrors.project_role}</span>
            ) : null}
          </label>
        ) : null}
      </div>

      {submitError ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{submitError}</p> : null}
      {duplicateError ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{duplicateError}</p> : null}
      {memberError ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{memberError}</p> : null}
      {submitSuccess ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{submitSuccess}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#4b36f4] px-5 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(75,54,244,0.22)] transition hover:bg-[#3827d9] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
      </button>
    </form>
  )
}
