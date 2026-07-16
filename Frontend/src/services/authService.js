import axios from 'axios'
import { API_BASE } from './apiConfig.js'

const ACCESS_TOKEN_KEY = 'authToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'authUser'
const AUTH_NOTICE_KEY = 'authNotice'
const POST_LOGIN_REDIRECT_KEY = 'postLoginRedirectPath'

function getStorage(rememberMe = false) {
  return rememberMe ? localStorage : sessionStorage
}

function getStoredValue(key) {
  return sessionStorage.getItem(key) || localStorage.getItem(key)
}

function authHeaders(accessToken = getAccessToken()) {
  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {}
}

export function getAccessToken() {
  return getStoredValue(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return getStoredValue(REFRESH_TOKEN_KEY)
}

export function storeAuthSession({ accessToken, refreshToken, user, rememberMe = false }) {
  const storage = getStorage(rememberMe)
  const otherStorage = rememberMe ? sessionStorage : localStorage

  otherStorage.removeItem(ACCESS_TOKEN_KEY)
  otherStorage.removeItem(REFRESH_TOKEN_KEY)
  otherStorage.removeItem(USER_KEY)

  if (accessToken) {
    storage.setItem(ACCESS_TOKEN_KEY, accessToken)
  }

  if (refreshToken) {
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }

  if (user) {
    storage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export function getStoredUser() {
  const storedUser = getStoredValue(USER_KEY)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch {
    return null
  }
}

export function clearAuthSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
}

export function updateStoredUser(user) {
  if (!user) {
    sessionStorage.removeItem(USER_KEY)
    localStorage.removeItem(USER_KEY)
    return
  }

  const serializedUser = JSON.stringify(user)

  if (sessionStorage.getItem(ACCESS_TOKEN_KEY)) {
    sessionStorage.setItem(USER_KEY, serializedUser)
  }

  if (localStorage.getItem(ACCESS_TOKEN_KEY)) {
    localStorage.setItem(USER_KEY, serializedUser)
  }
}

export function storeAuthNotice(notice) {
  if (!notice?.message) {
    sessionStorage.removeItem(AUTH_NOTICE_KEY)
    return
  }

  sessionStorage.setItem(AUTH_NOTICE_KEY, JSON.stringify(notice))
}

export function consumeAuthNotice() {
  const storedNotice = sessionStorage.getItem(AUTH_NOTICE_KEY)

  if (!storedNotice) {
    return null
  }

  sessionStorage.removeItem(AUTH_NOTICE_KEY)

  try {
    return JSON.parse(storedNotice)
  } catch {
    return null
  }
}

function isIdempotentLogoutResponse(data) {
  const message = String(data?.message || '').toLowerCase()
  return message.includes('already logged out') || message.includes('blacklisted') || message.includes('expired')
}

function normalizeLogoutError(error) {
  const status = error?.response?.status
  const message = String(error?.response?.data?.message || '').toLowerCase()

  if (status === 400 && (message.includes('blacklisted') || message.includes('expired'))) {
    return {
      ok: true,
      message: 'Logged out successfully.',
      variant: 'success',
    }
  }

  if (status === 400) {
    return {
      ok: false,
      message: 'Your session is no longer valid. You have been signed out.',
      variant: 'warning',
    }
  }

  if (status === 401) {
    return {
      ok: false,
      message: 'Your session has expired. Please log in again.',
      variant: 'warning',
    }
  }

  if (status === 403) {
    return {
      ok: false,
      message: 'Your account can no longer access this application.',
      variant: 'warning',
    }
  }

  if (status === 429) {
    return {
      ok: false,
      message: 'Too many logout requests. You have been signed out locally.',
      variant: 'warning',
    }
  }

  if (status === 500) {
    return {
      ok: false,
      message: 'You have been signed out on this device, but the server could not confirm logout.',
      variant: 'warning',
    }
  }

  if (error?.code === 'ECONNABORTED' || error?.request) {
    return {
      ok: false,
      message:
        'You have been signed out on this device. The server could not be reached to invalidate the session.',
      variant: 'warning',
    }
  }

  return {
    ok: false,
    message: 'You have been signed out on this device, but the server could not confirm logout.',
    variant: 'warning',
  }
}

export async function signupUser(payload) {
  const response = await axios.post(`${API_BASE}/api/auth/signup/`, payload)
  return response.data
}

export async function verifyEmail(payload) {
  const response = await axios.post(
    `${API_BASE}/api/auth/verify-email/`,
    {
      email: String(payload.email ?? '').trim(),
      code: String(payload.code ?? '').trim(),
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
  return response.data
}

export async function resendVerification(payload) {
  const response = await axios.post(`${API_BASE}/api/auth/resend-verification/`, payload)
  return response.data
}

export async function loginUser(payload) {
  const response = await axios.post(`${API_BASE}/api/auth/login/`, payload)
  return response.data
}

export async function logoutUser(refreshToken = getRefreshToken(), accessToken = getAccessToken()) {
  if (!accessToken) {
    return {
      ok: true,
      message: 'Logged out successfully.',
      variant: 'success',
    }
  }

  if (!refreshToken) {
    return {
      ok: true,
      message: 'Your session was incomplete. You have been signed out locally.',
      variant: 'warning',
    }
  }

  try {
    const response = await axios.post(
      `${API_BASE}/api/auth/logout/`,
      { refresh: refreshToken },
      {
        headers: {
          ...authHeaders(accessToken),
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      },
    )

    return {
      ok: true,
      message: isIdempotentLogoutResponse(response.data)
        ? 'Logged out successfully.'
        : response.data?.message || 'Logged out successfully.',
      variant: 'success',
    }
  } catch (error) {
    return normalizeLogoutError(error)
  }
}

export async function deleteAvatar(accessToken = getAccessToken()) {
  const response = await axios.delete(`${API_BASE}/api/profile/avatar/`, {
    headers: authHeaders(accessToken),
  })
  return response.data
}
