import { useCallback, useEffect, useState } from 'react'
import { clearAuthSession, getAccessToken, getStoredUser } from '../services/authService.js'
import { getProfile, getProfileErrorDetails, updateProfile } from '../services/profileService.js'

const REDIRECT_PATH_KEY = 'postLoginRedirectPath'

function navigateToLogin() {
  sessionStorage.setItem(REDIRECT_PATH_KEY, window.location.pathname)
  window.history.pushState({}, '', '/login')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function getPostLoginRedirectPath() {
  return sessionStorage.getItem(REDIRECT_PATH_KEY)
}

export function clearPostLoginRedirectPath() {
  sessionStorage.removeItem(REDIRECT_PATH_KEY)
}

export default function useProfile() {
  const [profile, setProfile] = useState(() => getStoredUser())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const handleServiceError = useCallback((error, fallbackMessage) => {
    const details = getProfileErrorDetails(error)
    setFieldErrors(details.fieldErrors && typeof details.fieldErrors === 'object' ? details.fieldErrors : {})
    setErrorMessage(details.message || fallbackMessage)

    if (details.shouldRedirectToLogin) {
      navigateToLogin()
    }
  }, [])

  const refreshProfile = useCallback(() => {
    const token = getAccessToken()

    if (!token) {
      clearAuthSession()
      setProfile(null)
      setFieldErrors({})
      setErrorMessage('Login is required to view your profile.')
      setIsLoading(false)
      navigateToLogin()
      return Promise.resolve(null)
    }

    setErrorMessage('')
    setFieldErrors({})

    return getProfile(token)
      .then((nextProfile) => {
        setProfile(nextProfile)
        return nextProfile
      })
      .catch((error) => {
        handleServiceError(error, 'Unable to load your profile right now.')
        return null
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [handleServiceError])

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  const saveProfile = useCallback(
    async (payload) => {
      const token = getAccessToken()

      if (!token) {
        clearAuthSession()
        setErrorMessage('Login is required to update your profile.')
        navigateToLogin()
        return { ok: false }
      }

      setIsSaving(true)
      setErrorMessage('')
      setSuccessMessage('')
      setFieldErrors({})

      try {
        const nextProfile = await updateProfile(payload, token)
        setProfile(nextProfile)
        setSuccessMessage('Profile updated successfully.')
        return { ok: true, profile: nextProfile }
      } catch (error) {
        handleServiceError(error, 'Unable to update your profile right now.')
        return { ok: false }
      } finally {
        setIsSaving(false)
      }
    },
    [handleServiceError],
  )

  return {
    errorMessage,
    fieldErrors,
    isLoading,
    isSaving,
    profile,
    refreshProfile,
    saveProfile,
    setErrorMessage,
    setFieldErrors,
    setSuccessMessage,
    successMessage,
  }
}
