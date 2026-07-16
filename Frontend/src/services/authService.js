import axios from 'axios'

const API_BASE = 'http://127.0.0.1:8000'
const ACCESS_TOKEN_KEY = 'authToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'authUser'

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
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function signupUser(payload) {
  const response = await axios.post(`${API_BASE}/api/auth/signup/`, payload)
  return response.data
}

export async function verifyEmail(payload) {
  const response = await axios.post(`${API_BASE}/api/auth/verify-email/`, {
    token: payload.token,
  })
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
  const response = await axios.post(
    `${API_BASE}/api/auth/logout/`,
    { refresh: refreshToken },
    {
      headers: authHeaders(accessToken),
    },
  )
  clearAuthSession()
  return response.data
}

export async function getProfile(accessToken = getAccessToken()) {
  const response = await axios.get(`${API_BASE}/api/profile/`, {
    headers: authHeaders(accessToken),
  })
  return response.data
}

export async function updateProfile(payload, accessToken = getAccessToken()) {
  const isMultipart = payload instanceof FormData
  const response = await axios.patch(`${API_BASE}/api/profile/`, payload, {
    headers: {
      ...authHeaders(accessToken),
      ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
    },
  })
  return response.data
}

export async function deleteAvatar(accessToken = getAccessToken()) {
  const response = await axios.delete(`${API_BASE}/api/profile/avatar/`, {
    headers: authHeaders(accessToken),
  })
  return response.data
}
