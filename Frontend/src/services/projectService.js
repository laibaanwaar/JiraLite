import axios from 'axios'
import { clearAuthSession, getAccessToken, storeAuthNotice } from './authService.js'
import { API_BASE } from './apiConfig.js'

function authHeaders(accessToken = getAccessToken()) {
  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {}
}

export function getProjectInvitationErrorMessage(error, fallbackMessage = 'Unable to process this invitation right now.') {
  const responseData = error?.response?.data

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData
  }

  if (!responseData || typeof responseData !== 'object') {
    return fallbackMessage
  }

  if (typeof responseData.message === 'string' && responseData.message.trim()) {
    return responseData.message
  }

  if (typeof responseData.detail === 'string' && responseData.detail.trim()) {
    return responseData.detail
  }

  const firstNestedError = Object.values(responseData)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .find((value) => typeof value === 'string' && value.trim())

  return firstNestedError || fallbackMessage
}

export function isCompletedInvitationMessage(message) {
  const normalizedMessage = String(message || '').toLowerCase()

  return normalizedMessage.includes('already been accepted') || (
    normalizedMessage.includes('no longer pending') &&
    normalizedMessage.includes('accepted')
  )
}

export function normalizeProjectError(error) {
  if (axios.isCancel?.(error) || error?.code === 'ERR_CANCELED') {
    return {
      canceled: true,
      message: 'Request canceled.',
    }
  }

  const status = error?.response?.status
  const responseData = error?.response?.data

  if (status === 400) {
    return {
      status,
      message: responseData?.message || 'Invalid input.',
      fieldErrors: responseData?.errors && typeof responseData.errors === 'object' ? responseData.errors : {},
    }
  }

  if (status === 401) {
    clearAuthSession()
    storeAuthNotice({
      message: 'Your session has expired. Please log in again.',
      type: 'warning',
    })

    return {
      status,
      message: 'Your session has expired. Please log in again.',
      shouldRedirectToLogin: true,
    }
  }

  if (status === 403) {
    return {
      status,
      message: 'You do not have permission to perform this action.',
    }
  }

  if (status === 409) {
    return {
      status,
      message: responseData?.message || 'A conflict occurred while creating the project.',
    }
  }

  if (status === 429) {
    return {
      status,
      message: 'Too many requests. Please wait and try again.',
    }
  }

  if (status === 500) {
    return {
      status,
      message: 'A server error occurred. Please try again later.',
    }
  }

  if (error?.request) {
    return {
      message: 'Unable to connect to the server. Check your connection and try again.',
    }
  }

  return {
    message: 'Unable to complete this request right now.',
  }
}

export async function createProject(projectPayload, accessToken = getAccessToken()) {
  const response = await axios.post(`${API_BASE}/api/projects/`, projectPayload, {
    headers: {
      ...authHeaders(accessToken),
      'Content-Type': 'application/json',
    },
  })
  return response.data
}

export async function deleteProject(projectId, accessToken = getAccessToken()) {
  const response = await axios.delete(`${API_BASE}/api/projects/${projectId}/`, {
    headers: authHeaders(accessToken),
  })
  return response.data
}

export async function getProject(projectId, accessToken = getAccessToken(), options = {}) {
  const response = await axios.get(`${API_BASE}/api/projects/${projectId}/`, {
    headers: authHeaders(accessToken),
    signal: options.signal,
    timeout: options.timeout || 10000,
  })

  return {
    project: response.data?.data || null,
    message: response.data?.message || '',
  }
}

export async function acceptProjectInvitation(payload, accessToken = getAccessToken()) {
  const response = await axios.post(`${API_BASE}/api/project-invitations/accept/`, payload, {
    headers: {
      ...authHeaders(accessToken),
      'Content-Type': 'application/json',
    },
  })
  return response.data
}

export async function getProjects(params = {}, accessToken = getAccessToken(), options = {}) {
  const response = await axios.get(`${API_BASE}/api/projects/`, {
    headers: authHeaders(accessToken),
    params,
    signal: options.signal,
    timeout: options.timeout || 10000,
  })

  const payload = response.data?.data || response.data
  return {
    count: Number(payload?.count || 0),
    results: Array.isArray(payload?.results) ? payload.results : Array.isArray(payload) ? payload : [],
    message: response.data?.message || '',
  }
}

export async function getProjectMembers(projectId, accessToken = getAccessToken(), options = {}) {
  const response = await axios.get(`${API_BASE}/api/projects/${projectId}/members/`, {
    headers: authHeaders(accessToken),
    signal: options.signal,
    timeout: options.timeout || 10000,
  })

  const payload = response.data?.data || response.data
  return {
    count: Number(payload?.count || 0),
    results: Array.isArray(payload?.results) ? payload.results : Array.isArray(payload) ? payload : [],
    message: response.data?.message || '',
  }
}
