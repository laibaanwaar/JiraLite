import { useEffect, useMemo, useRef, useState } from 'react'
import { resendVerification, verifyEmail } from '../../services/authService.js'
import { navigateTo } from '../../utils/navigation.js'

const OTP_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

function getInitialEmail() {
  return String(window.history.state?.email || sessionStorage.getItem('signupEmail') || '').trim()
}

function maskEmail(email) {
  const [name = '', domain = ''] = String(email).split('@')

  if (!name || !domain) {
    return email
  }

  return `${name.charAt(0)}${name.length > 1 ? '***' : ''}@${domain}`
}

function getSafeErrorMessage(responseData, fallbackMessage) {
  if (typeof responseData === 'string') {
    return responseData
  }

  if (!responseData || typeof responseData !== 'object') {
    return fallbackMessage
  }

  const candidates = [
    responseData.message,
    responseData.detail,
    responseData.code?.[0],
    responseData.otp?.[0],
    responseData.email?.[0],
    responseData.non_field_errors?.[0],
    responseData.errors?.code?.[0],
    responseData.errors?.otp?.[0],
    responseData.errors?.email?.[0],
    responseData.errors?.non_field_errors?.[0],
  ]

  const directMessage = candidates.find((value) => typeof value === 'string' && value.trim())

  if (directMessage) {
    return directMessage
  }

  if (responseData.errors && typeof responseData.errors === 'object') {
    const firstError = Object.values(responseData.errors)
      .flat()
      .find((value) => typeof value === 'string' && value.trim())

    if (firstError) {
      return firstError
    }
  }

  const firstTopLevelString = Object.values(responseData)
    .flat()
    .find((value) => typeof value === 'string' && value.trim())

  return firstTopLevelString || fallbackMessage
}

function normalizeVerificationError(message) {
  const normalized = String(message || '').toLowerCase()

  if (normalized.includes('expired')) {
    return 'This verification code has expired. Request a new code.'
  }

  if (normalized.includes('already') && normalized.includes('verified')) {
    return 'Your email is already verified. Please log in.'
  }

  if (normalized.includes('too many') || normalized.includes('throttle') || normalized.includes('rate')) {
    return 'Too many verification attempts. Please wait and try again.'
  }

  if (normalized.includes('invalid') || normalized.includes('incorrect')) {
    return 'The verification code is incorrect.'
  }

  return message || 'Email verification failed. Please check the code and try again.'
}

export default function VerifyEmailForm() {
  const email = useMemo(() => getInitialEmail(), [])
  const maskedEmail = maskEmail(email)
  const inputRefs = useRef([])
  const [digits, setDigits] = useState(() => Array(OTP_LENGTH).fill(''))
  const [cooldown, setCooldown] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  const otp = digits.join('')
  const isOtpComplete = otp.length === OTP_LENGTH && digits.every(Boolean)

  useEffect(() => {
    if (!cooldown) {
      return undefined
    }

    const timerId = window.setInterval(() => {
      setCooldown((currentCooldown) => Math.max(currentCooldown - 1, 0))
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [cooldown])

  const clearOtp = () => {
    setDigits(Array(OTP_LENGTH).fill(''))
    window.setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 0)
  }

  const handleDigitChange = (index, value) => {
    const numericValue = value.replace(/\D/g, '')

    if (!numericValue) {
      setDigits((currentDigits) => {
        const nextDigits = [...currentDigits]
        nextDigits[index] = ''
        return nextDigits
      })
      return
    }

    const nextValues = numericValue.slice(0, OTP_LENGTH - index).split('')

    setDigits((currentDigits) => {
      const nextDigits = [...currentDigits]

      nextValues.forEach((digit, digitIndex) => {
        nextDigits[index + digitIndex] = digit
      })

      return nextDigits
    })

    const nextIndex = Math.min(index + nextValues.length, OTP_LENGTH - 1)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleKeyDown = (index, event) => {
    if (event.key !== 'Backspace' || digits[index]) {
      return
    }

    inputRefs.current[Math.max(index - 1, 0)]?.focus()
  }

  const handlePaste = (event) => {
    event.preventDefault()
    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)

    if (!pastedDigits) {
      return
    }

    setDigits([
      ...pastedDigits.split(''),
      ...Array(Math.max(OTP_LENGTH - pastedDigits.length, 0)).fill(''),
    ])

    inputRefs.current[Math.min(pastedDigits.length, OTP_LENGTH) - 1]?.focus()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isSubmitting || !email || !isOtpComplete) {
      return
    }

    setSubmitError('')
    setSubmitSuccess('')
    setIsSubmitting(true)

    try {
      const responseData = await verifyEmail({
        email,
        code: otp,
      })

      sessionStorage.removeItem('signupEmail')
      setSubmitSuccess('Email verified successfully.')
      navigateTo('/login', {
        replace: true,
        state: {
          message: getSafeErrorMessage(responseData, 'Email verified successfully. Please log in.'),
          prefillEmail: email,
        },
      })
    } catch (error) {
      const fallbackMessage = 'Email verification failed. Please check the code and try again.'
      const responseData = error?.response?.data
      const safeMessage = normalizeVerificationError(getSafeErrorMessage(responseData, fallbackMessage))

      setSubmitError(safeMessage)
      clearOtp()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email || isResending || cooldown > 0) {
      return
    }

    setSubmitError('')
    setSubmitSuccess('')
    setIsResending(true)

    try {
      await resendVerification({ email })
      setSubmitSuccess('A new verification code has been sent.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
      clearOtp()
    } catch (error) {
      const fallbackMessage = 'Unable to resend verification code right now.'
      setSubmitError(getSafeErrorMessage(error?.response?.data, fallbackMessage))
    } finally {
      setIsResending(false)
    }
  }

  const handleBackToSignup = () => {
    sessionStorage.removeItem('signupEmail')
    navigateTo('/signup')
  }

  if (!email) {
    return (
      <div className="text-center">
        <h1 id="verify-email-title" className="m-0 text-2xl font-extrabold leading-tight text-[#061A43]">
          No pending verification
        </h1>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
          No pending email verification was found. Please sign up again to request a new code.
        </p>
        <button
          type="button"
          className="mt-5 min-h-11 w-full rounded-lg border-0 bg-[#061A43] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B2457] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(37,99,235,0.28)]"
          onClick={handleBackToSignup}
        >
          Back to Signup
        </button>
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-4 [@media(max-height:760px)]:gap-3.5" onSubmit={handleSubmit}>
      <div className="text-center">
        <h1 id="verify-email-title" className="m-0 text-2xl font-extrabold leading-tight text-[#061A43]">
          Verify your email
        </h1>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          Enter the verification code sent to <span className="font-extrabold text-slate-700">{maskedEmail}</span>.
        </p>
      </div>

      <fieldset className="border-0 p-0">
        <legend className="sr-only">Verification code</legend>
        <div className="flex justify-center gap-2.5">
          {digits.map((digit, index) => (
            <input
              aria-label={`Verification code digit ${index + 1}`}
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              className="h-11 w-10 rounded-lg border border-slate-300 bg-white text-center text-lg font-extrabold text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 sm:w-11"
              inputMode="numeric"
              key={`otp-${index}`}
              maxLength={1}
              onChange={(event) => handleDigitChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              pattern="[0-9]*"
              ref={(element) => {
                inputRefs.current[index] = element
              }}
              type="text"
              value={digit}
            />
          ))}
        </div>
      </fieldset>

      {submitError ? (
        <p
          className="rounded-lg border border-rose-300/50 bg-rose-50/90 px-3.5 py-2.5 text-sm leading-6 text-rose-700"
          role="alert"
        >
          {submitError}
        </p>
      ) : null}

      {submitSuccess ? (
        <p
          className="rounded-lg border border-emerald-300/50 bg-emerald-50/90 px-3.5 py-2.5 text-sm leading-6 text-emerald-700"
          role="status"
        >
          {submitSuccess}
        </p>
      ) : null}

      <button
        type="submit"
        className="min-h-11 rounded-lg border-0 bg-[#061A43] px-4 text-sm font-bold text-white shadow-sm transition hover:enabled:bg-[#0B2457] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(37,99,235,0.28)] disabled:cursor-not-allowed disabled:opacity-55"
        disabled={isSubmitting || !isOtpComplete}
      >
        {isSubmitting ? 'Verifying...' : 'Verify OTP'}
      </button>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-center text-sm font-semibold text-slate-500">
        <button
          type="button"
          onClick={handleResendVerification}
          disabled={isResending || cooldown > 0}
          className="text-blue-600 no-underline hover:enabled:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {isResending ? 'Sending...' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend OTP'}
        </button>

        <button
          type="button"
          onClick={handleBackToSignup}
          className="text-blue-600 no-underline hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-500"
        >
          Change email
        </button>
      </div>
    </form>
  )
}
