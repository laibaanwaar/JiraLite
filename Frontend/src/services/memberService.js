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

function buildConfig(accessToken = getAccessToken(), options = {}) {
  return {
    headers: {
      ...authHeaders(accessToken),
      ...(options.headers || {}),
    },
    signal: options.signal,
    timeout: options.timeout || 10000,
  }
}

function normalizeListResponse(data) {
  const payload = data?.data || data

  return {
    count: Number(payload?.count || 0),
    results: Array.isArray(payload?.results) ? payload.results : Array.isArray(payload) ? payload : [],
    message: data?.message || '',
  }
}

export function normalizeMemberError(error) {
  if (axios.isCancel?.(error) || error?.code === 'ERR_CANCELED') {
    return {
      canceled: true,
      message: 'Request canceled.',
    }
  }

  const status = error?.response?.status
  const responseData = error?.response?.data

  if (status === 401) {
    clearAuthSession()
    storeAuthNotice({
      message: 'Your session has expired. Please log in again.',
      type: 'warning',
    })

    return {
      message: 'Your session has expired. Please log in again.',
      shouldRedirectToLogin: true,
      status,
    }
  }

  if (status === 403) {
    return {
      message: 'You do not have permission to view this member workspace.',
      status,
    }
  }

  if (status === 500) {
    return {
      message: 'A server error occurred. Please try again later.',
      status,
    }
  }

  if (error?.request) {
    return {
      message: 'Unable to connect to the server. Check your connection and try again.',
    }
  }

  return {
    message:
      responseData?.message ||
      responseData?.detail ||
      'Unable to load member data right now.',
  }
}

export async function getMyProjects(options = {}) {
  const response = await axios.get(`${API_BASE}/api/my-projects/`, buildConfig(options.accessToken, options))
  return normalizeListResponse(response.data)
}

export async function getMyTasks(options = {}) {
  const response = await axios.get(`${API_BASE}/api/my-tasks/`, buildConfig(options.accessToken, options))
  return normalizeListResponse(response.data)
}
