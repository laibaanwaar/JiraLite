import { useState } from 'react'
import FormInput from './FormInput.jsx'
import PasswordInput from './PasswordInput.jsx'
import { getProfile, loginUser, storeAuthSession } from '../../services/authService.js'

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

export default function LoginForm() {
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
  }

  const navigateToSignup = (event) => {
    event.preventDefault()
    window.history.pushState({}, '', '/signup')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const navigateToProfile = () => {
    window.history.pushState({}, '', '/profile')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')

    const loginPayload = {
      email: formValues.email.trim(),
      password: formValues.password,
    }

    setIsSubmitting(true)

    loginUser(loginPayload)
      .then((data) => {
        const accessToken = data?.data?.access || data?.access || data?.token
        const refreshToken = data?.data?.refresh || data?.refresh
        const user = data?.data?.user
        const session = {
          accessToken,
          refreshToken,
          rememberMe,
        }

        storeAuthSession({
          accessToken,
          refreshToken,
          user,
          rememberMe,
        })

        return getProfile(accessToken).then((profileResponse) => ({
          profileResponse,
          session,
        }))
      })
      .then(({ profileResponse, session }) => {
        storeAuthSession({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: profileResponse.data,
          rememberMe: session.rememberMe,
        })
        setSubmitSuccess('Login successful.')
        navigateToProfile()
      })
      .catch((error) => {
        const fallbackMessage = 'Login failed. Please check your email and password.'
        const responseData = error?.response?.data

        if (typeof responseData === 'string') {
          setSubmitError(responseData)
          return
        }

        if (responseData && typeof responseData === 'object') {
          const firstError = Object.values(responseData).flat().find(Boolean)
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

      <button
        type="submit"
        className="min-h-[58px] rounded-xl border-0 bg-linear-to-r from-[#4030e8] via-[#4b36f4] to-[#3827d9] text-[1.05rem] font-bold text-white shadow-[0_16px_26px_rgba(64,48,232,0.26)] transition duration-150 hover:enabled:-translate-y-px hover:enabled:shadow-[0_20px_30px_rgba(64,48,232,0.3)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(64,48,232,0.28)] active:enabled:translate-y-0 active:enabled:shadow-[0_12px_22px_rgba(64,48,232,0.24)] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
        disabled={isSubmitting || !formValues.email.trim() || !formValues.password}
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
