import { useState } from 'react'
import FormInput from './FormInput.jsx'
import { resendVerification } from '../../services/authService.js'

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

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 16v-5m0-3h.01M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
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

export default function ResendVerificationForm() {
  const [email, setEmail] = useState(getInitialEmail())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setSubmitError('Email address is required.')
      return
    }

    setIsSubmitting(true)

    resendVerification({ email: trimmedEmail })
      .then((response) => {
        sessionStorage.setItem('signupEmail', trimmedEmail)
        setSubmitSuccess(response?.message || 'Verification email sent successfully.')
      })
      .catch((error) => {
        const fallbackMessage = 'Unable to resend verification email right now.'
        const responseData = error?.response?.data

        if (typeof responseData === 'string') {
          setSubmitError(responseData)
          return
        }

        if (responseData?.message) {
          setSubmitError(responseData.message)
          return
        }

        if (responseData?.errors && typeof responseData.errors === 'object') {
          const firstError = Object.values(responseData.errors).flat().find(Boolean)
          setSubmitError(firstError || fallbackMessage)
          return
        }

        setSubmitError(fallbackMessage)
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FormInput
        id="resendVerificationEmail"
        name="email"
        label="Email Address"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Enter your email address"
        autoComplete="email"
        icon={<MailIcon />}
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
        disabled={isSubmitting || !email.trim()}
      >
        {isSubmitting ? 'Sending...' : 'Resend Verification'}
      </button>

      <div className="rounded-xl border border-blue-100 bg-blue-50/90 px-4 py-4 text-sm font-medium text-slate-600">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-blue-600">
            <InfoIcon />
          </span>
          <p className="m-0">If your account is eligible, a new verification email will be sent.</p>
        </div>
      </div>

      <div className="h-px bg-[linear-gradient(90deg,rgba(211,221,242,0.18)_0%,rgba(211,221,242,1)_50%,rgba(211,221,242,0.18)_100%)]" />

      <div className="flex items-center justify-center gap-6 text-center text-base text-slate-500 max-[480px]:flex-col max-[480px]:gap-3">
        <p className="m-0">
          Already verified?{' '}
          <a
            href="/login"
            onClick={(event) => {
              event.preventDefault()
              navigateTo('/login')
            }}
            className="font-semibold text-blue-600 no-underline hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-500"
          >
            Login
          </a>
        </p>

        <a
          href="/signup"
          onClick={(event) => {
            event.preventDefault()
            navigateTo('/signup')
          }}
          className="font-semibold text-blue-600 no-underline hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-500"
        >
          Back to Sign Up
        </a>
      </div>
    </form>
  )
}
