import { useState } from 'react'
import { signupAdmin } from '../../services/authService.js'
import { navigateTo } from '../../utils/navigation.js'
import FormInput from './FormInput.jsx'
import PasswordInput from './PasswordInput.jsx'

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

function isStrongPassword(value) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(String(value || ''))
}

export default function SignupForm() {
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  })

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

  const handleToggleVisibility = (fieldName) => {
    setPasswordVisibility((currentVisibility) => ({
      ...currentVisibility,
      [fieldName]: !currentVisibility[fieldName],
    }))
  }

  const handleLoginNavigation = (event) => {
    event.preventDefault()
    navigateTo('/login')
  }

  const validate = () => {
    const nextErrors = {}

    if (!formValues.firstName.trim()) {
      nextErrors.firstName = 'First name is required.'
    }

    if (!formValues.lastName.trim()) {
      nextErrors.lastName = 'Last name is required.'
    }

    if (!formValues.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!isValidEmail(formValues.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!formValues.password) {
      nextErrors.password = 'Password is required.'
    } else if (!isStrongPassword(formValues.password)) {
      nextErrors.password = 'Use at least 8 characters with upper, lower, number, and special character.'
    }

    if (!formValues.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your password.'
    } else if (formValues.password !== formValues.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    if (!acceptedTerms) {
      nextErrors.terms = 'You must accept the terms to continue.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')

    if (!validate()) {
      return
    }

    const signupPayload = {
      first_name: formValues.firstName.trim(),
      last_name: formValues.lastName.trim(),
      email: formValues.email.trim(),
      password: formValues.password,
      confirm_password: formValues.confirmPassword,
    }

    setIsSubmitting(true)

    try {
      await signupAdmin(signupPayload)
      sessionStorage.setItem('signupEmail', signupPayload.email)
      setSubmitSuccess('Your admin account has been created successfully.')
      navigateTo('/login', {
        replace: true,
        state: {
          message: 'Your admin account has been created successfully. Please log in.',
          prefillEmail: signupPayload.email,
        },
      })
    } catch (error) {
      const fallbackMessage = 'Signup failed. Please check your details and try again.'
      const responseData = error?.response?.data

      if (typeof responseData === 'string') {
        setSubmitError(responseData)
        return
      }

      if (responseData && typeof responseData === 'object') {
        const nextFieldErrors = {
          firstName: Array.isArray(responseData.first_name) ? responseData.first_name[0] : '',
          lastName: Array.isArray(responseData.last_name) ? responseData.last_name[0] : '',
          email: Array.isArray(responseData.email) ? responseData.email[0] : '',
          password: Array.isArray(responseData.password) ? responseData.password[0] : '',
          confirmPassword: Array.isArray(responseData.confirm_password) ? responseData.confirm_password[0] : '',
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
    <form className="flex flex-col gap-[18px]" onSubmit={handleSubmit}>
      <div className="grid gap-[18px] md:grid-cols-2">
        <FormInput
          id="firstName"
          name="firstName"
          label="First Name"
          value={formValues.firstName}
          onChange={handleChange}
          placeholder="Enter your first name"
          autoComplete="given-name"
          icon={<UserIcon />}
          error={fieldErrors.firstName}
          required
        />
        <FormInput
          id="lastName"
          name="lastName"
          label="Last Name"
          value={formValues.lastName}
          onChange={handleChange}
          placeholder="Enter your last name"
          autoComplete="family-name"
          icon={<UserIcon />}
          error={fieldErrors.lastName}
          required
        />
      </div>

      <FormInput
        id="email"
        name="email"
        label="Email Address"
        type="email"
        value={formValues.email}
        onChange={handleChange}
        placeholder="Enter your email address"
        autoComplete="email"
        icon={<MailIcon />}
        error={fieldErrors.email}
        required
      />

      <PasswordInput
        id="password"
        name="password"
        label="Password"
        value={formValues.password}
        onChange={handleChange}
        placeholder="Create a strong password"
        autoComplete="new-password"
        isVisible={passwordVisibility.password}
        onToggleVisibility={() => handleToggleVisibility('password')}
        icon={<LockIcon />}
        error={fieldErrors.password}
        required
      />

      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm Password"
        value={formValues.confirmPassword}
        onChange={handleChange}
        placeholder="Confirm your password"
        autoComplete="new-password"
        isVisible={passwordVisibility.confirmPassword}
        onToggleVisibility={() => handleToggleVisibility('confirmPassword')}
        icon={<LockIcon />}
        error={fieldErrors.confirmPassword}
        required
      />

      <label className="flex items-start gap-3 text-[0.95rem] leading-[1.55] text-slate-500 max-[480px]:gap-2.5 max-[480px]:text-[0.92rem]" htmlFor="terms">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          checked={acceptedTerms}
          onChange={(event) => {
            setAcceptedTerms(event.target.checked)
            setFieldErrors((currentErrors) => ({
              ...currentErrors,
              terms: '',
            }))
          }}
          className="mt-0.5 h-[18px] w-[18px] accent-[#3260ff]"
        />
        <span>
          I agree to the{' '}
          <a
            href="#terms"
            className="font-semibold text-blue-600 no-underline hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-500"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="#privacy"
            className="font-semibold text-blue-600 no-underline hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-500"
          >
            Privacy Policy
          </a>
          .
        </span>
      </label>

      {fieldErrors.terms ? <p className="mt-[-8px] text-sm font-semibold text-rose-600">{fieldErrors.terms}</p> : null}

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
        className="min-h-[58px] rounded-xl border-0 bg-linear-to-r from-[#2659ff] via-[#3467ff] to-[#2554f6] text-[1.05rem] font-bold text-white shadow-[0_16px_26px_rgba(47,87,255,0.28)] transition duration-150 hover:enabled:-translate-y-px hover:enabled:shadow-[0_20px_30px_rgba(47,87,255,0.32)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(61,104,255,0.28)] active:enabled:translate-y-0 active:enabled:shadow-[0_12px_22px_rgba(47,87,255,0.24)] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating Account...' : 'Sign Up'}
      </button>

      <div className="flex items-center gap-3.5 text-[0.95rem] text-slate-400" aria-hidden="true">
        <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(211,221,242,0.18)_0%,rgba(211,221,242,1)_50%,rgba(211,221,242,0.18)_100%)]" />
        <p className="m-0">or</p>
        <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(211,221,242,0.18)_0%,rgba(211,221,242,1)_50%,rgba(211,221,242,0.18)_100%)]" />
      </div>

      <p className="m-0 text-center text-base text-slate-500">
        Already have an account?{' '}
        <a
          href="/login"
          onClick={handleLoginNavigation}
          className="font-semibold text-blue-600 no-underline hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-500"
        >
          Login
        </a>
      </p>
    </form>
  )
}
