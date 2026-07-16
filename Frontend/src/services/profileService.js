import axios from 'axios'
import { API_BASE } from './apiConfig.js'
import { clearAuthSession, getAccessToken, updateStoredUser } from './authService.js'

function authHeaders(accessToken = getAccessToken()) {
  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {}
}

function normalizeProfileResponse(data) {
  return data?.data || data
}

function normalizeFieldErrors(errorData) {
  if (!errorData || typeof errorData !== 'object' || Array.isArray(errorData)) {
    return {}
  }

  const nextErrors = {}

  if (Array.isArray(errorData.first_name)) {
    nextErrors.first_name = errorData.first_name
  }

  if (Array.isArray(errorData.last_name)) {
    nextErrors.last_name = errorData.last_name
  }

  if (Array.isArray(errorData.phone)) {
    nextErrors.phone = errorData.phone
  }

  if (Array.isArray(errorData.bio)) {
    nextErrors.bio = errorData.bio
  }

  if (Array.isArray(errorData.profile_image)) {
    nextErrors.profile_image = errorData.profile_image
  }

  if (errorData.profile && typeof errorData.profile === 'object') {
    if (Array.isArray(errorData.profile.phone)) {
      nextErrors.phone = errorData.profile.phone
    }

    if (Array.isArray(errorData.profile.bio)) {
      nextErrors.bio = errorData.profile.bio
    }

    if (Array.isArray(errorData.profile.profile_image)) {
      nextErrors.profile_image = errorData.profile.profile_image
    }
  }

  return nextErrors
}

function buildProfilePayload(payload) {
  const hasImage = payload.profile_image instanceof File

  if (!hasImage) {
    return {
      body: {
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone: payload.phone,
        bio: payload.bio,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    }
  }

  const formData = new FormData()
  formData.append('first_name', payload.first_name)
  formData.append('last_name', payload.last_name)
  formData.append('phone', payload.phone)
  formData.append('bio', payload.bio)
  formData.append('profile_image', payload.profile_image)

  return {
    body: formData,
    headers: {},
  }
}

export function getProfileErrorDetails(error) {
  if (error?.response?.status === 401) {
    clearAuthSession()

    return {
      message: 'Your session has expired. Please log in again.',
      shouldRedirectToLogin: true,
    }
  }

  if (error?.response?.status === 403) {
    return {
      message: 'Your account cannot access this profile right now.',
    }
  }

  if (error?.response?.status === 500) {
    return {
      message: 'We could not reach the server right now. Please try again shortly.',
    }
  }

  if (error?.response?.status === 400) {
    return {
      message: 'Please correct the highlighted fields and try again.',
      fieldErrors: normalizeFieldErrors(error.response.data),
    }
  }

  if (error?.request) {
    return {
      message: 'Unable to connect. Please check your connection and try again.',
    }
  }

  return {
    message: 'Something went wrong while loading your profile.',
  }
}

export async function getProfile(accessToken = getAccessToken()) {
  const response = await axios.get(`${API_BASE}/api/profile/`, {
    headers: authHeaders(accessToken),
  })
  const profile = normalizeProfileResponse(response.data)
  updateStoredUser(profile)
  return profile
}

export async function updateProfile(payload, accessToken = getAccessToken()) {
  const request = buildProfilePayload(payload)
  const response = await axios.patch(`${API_BASE}/api/profile/`, request.body, {
    headers: {
      ...authHeaders(accessToken),
      ...request.headers,
    },
  })
  const profile = normalizeProfileResponse(response.data)
  updateStoredUser(profile)
  return profile
}
