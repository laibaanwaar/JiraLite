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

function buildConfig(accessToken = getAccessToken(), options = {}) {
  return {
    headers: {
      ...authHeaders(accessToken),
      ...(options.headers || {}),
    },
    params: options.params,
    signal: options.signal,
    timeout: options.timeout || 10000,
  }
}

function normalizeTaskListResponse(data) {
  const payload = data?.data

  return {
    count: Number(payload?.count || 0),
    results: Array.isArray(payload?.results) ? payload.results : [],
    message: data?.message || '',
  }
}

function normalizeTaskResponse(data) {
  return {
    task: data?.data || null,
    message: data?.message || '',
  }
}

export function normalizeTaskError(error) {
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

  if (status === 404) {
    return {
      status,
      message: 'The requested project or task could not be found.',
    }
  }

  if (status === 409) {
    return {
      status,
      message: responseData?.message || 'The task could not be updated because of a conflicting change.',
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

  if (error?.code === 'ECONNABORTED') {
    return {
      message: 'The request took too long. Please try again.',
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

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )
}

export async function createTask(projectId, payload, options = {}) {
  const response = await axios.post(
    `${API_BASE}/api/projects/${projectId}/tasks/`,
    payload,
    buildConfig(options.accessToken, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  )

  return normalizeTaskResponse(response.data)
}

export async function getProjectTasks(projectId, params = {}, options = {}) {
  const response = await axios.get(
    `${API_BASE}/api/projects/${projectId}/tasks/`,
    buildConfig(options.accessToken, {
      ...options,
      params: cleanParams(params),
    }),
  )

  return normalizeTaskListResponse(response.data)
}

export async function getTasks(params = {}, options = {}) {
  const response = await axios.get(
    `${API_BASE}/api/tasks/`,
    buildConfig(options.accessToken, {
      ...options,
      params: cleanParams(params),
    }),
  )

  return normalizeTaskListResponse(response.data)
}

export async function getMyTasks(params = {}, options = {}) {
  const response = await axios.get(
    `${API_BASE}/api/tasks/my/`,
    buildConfig(options.accessToken, {
      ...options,
      params: cleanParams(params),
    }),
  )

  return normalizeTaskListResponse(response.data)
}

export async function getTaskById(taskId, options = {}) {
  const response = await axios.get(`${API_BASE}/api/tasks/${taskId}/`, buildConfig(options.accessToken, options))
  return normalizeTaskResponse(response.data)
}

export async function updateTask(taskId, payload, options = {}) {
  const response = await axios.patch(
    `${API_BASE}/api/tasks/${taskId}/`,
    payload,
    buildConfig(options.accessToken, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  )

  return normalizeTaskResponse(response.data)
}

export async function deleteTask(taskId, options = {}) {
  const response = await axios.delete(`${API_BASE}/api/tasks/${taskId}/`, buildConfig(options.accessToken, options))
  return {
    success: Boolean(response.data?.success),
    message: response.data?.message || 'Task deleted successfully.',
  }
}
