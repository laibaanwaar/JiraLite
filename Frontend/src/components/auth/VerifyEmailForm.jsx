import { useState } from 'react'
import FormInput from './FormInput.jsx'
import { resendVerification, verifyEmail } from '../../services/authService.js'

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

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        d="M12 3.75 5.25 6v5.25c0 4.2 2.85 7.95 6.75 9 3.9-1.05 6.75-4.8 6.75-9V6L12 3.75Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M19.5 12h-15m0 0 6-6m-6 6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function getInitialEmail() {
  return window.history.state?.email || sessionStorage.getItem('signupEmail') || ''
}

function navigateTo(path, state = {}) {
  window.history.pushState(state, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function getSafeErrorMessage(responseData, fallbackMessage) {
  if (typeof responseData === 'string') {
    return responseData
  }

  if (!responseData || typeof responseData !== 'object') {
    return fallbackMessage
  }

  if (typeof responseData.message === 'string' && responseData.message.trim()) {
    return responseData.message
  }

  if (typeof responseData.detail === 'string' && responseData.detail.trim()) {
    return responseData.detail
  }

  const prioritizedMessages = [
    responseData.code?.[0],
    responseData.email?.[0],
    responseData.errors?.code?.[0],
    responseData.errors?.email?.[0],
  ]

  const prioritizedMessage = prioritizedMessages.find((value) => typeof value === 'string' && value.trim())

  if (prioritizedMessage) {
    return prioritizedMessage
  }

  if (responseData.errors && typeof responseData.errors === 'object') {
    const firstError = Object.values(responseData.errors)
      .flat()
      .find((value) => typeof value === 'string' && value.trim())

    if (firstError) {
      return firstError
    }
  }

  const firstTopLevelString = Object.values(responseData).find(
    (value) => typeof value === 'string' && value.trim(),
  )

  return firstTopLevelString || fallbackMessage
}

export default function VerifyEmailForm() {
  const [formValues, setFormValues] = useState({
    email: getInitialEmail(),
    code: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
  }

  const navigateToLogin = () => {
    navigateTo('/login')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setSubmitError('')
    setSubmitSuccess('')

    const trimmedEmail = formValues.email.trim()
    const trimmedCode = formValues.code.trim()

    if (!trimmedEmail) {
      setSubmitError('Email address is required.')
      return
    }

    if (!trimmedCode) {
      setSubmitError('Verification code is required.')
      return
    }

    const verificationPayload = {
      email: trimmedEmail,
      code: trimmedCode,
    }

    setIsSubmitting(true)

    verifyEmail(verificationPayload)
      .then((responseData) => {
        sessionStorage.removeItem('signupEmail')
        navigateTo('/login', {
          message: getSafeErrorMessage(responseData, 'Email verified successfully. Please log in.'),
        })
      })
      .catch((error) => {
        const fallbackMessage = 'Email verification failed. Please check the code and try again.'
        const responseData = error?.response?.data

        if (import.meta.env.DEV) {
          console.error('verify-email error response:', responseData)
        }

        setSubmitError(getSafeErrorMessage(responseData, fallbackMessage))
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  const handleBackToLogin = (event) => {
    event.preventDefault()
    navigateToLogin()
  }

  const handleResendVerification = () => {
    setSubmitError('')
    setSubmitSuccess('')
    setIsResending(true)

    resendVerification({ email: formValues.email.trim() })
      .then(() => {
        setSubmitSuccess('Verification email sent.')
      })
      .catch((error) => {
        const fallbackMessage = 'Unable to resend verification email right now.'
        const responseData = error?.response?.data
        setSubmitError(getSafeErrorMessage(responseData, fallbackMessage))
      })
      .finally(() => {
        setIsResending(false)
      })
  }

  const handleResendPageNavigation = (event) => {
    event.preventDefault()
    navigateTo('/resend-verification', { email: formValues.email.trim() || formValues.email })
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FormInput
        id="verificationEmail"
        name="email"
        label="Email Address"
        type="email"
        value={formValues.email}
        onChange={handleChange}
        placeholder="Enter your email address"
        autoComplete="email"
        icon={<MailIcon />}
      />

      <FormInput
        id="verificationCode"
        name="code"
        label="Verification Code"
        value={formValues.code}
        onChange={handleChange}
        placeholder="Paste or enter your verification code"
        autoComplete="one-time-code"
        icon={<ShieldIcon />}
      />

      {submitError ? (
        <p
          className="mt-[-6px] rounded-xl border border-rose-300/50 bg-rose-50/90 px-3.5 py-3 text-[0.94rem] leading-[1.45] text-rose-700"
          role="alert"
        >
          {submitError}
        </p>
      ) : null}

      {submitSuccess ? (
        <p
          className="mt-[-6px] rounded-xl border border-emerald-300/50 bg-emerald-50/90 px-3.5 py-3 text-[0.94rem] leading-[1.45] text-emerald-700"
          role="status"
        >
          {submitSuccess}
        </p>
      ) : null}

      <button
        type="submit"
        className="min-h-[58px] rounded-xl border-0 bg-linear-to-r from-[#2659ff] via-[#3467ff] to-[#2554f6] text-[1.05rem] font-bold text-white shadow-[0_16px_26px_rgba(47,87,255,0.28)] transition duration-150 hover:enabled:-translate-y-px hover:enabled:shadow-[0_20px_30px_rgba(47,87,255,0.32)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(61,104,255,0.28)] active:enabled:translate-y-0 active:enabled:shadow-[0_12px_22px_rgba(47,87,255,0.24)] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
        disabled={isSubmitting || !formValues.email.trim() || !formValues.code.trim()}
      >
        {isSubmitting ? 'Verifying...' : 'Verify Email'}
      </button>

      <p className="m-0 text-center text-[0.95rem] text-slate-500">
        Did not receive the email?{' '}
        <button
          type="button"
          onClick={handleResendVerification}
          disabled={isResending || !formValues.email.trim()}
          className="font-semibold text-blue-600 no-underline hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-500"
        >
          {isResending ? 'Sending...' : 'Resend verification'}
        </button>
      </p>

      <p className="m-0 text-center text-[0.95rem] text-slate-500">
        Need the full resend page?{' '}
        <a
          href="/resend-verification"
          onClick={handleResendPageNavigation}
          className="font-semibold text-blue-600 no-underline hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-500"
        >
          Open resend form
        </a>
      </p>

      <div className="h-px bg-[linear-gradient(90deg,rgba(211,221,242,0.18)_0%,rgba(211,221,242,1)_50%,rgba(211,221,242,0.18)_100%)]" />

      <p className="m-0 text-center">
        <a
          href="/login"
          onClick={handleBackToLogin}
          className="inline-flex items-center gap-2 font-semibold text-blue-600 no-underline hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-500"
        >
          <ArrowLeftIcon />
          Back to Login
        </a>
      </p>
    </form>
  )
}
