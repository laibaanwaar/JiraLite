import { useMemo, useState } from 'react'
import useAuth from '../../hooks/useAuth.js'
import {
  clearPostLoginRedirectPath,
  consumeAuthNotice,
  getPostLoginRedirectPath,
} from '../../services/authService.js'
import { getDashboardPathForRole } from '../../utils/auth.js'
import { navigateTo } from '../../utils/navigation.js'
import FormInput from './FormInput.jsx'
import PasswordInput from './PasswordInput.jsx'

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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

function getInitialEmail() {
  const historyEmail = window.history.state?.prefillEmail
  const signupEmail = sessionStorage.getItem('signupEmail')

  return String(historyEmail || signupEmail || '').trim()
}

function getInitialNotice() {
  const rawNotice = window.history.state?.authNotice || window.history.state?.message || consumeAuthNotice()

  return typeof rawNotice === 'string'
    ? { message: rawNotice, type: 'success' }
    : rawNotice
}

export default function LoginForm() {
  const { login } = useAuth()
  const initialNotice = useMemo(() => getInitialNotice(), [])
  const [formValues, setFormValues] = useState({
    email: getInitialEmail(),
    password: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [rememberMe, setRememberMe] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(initialNotice?.type === 'warning' ? '' : initialNotice?.message || '')
  const [submitWarning, setSubmitWarning] = useState(initialNotice?.type === 'warning' ? initialNotice?.message || '' : '')

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

  const navigateToSignup = (event) => {
    event.preventDefault()
    navigateTo('/signup')
  }

  const validate = () => {
    const nextErrors = {}

    if (!formValues.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!isValidEmail(formValues.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!formValues.password) {
      nextErrors.password = 'Password is required.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')
    setSubmitWarning('')

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await login({
        email: formValues.email.trim(),
        password: formValues.password,
        rememberMe,
      })

      setSubmitSuccess('Login successful.')
      sessionStorage.removeItem('signupEmail')

      const redirectPath = window.history.state?.returnUrl || getPostLoginRedirectPath()
      const destination =
        redirectPath && redirectPath !== '/login' && redirectPath !== '/signup'
          ? redirectPath
          : getDashboardPathForRole(result.roleCode)

      clearPostLoginRedirectPath()
      navigateTo(destination, { replace: true })
    } catch (error) {
      const fallbackMessage = 'Login failed. Please check your email and password.'
      const responseData = error?.response?.data

      if (typeof responseData === 'string') {
        setSubmitError(responseData)
        return
      }

      if (responseData && typeof responseData === 'object') {
        const nextFieldErrors = {
          email: Array.isArray(responseData.email) ? responseData.email[0] : '',
          password: Array.isArray(responseData.password) ? responseData.password[0] : '',
        }
        const firstError = Object.values(responseData).flat().find(Boolean)

        setFieldErrors(nextFieldErrors)
        setSubmitError(firstError || responseData.message || fallbackMessage)
        return
      }

      setSubmitError(fallbackMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <FormInput
        id="loginEmail"
        name="email"
        label="Email"
        type="email"
        value={formValues.email}
        onChange={handleChange}
        placeholder="Enter your email"
        autoComplete="email"
        icon={<MailIcon />}
        error={fieldErrors.email}
        required
      />

      <PasswordInput
        id="loginPassword"
        name="password"
        label="Password"
        value={formValues.password}
        onChange={handleChange}
        placeholder="Enter your password"
        autoComplete="current-password"
        isVisible={isPasswordVisible}
        onToggleVisibility={() => setIsPasswordVisible((currentValue) => !currentValue)}
        icon={<LockIcon />}
        error={fieldErrors.password}
        required
      />

      <div className="flex items-center justify-between gap-4 text-[0.95rem]">
        <label className="flex items-center gap-2.5 font-semibold text-slate-500" htmlFor="rememberMe">
          <input
            id="rememberMe"
            name="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-[18px] w-[18px] accent-[#3260ff]"
          />
          Remember me
        </label>

        <button
          type="button"
          className="font-semibold text-blue-600 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-500"
        >
          Forgot password?
        </button>
      </div>

      {submitError ? (
        <p
          className="mt-[-4px] rounded-xl border border-rose-300/50 bg-rose-50/90 px-3.5 py-3 text-[0.94rem] leading-[1.45] text-rose-700"
          role="alert"
        >
          {submitError}
        </p>
      ) : null}

      {submitSuccess ? (
        <p
          className="mt-[-4px] rounded-xl border border-emerald-300/50 bg-emerald-50/90 px-3.5 py-3 text-[0.94rem] leading-[1.45] text-emerald-700"
          role="status"
        >
          {submitSuccess}
        </p>
      ) : null}

      {submitWarning ? (
        <p
          className="mt-[-4px] rounded-xl border border-amber-300/50 bg-amber-50/90 px-3.5 py-3 text-[0.94rem] leading-[1.45] text-amber-800"
          role="status"
        >
          {submitWarning}
        </p>
      ) : null}

      <button
        type="submit"
        className="min-h-[58px] rounded-xl border-0 bg-linear-to-r from-[#4030e8] via-[#4b36f4] to-[#3827d9] text-[1.05rem] font-bold text-white shadow-[0_16px_26px_rgba(64,48,232,0.26)] transition duration-150 hover:enabled:-translate-y-px hover:enabled:shadow-[0_20px_30px_rgba(64,48,232,0.3)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(64,48,232,0.28)] active:enabled:translate-y-0 active:enabled:shadow-[0_12px_22px_rgba(64,48,232,0.24)] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>

      <p className="m-0 pt-3 text-center text-base font-semibold text-slate-500">
        Do not have an account?{' '}
        <a
          href="/signup"
          onClick={navigateToSignup}
          className="text-blue-600 no-underline hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-500"
        >
          Sign up
        </a>
      </p>
    </form>
  )
}
