import { useState } from 'react'
import { createProject } from '../../services/projectService.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function UserPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M15 19a6 6 0 0 0-12 0M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="m7 7 10 10M17 7 7 17"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function FieldError({ children }) {
  if (!children) {
    return null
  }

  return <p className="mt-1.5 text-sm font-medium text-rose-600">{children}</p>
}

export default function CreateProjectForm() {
  const [formValues, setFormValues] = useState({
    name: '',
    invite_email: '',
    invite_emails: [],
    description: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [warningMessage, setWarningMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (event) => {
    const { name, value } = event.target

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
    }))
    setSuccessMessage('')
    setWarningMessage('')
  }

  const addInviteEmail = (rawEmail) => {
    const normalizedEmail = rawEmail.trim().toLowerCase()

    if (!normalizedEmail) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        invite_email: 'Enter an email address.',
      }))
      return false
    }

    if (!emailPattern.test(normalizedEmail)) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        invite_email: 'Enter a valid email address.',
      }))
      return false
    }

    if (formValues.invite_emails.includes(normalizedEmail)) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        invite_email: 'This email has already been added.',
      }))
      return false
    }

    if (formValues.invite_emails.length >= 20) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        invite_email: 'You can invite up to 20 users.',
      }))
      return false
    }

    setFormValues((currentValues) => ({
      ...currentValues,
      invite_email: '',
      invite_emails: [...currentValues.invite_emails, normalizedEmail],
    }))
    setErrors((currentErrors) => ({
      ...currentErrors,
      invite_email: '',
    }))
    return true
  }

  const handleInviteEmailChange = (event) => {
    const { value } = event.target

    if (value.includes(',')) {
      const emailParts = value.split(',')
      const lastPart = emailParts.pop() || ''
      emailParts.forEach((email) => addInviteEmail(email))
      setFormValues((currentValues) => ({
        ...currentValues,
        invite_email: lastPart,
      }))
      return
    }

    updateField(event)
  }

  const handleInviteEmailKeyDown = (event) => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    addInviteEmail(formValues.invite_email)
  }

  const removeInviteEmail = (emailToRemove) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      invite_emails: currentValues.invite_emails.filter((email) => email !== emailToRemove),
    }))
  }

  const validateForm = () => {
    const nextErrors = {}
    const projectName = formValues.name.trim()
    const description = formValues.description.trim()
    const message = formValues.message.trim()

    if (!projectName) {
      nextErrors.name = 'Project name is required.'
    } else if (projectName.length > 150) {
      nextErrors.name = 'Project name must be 150 characters or less.'
    }

    if (formValues.invite_email.trim()) {
      const normalizedEmail = formValues.invite_email.trim().toLowerCase()

      if (!emailPattern.test(normalizedEmail)) {
        nextErrors.invite_email = 'Enter a valid email address.'
      } else if (formValues.invite_emails.includes(normalizedEmail)) {
        nextErrors.invite_email = 'This email has already been added.'
      } else if (formValues.invite_emails.length >= 20) {
        nextErrors.invite_email = 'You can invite up to 20 users.'
      }
    }

    if (!description) {
      nextErrors.description = 'Description is required.'
    } else if (description.length > 1000) {
      nextErrors.description = 'Description must be 1000 characters or less.'
    }

    if (message.length > 500) {
      nextErrors.message = 'Message must be 500 characters or less.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSuccessMessage('')
    setWarningMessage('')
    setErrors({})

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    const pendingEmail = formValues.invite_email.trim().toLowerCase()
    const inviteEmails =
      pendingEmail && emailPattern.test(pendingEmail) && !formValues.invite_emails.includes(pendingEmail)
        ? [...formValues.invite_emails, pendingEmail]
        : formValues.invite_emails

    const payload = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      invite_emails: inviteEmails,
      message: formValues.message.trim(),
    }

    createProject(payload)
      .then((response) => {
        const invitations = response?.data?.invitations || []
        const failedInvitations =
          response?.data?.failed_invitations ||
          invitations
            .filter((invitation) => invitation.email_status === 'FAILED')
            .map((invitation) => invitation.email)

        console.log('Create project payload:', payload)

        if (failedInvitations.length) {
          setSuccessMessage('Project created, but some invitations could not be sent.')
          setWarningMessage(
            `Invite email failed for: ${failedInvitations.join(', ')}. These users did not receive the invite email.`,
          )
        } else {
          setSuccessMessage(response?.message || 'Project created successfully.')
        }

        setFormValues({
          name: '',
          invite_email: '',
          invite_emails: [],
          description: '',
          message: '',
        })
      })
      .catch((error) => {
        const responseData = error?.response?.data
        const firstError =
          responseData?.message ||
          Object.values(responseData?.errors || {})
            .flat()
            .find(Boolean)

        setErrors((currentErrors) => ({
          ...currentErrors,
          form: firstError || 'Unable to create project right now.',
        }))
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  return (
    <form className="mt-8 max-w-[850px]" onSubmit={handleSubmit}>
      {successMessage ? (
        <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {successMessage}
        </p>
      ) : null}
      {warningMessage ? (
        <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {warningMessage}
        </p>
      ) : null}
      <FieldError>{errors.form}</FieldError>

      <div className="grid gap-7">
        <div>
          <label htmlFor="projectName" className="text-base font-extrabold text-slate-800">
            Project Name
          </label>
          <input
            id="projectName"
            name="name"
            type="text"
            value={formValues.name}
            onChange={updateField}
            placeholder="Enter project name"
            autoComplete="off"
            className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
            required
          />
          <FieldError>{errors.name}</FieldError>
        </div>

        <div>
          <label htmlFor="inviteEmail" className="text-base font-extrabold text-slate-800">
            Add User
          </label>
          <div className="relative mt-2">
            <input
              id="inviteEmail"
              name="invite_email"
              type="email"
              value={formValues.invite_email}
              onChange={handleInviteEmailChange}
              onKeyDown={handleInviteEmailKeyDown}
              placeholder="Enter email address"
              autoComplete="email"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
              <UserPlusIcon />
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-[#5a48ff]">
            Invite will be sent to added user.
          </p>
          <FieldError>{errors.invite_email}</FieldError>

          {formValues.invite_emails.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {formValues.invite_emails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-2 rounded-full bg-[#eef0ff] px-3 py-1.5 text-sm font-semibold text-[#4030e8]"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeInviteEmail(email)}
                    className="rounded-full p-0.5 transition hover:bg-[#dcd8ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4030e8]"
                    aria-label={`Remove ${email}`}
                  >
                    <XIcon />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <label htmlFor="projectDescription" className="text-base font-extrabold text-slate-800">
            Description
          </label>
          <textarea
            id="projectDescription"
            name="description"
            value={formValues.description}
            onChange={updateField}
            placeholder="Enter project description"
            rows={4}
            className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
            required
          />
          <FieldError>{errors.description}</FieldError>
        </div>

        <div>
          <label htmlFor="projectMessage" className="text-base font-extrabold text-slate-800">
            Message (Optional)
          </label>
          <textarea
            id="projectMessage"
            name="message"
            value={formValues.message}
            onChange={updateField}
            placeholder="Add a personal message to the user (invite will be sent)"
            rows={4}
            className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
          />
          <FieldError>{errors.message}</FieldError>
        </div>
      </div>

      <div className="mt-7 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-12 w-full rounded-lg bg-linear-to-r from-[#4b36f4] to-[#3827d9] px-8 text-base font-extrabold text-white shadow-[0_12px_24px_rgba(64,48,232,0.2)] transition hover:enabled:-translate-y-px hover:enabled:shadow-[0_16px_28px_rgba(64,48,232,0.26)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#4b36f4]/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-[300px]"
        >
          {isSubmitting ? 'Creating Project...' : 'Create Project'}
        </button>
      </div>
    </form>
  )
}
