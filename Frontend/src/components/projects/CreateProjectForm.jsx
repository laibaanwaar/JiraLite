import { useState } from 'react'
import EmailChipsInput from './EmailChipsInput.jsx'
import { validateInviteEmail } from './emailValidation.js'
import { createProject, normalizeProjectError } from '../../services/projectService.js'

function FieldError({ children }) {
  if (!children) {
    return null
  }

  return <p className="mt-1.5 text-sm font-medium text-rose-600">{children}</p>
}

function getFieldError(errors, key) {
  const value = errors?.[key]

  if (Array.isArray(value)) {
    return value.find(Boolean) || ''
  }

  return value || ''
}

function navigateToProjects() {
  window.history.pushState(
    {
      projectsNotice: 'Project created successfully.',
    },
    '',
    '/projects',
  )
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function CreateProjectForm() {
  const [formValues, setFormValues] = useState({
    name: '',
    emailInput: '',
    invite_emails: [],
    description: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
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
      form: '',
    }))
  }

  const addInviteEmail = (rawEmail) => {
    const result = validateInviteEmail(rawEmail, formValues.invite_emails)

    if (!result.ok) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        invite_emails: result.message,
        form: '',
      }))
      return false
    }

    setFormValues((currentValues) => ({
      ...currentValues,
      emailInput: '',
      invite_emails: [...currentValues.invite_emails, result.email],
    }))
    setErrors((currentErrors) => ({
      ...currentErrors,
      invite_emails: '',
      form: '',
    }))
    return true
  }

  const removeInviteEmail = (emailToRemove) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      invite_emails: currentValues.invite_emails.filter((email) => email !== emailToRemove),
    }))
    setErrors((currentErrors) => ({
      ...currentErrors,
      invite_emails: '',
    }))
  }

  const setEmailInput = (value) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      emailInput: value,
    }))
    setErrors((currentErrors) => ({
      ...currentErrors,
      invite_emails: '',
      form: '',
    }))
  }

  const validateForm = () => {
    const nextErrors = {}
    const projectName = formValues.name.trim()
    const description = formValues.description.trim()
    const message = formValues.message.trim()
    const pendingEmail = formValues.emailInput.trim()

    if (!projectName) {
      nextErrors.name = 'Project name is required.'
    } else if (projectName.length > 150) {
      nextErrors.name = 'Project name must be 150 characters or less.'
    }

    if (pendingEmail) {
      const pendingResult = validateInviteEmail(pendingEmail, formValues.invite_emails)

      if (!pendingResult.ok) {
        nextErrors.invite_emails = pendingResult.message
      }
    }

    if (description.length > 1000) {
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

    if (isSubmitting) {
      return
    }

    if (!validateForm()) {
      return
    }

    const pendingEmail = formValues.emailInput.trim()
    const pendingResult = pendingEmail ? validateInviteEmail(pendingEmail, formValues.invite_emails) : null
    const inviteEmails = pendingResult?.ok
      ? [...formValues.invite_emails, pendingResult.email]
      : formValues.invite_emails

    const payload = {
      name: formValues.name.trim(),
      invite_emails: inviteEmails,
      description: formValues.description.trim(),
      message: formValues.message.trim(),
    }

    setIsSubmitting(true)
    setErrors({})

    createProject(payload)
      .then(() => {
        navigateToProjects()
      })
      .catch((error) => {
        const normalized = normalizeProjectError(error)

        if (normalized.shouldRedirectToLogin) {
          window.history.replaceState(
            {
              authNotice: {
                message: normalized.message,
                type: 'warning',
              },
            },
            '',
            '/login',
          )
          window.dispatchEvent(new PopStateEvent('popstate'))
          return
        }

        setErrors({
          ...(normalized.fieldErrors || {}),
          form: normalized.message || 'Unable to create project right now.',
        })
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  return (
    <form className="mt-6 w-full" onSubmit={handleSubmit}>
      {errors.form ? (
        <p className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
          {errors.form}
        </p>
      ) : null}

      <div className="grid gap-5">
        <div>
          <label htmlFor="projectName" className="text-sm font-extrabold text-slate-800">
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
            maxLength={150}
            className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
          />
          <FieldError>{getFieldError(errors, 'name')}</FieldError>
        </div>

        <EmailChipsInput
          error={getFieldError(errors, 'invite_emails')}
          inputValue={formValues.emailInput}
          inviteEmails={formValues.invite_emails}
          onAddEmail={addInviteEmail}
          onInputChange={setEmailInput}
          onRemoveEmail={removeInviteEmail}
        />

        <div>
          <label htmlFor="projectDescription" className="text-sm font-extrabold text-slate-800">
            Description
          </label>
          <textarea
            id="projectDescription"
            name="description"
            value={formValues.description}
            onChange={updateField}
            placeholder="Enter project description"
            rows={4}
            maxLength={1000}
            className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
          />
          <FieldError>{getFieldError(errors, 'description')}</FieldError>
        </div>

        <div>
          <label htmlFor="projectMessage" className="text-sm font-extrabold text-slate-800">
            Message <span className="font-semibold text-slate-400">(Optional)</span>
          </label>
          <textarea
            id="projectMessage"
            name="message"
            value={formValues.message}
            onChange={updateField}
            placeholder="Add a personal message to the user"
            rows={3}
            maxLength={500}
            className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4b36f4] focus:ring-4 focus:ring-[#4b36f4]/10"
          />
          <FieldError>{getFieldError(errors, 'message')}</FieldError>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 min-h-12 w-full rounded-lg bg-[#4b36f4] px-8 text-sm font-extrabold text-white transition hover:enabled:bg-[#3827d9] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#4b36f4]/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Creating Project...' : 'Create Project'}
      </button>
    </form>
  )
}
