import { useCallback, useEffect, useState } from 'react'
import {
  clearAuthSession,
  getAccessToken,
  getCurrentUser,
  getStoredUser,
  storePostLoginRedirectPath,
} from '../services/authService.js'
import { getProfileErrorDetails, updateProfile } from '../services/profileService.js'
import useAuth from './useAuth.js'

function navigateToLogin() {
  storePostLoginRedirectPath(window.location.pathname)
  window.history.pushState({}, '', '/login')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function useProfile() {
  const { updateUser, user } = useAuth()
  const [profile, setProfile] = useState(() => user || getStoredUser())
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

    return getCurrentUser(token)
      .then((nextProfile) => {
        setProfile(nextProfile)
        updateUser(nextProfile)
        return nextProfile
      })
      .catch((error) => {
        handleServiceError(error, 'Unable to load your profile right now.')
        return null
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [handleServiceError, updateUser])

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  useEffect(() => {
    if (user) {
      setProfile(user)
    }
  }, [user])

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
        updateUser(nextProfile)
        setSuccessMessage('Profile updated successfully.')
        return { ok: true, profile: nextProfile }
      } catch (error) {
        handleServiceError(error, 'Unable to update your profile right now.')
        return { ok: false }
      } finally {
        setIsSaving(false)
      }
    },
    [handleServiceError, updateUser],
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
