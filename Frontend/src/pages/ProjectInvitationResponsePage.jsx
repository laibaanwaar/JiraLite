import { useEffect, useState } from 'react'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormInput from '../components/auth/FormInput.jsx'
import PasswordInput from '../components/auth/PasswordInput.jsx'
import useAuth from '../hooks/useAuth.js'
import {
  acceptInvitation,
  getInvitation,
  normalizeInvitationError,
  rejectInvitation,
} from '../services/invitationService.js'
import { navigateTo } from '../utils/navigation.js'

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

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        d="M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Zm-6.75 7.5a6.75 6.75 0 0 1 13.5 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        d="M7.5 10.5V8.25a4.5 4.5 0 1 1 9 0v2.25m-9 0h9v8.25h-9V10.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function getInvitationToken() {
  const params = new URLSearchParams(window.location.search)
  return params.get('token')?.trim() || ''
}

function getInvitationStatusMessage(invitation) {
  const status = String(invitation?.status || invitation?.invitation_status || '').toUpperCase()

  if (status === 'EXPIRED') {
    return {
      tone: 'warning',
      message: 'This invitation has expired.',
    }
  }

  if (status === 'ACCEPTED') {
    return {
      tone: 'success',
      message: 'This invitation has already been accepted.',
    }
  }

  if (status === 'REJECTED') {
    return {
      tone: 'warning',
      message: 'This invitation has already been rejected.',
    }
  }

  return null
}

function StatusMessage({ tone = 'neutral', message }) {
  if (!message) {
    return null
  }

  const toneClassName = {
    danger: 'border-rose-300/50 bg-rose-50/90 text-rose-700',
    neutral: 'border-slate-200 bg-slate-50 text-slate-700',
    success: 'border-emerald-300/50 bg-emerald-50/90 text-emerald-700',
    warning: 'border-amber-300/50 bg-amber-50/90 text-amber-800',
  }

  return (
    <p className={`rounded-xl border px-4 py-3 text-[0.98rem] font-semibold ${toneClassName[tone] || toneClassName.neutral}`}>
      {message}
    </p>
  )
}

export default function ProjectInvitationResponsePage() {
  const token = getInvitationToken()
  const { applyAuthSession } = useAuth()
  const [invitation, setInvitation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState({ tone: 'neutral', text: '' })
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  })
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  })

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      setSubmitMessage({
        tone: 'danger',
        text: 'Invitation token is missing.',
      })
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setInvitation(null)
    setFieldErrors({})
    setSubmitMessage({ tone: 'neutral', text: '' })

    getInvitation(token, { signal: controller.signal })
      .then((data) => {
        setFieldErrors({})
        setInvitation(data)
        const statusMessage = getInvitationStatusMessage(data)

        if (statusMessage) {
          setSubmitMessage({
            tone: statusMessage.tone,
            text: statusMessage.message,
          })
          return
        }

        setSubmitMessage({ tone: 'neutral', text: '' })
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return
        }

        setInvitation(null)
        setFieldErrors({})
        setSubmitMessage({
          tone: 'danger',
          text: 'Unable to validate this invitation.',
        })
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [token])

  const invitationEmail = invitation?.email || invitation?.invited_email || ''
  const invitationProjectName = invitation?.project_name || invitation?.project?.name || 'Unknown project'
  const statusMessage = getInvitationStatusMessage(invitation)
  const isResolved = Boolean(statusMessage)

  const handleFieldChange = (event) => {
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

  const handleAcceptInvitation = async () => {
    if (!token || isResolved) {
      return
    }

    setSubmitMessage({ tone: 'neutral', text: '' })
    setFieldErrors({})

    setIsAccepting(true)

    try {
      const payload = {
        first_name: formValues.firstName.trim(),
        last_name: formValues.lastName.trim(),
        password: formValues.password,
        confirm_password: formValues.confirmPassword,
      }
      const response = await acceptInvitation(token, payload)
      const successMessage = response?.message || 'Your member account has been created successfully.'

      setSubmitMessage({
        tone: 'success',
        text: successMessage,
      })

      setInvitation((currentInvitation) => ({
        ...currentInvitation,
        status: 'ACCEPTED',
      }))

      applyAuthSession(response)
      navigateTo('/dashboard', { replace: true })
    } catch (error) {
      const normalized = normalizeInvitationError(error)

      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        firstName: normalized.fieldErrors.first_name || '',
        lastName: normalized.fieldErrors.last_name || '',
        password: normalized.fieldErrors.password || '',
        confirmPassword: normalized.fieldErrors.confirm_password || '',
      }))
      setSubmitMessage({
        tone: 'danger',
        text: normalized.message,
      })
    } finally {
      setIsAccepting(false)
    }
  }

  const handleRejectInvitation = async () => {
    if (!token || isResolved || isRejecting) {
      return
    }

    const isConfirmed = window.confirm('Are you sure you want to reject this invitation?')

    if (!isConfirmed) {
      return
    }

    setIsRejecting(true)
    setSubmitMessage({ tone: 'neutral', text: '' })

    try {
      const response = await rejectInvitation(token)

      setInvitation((currentInvitation) => ({
        ...currentInvitation,
        status: 'REJECTED',
      }))
      setSubmitMessage({
        tone: 'success',
        text: response?.message || 'Invitation rejected successfully.',
      })
    } catch (error) {
      const normalized = normalizeInvitationError(error, 'Unable to reject this invitation right now.')
      setSubmitMessage({
        tone: 'danger',
        text: normalized.message,
      })
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <AuthLayout>
      <section
        className="w-full max-w-[760px] rounded-[28px] border border-slate-200/90 bg-white/95 px-5 py-7 shadow-[0_24px_60px_rgba(74,102,170,0.18)] backdrop-blur-[6px] sm:px-[34px] sm:py-[30px]"
        aria-labelledby="project-invitation-title"
      >
        <h1
          id="project-invitation-title"
          className="m-0 text-[2.25rem] font-extrabold leading-[1.1] text-slate-900 max-[480px]:text-[1.85rem]"
        >
          Accept Project Invitation
        </h1>
        <p className="mb-7 mt-3 text-[1rem] leading-[1.6] text-slate-500">
          Review the invite details before joining the project.
        </p>

        {isLoading ? (
          <StatusMessage tone="neutral" message="Validating invitation..." />
        ) : null}

        {!isLoading && submitMessage.text ? (
          <StatusMessage tone={submitMessage.tone} message={submitMessage.text} />
        ) : null}

        {!isLoading && invitation ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                id="invitedEmail"
                name="invitedEmail"
                label="Invited Email"
                value={invitationEmail}
                onChange={() => {}}
                readOnly
                disabled
                icon={<MailIcon />}
              />
              <FormInput
                id="projectName"
                name="projectName"
                label="Project Name"
                value={invitationProjectName}
                onChange={() => {}}
                readOnly
                disabled
                icon={<UserIcon />}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                id="acceptFirstName"
                name="firstName"
                label="First Name"
                value={formValues.firstName}
                onChange={handleFieldChange}
                placeholder="Enter your first name"
                autoComplete="given-name"
                icon={<UserIcon />}
                error={fieldErrors.firstName}
                disabled={isResolved}
                required
              />
              <FormInput
                id="acceptLastName"
                name="lastName"
                label="Last Name"
                value={formValues.lastName}
                onChange={handleFieldChange}
                placeholder="Enter your last name"
                autoComplete="family-name"
                icon={<UserIcon />}
                error={fieldErrors.lastName}
                disabled={isResolved}
                required
              />
              <PasswordInput
                id="acceptPassword"
                name="password"
                label="Password"
                value={formValues.password}
                onChange={handleFieldChange}
                placeholder="Create a strong password"
                autoComplete="new-password"
                isVisible={passwordVisibility.password}
                onToggleVisibility={() =>
                  setPasswordVisibility((currentVisibility) => ({
                    ...currentVisibility,
                    password: !currentVisibility.password,
                  }))
                }
                icon={<LockIcon />}
                error={fieldErrors.password}
                disabled={isResolved}
                required
              />
              <PasswordInput
                id="acceptConfirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                value={formValues.confirmPassword}
                onChange={handleFieldChange}
                placeholder="Confirm your password"
                autoComplete="new-password"
                isVisible={passwordVisibility.confirmPassword}
                onToggleVisibility={() =>
                  setPasswordVisibility((currentVisibility) => ({
                    ...currentVisibility,
                    confirmPassword: !currentVisibility.confirmPassword,
                  }))
                }
                icon={<LockIcon />}
                error={fieldErrors.confirmPassword}
                disabled={isResolved}
                required
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAcceptInvitation}
                disabled={isResolved || isAccepting || isRejecting}
                className="inline-flex min-h-[54px] flex-1 items-center justify-center rounded-xl bg-linear-to-r from-[#4030e8] via-[#4b36f4] to-[#3827d9] px-5 text-base font-bold text-white shadow-[0_16px_26px_rgba(64,48,232,0.26)] transition disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isAccepting ? 'Accepting...' : 'Accept Invitation'}
              </button>
              <button
                type="button"
                onClick={handleRejectInvitation}
                disabled={isResolved || isAccepting || isRejecting}
                className="inline-flex min-h-[54px] flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-base font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isRejecting ? 'Rejecting...' : 'Reject Invitation'}
              </button>
            </div>

            {String(invitation?.status || '').toUpperCase() === 'REJECTED' ? (
              <div className="flex flex-wrap gap-3 text-sm font-semibold">
                <button type="button" onClick={() => navigateTo('/')} className="text-slate-600 hover:underline">
                  Go to Home
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </AuthLayout>
  )
}
