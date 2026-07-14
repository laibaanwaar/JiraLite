import axios from 'axios'

import api from './api'

const AUTH_STORAGE_KEYS = {
  accessToken: 'jiraLite.accessToken',
  refreshToken: 'jiraLite.refreshToken',
  user: 'jiraLite.user',
}

const DEFAULT_ERROR_MESSAGE = 'Unable to sign in right now. Please try again.'

function decodeBase64Url(value) {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalizedValue.length % 4
  const paddedValue =
    padding === 0
      ? normalizedValue
      : normalizedValue.padEnd(normalizedValue.length + (4 - padding), '=')

  return atob(paddedValue)
}

function decodeJwtSegment(segment) {
  const decodedValue = decodeBase64Url(segment)
  const encodedCharacters = Array.from(decodedValue, (character) =>
    `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`,
  ).join('')

  return decodeURIComponent(encodedCharacters)
}

function parseJson(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function parseJwtPayload(token) {
  if (typeof token !== 'string') {
    return null
  }

  const tokenParts = token.split('.')

  if (tokenParts.length !== 3 || !tokenParts[1]) {
    return null
  }

  try {
    return parseJson(decodeJwtSegment(tokenParts[1]))
  } catch {
    return null
  }
}

function isTokenExpired(token) {
  const payload = parseJwtPayload(token)

  if (!payload || typeof payload.exp !== 'number') {
    return true
  }

  return payload.exp * 1000 <= Date.now()
}

function getMessageFromPayload(payload) {
  if (!payload) {
    return ''
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message
  }

  const firstFieldError = Object.values(payload).find((value) => {
    if (Array.isArray(value)) {
      return typeof value[0] === 'string' && value[0].trim()
    }

    return typeof value === 'string' && value.trim()
  })

  if (Array.isArray(firstFieldError)) {
    return firstFieldError[0]
  }

  if (typeof firstFieldError === 'string') {
    return firstFieldError
  }

  return ''
}

function getLoginErrorMessage(error) {
  if (!axios.isAxiosError(error)) {
    return DEFAULT_ERROR_MESSAGE
  }

  if (!error.response) {
    return 'Unable to reach the server. Check your connection and try again.'
  }

  const { status, data } = error.response
  const serverMessage = getMessageFromPayload(data)

  switch (status) {
    case 400:
      return serverMessage || 'Please check your email and password and try again.'
    case 401:
      return serverMessage || 'Invalid email or password.'
    case 403:
      return serverMessage || 'You do not have permission to sign in.'
    case 404:
      return serverMessage || 'Login service not found. Please contact support.'
    case 500:
      return serverMessage || 'The server is unavailable right now. Please try again later.'
    default:
      return serverMessage || DEFAULT_ERROR_MESSAGE
  }
}

export async function loginUser(credentials) {
  try {
    const response = await api.post('/auth/login/', credentials)
    return response.data
  } catch (error) {
    throw new Error(getLoginErrorMessage(error))
  }
}

function getStorage(keepLoggedIn) {
  return keepLoggedIn ? localStorage : sessionStorage
}

function hasCompleteSession(storage) {
  const accessToken = storage.getItem(AUTH_STORAGE_KEYS.accessToken)
  const refreshToken = storage.getItem(AUTH_STORAGE_KEYS.refreshToken)
  const storedUser = storage.getItem(AUTH_STORAGE_KEYS.user)
  const parsedUser = storedUser ? parseJson(storedUser) : null

  return (
    typeof accessToken === 'string' &&
    accessToken.trim() !== '' &&
    !isTokenExpired(accessToken) &&
    typeof refreshToken === 'string' &&
    refreshToken.trim() !== '' &&
    parsedUser !== null &&
    typeof parsedUser === 'object'
  )
}

export function saveAuthSession({ access, refresh, user }, keepLoggedIn = false) {
  clearAuthSession()

  const storage = getStorage(keepLoggedIn)
  storage.setItem(AUTH_STORAGE_KEYS.accessToken, access)
  storage.setItem(AUTH_STORAGE_KEYS.refreshToken, refresh)
  storage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user))
}

export function clearAuthSession() {
  Object.values(AUTH_STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  })
}

export function hasStoredAuthSession() {
  const hasLocalSession = hasCompleteSession(localStorage)
  const hasSessionStorageSession = hasCompleteSession(sessionStorage)

  if (!hasLocalSession && !hasSessionStorageSession) {
    clearAuthSession()
  }

  return hasLocalSession || hasSessionStorageSession
}

export { AUTH_STORAGE_KEYS }
