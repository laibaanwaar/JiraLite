import axios from 'axios'
import { API_BASE } from './apiConfig.js'
import { clearAuthSession, getAccessToken, storeAuthNotice } from './authService.js'

function authHeaders(accessToken = getAccessToken()) {
  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {}
}

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )
}

function normalizeDashboardPayload(data) {
  if (data?.data && typeof data.data === 'object') {
    return data.data
  }

  const error = new Error('Unexpected dashboard response shape.')
  error.code = 'INVALID_DASHBOARD_RESPONSE'
  throw error
}

export function normalizeDashboardError(error) {
  if (axios.isCancel?.(error) || error?.code === 'ERR_CANCELED') {
    return {
      canceled: true,
      message: 'Request canceled.',
    }
  }

  if (error?.code === 'INVALID_DASHBOARD_RESPONSE') {
    return {
      message: 'The dashboard data could not be loaded correctly.',
    }
  }

  const status = error?.response?.status
  const responseData = error?.response?.data
  const errors = responseData?.errors

  if (status === 400) {
    const projectMessage = Array.isArray(errors?.project_id) ? errors.project_id[0] : ''

    return {
      status,
      message: projectMessage || responseData?.message || 'Invalid project selection.',
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
      message: 'You do not have permission to view this admin dashboard.',
    }
  }

  if (status === 404) {
    return {
      status,
      message: 'The selected project could not be found.',
    }
  }

  if (status === 500) {
    return {
      status,
      message: 'A server error occurred while loading the dashboard.',
    }
  }

  if (error?.code === 'ECONNABORTED') {
    return {
      message: 'The dashboard request took too long. Please try again.',
    }
  }

  if (error?.request) {
    return {
      message: 'Unable to connect to the server. Check your connection and try again.',
    }
  }

  return {
    message: 'The dashboard data could not be loaded correctly.',
  }
}

export async function getAdminDashboard(params = {}, options = {}) {
  const response = await axios.get(`${API_BASE}/api/dashboard/admin/`, {
    headers: authHeaders(options.accessToken),
    params: cleanParams(params),
    signal: options.signal,
    timeout: options.timeout || 10000,
  })

  return normalizeDashboardPayload(response.data)
}
