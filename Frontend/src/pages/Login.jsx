import { useState } from 'react'

import Button from '../components/Button'
import FormInput from '../components/FormInput'
import { loginUser, saveAuthSession } from '../services/authService'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    keepLoggedIn: false,
  })
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    if (errorMessage) {
      setErrorMessage('')
    }

    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const response = await loginUser({
        email: formData.email,
        password: formData.password,
      })

      saveAuthSession(response.data, formData.keepLoggedIn)
      window.history.pushState({}, '', '/dashboard')
      window.dispatchEvent(new Event('app:navigate'))
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-blue-800">JiraLite</h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-7 py-8 shadow-xl shadow-slate-200/70 sm:px-8">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-800">
              Welcome back
            </h2>
            <p className="text-base text-slate-500">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <FormInput
              id="email"
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@company.com"
              autoComplete="email"
              disabled={isSubmitting}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-sm font-medium text-blue-700 transition hover:text-blue-800"
                >
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                autoComplete="current-password"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-100 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                name="keepLoggedIn"
                checked={formData.keepLoggedIn}
                onChange={handleChange}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-200"
              />
              <span>Keep me logged in</span>
            </label>

            {errorMessage ? (
              <p className="text-sm font-medium text-red-600">{errorMessage}</p>
            ) : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Login
