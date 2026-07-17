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
  const payload = data?.data || data || {}
  const results = Array.isArray(payload?.results)
    ? payload.results
    : Array.isArray(data?.results)
      ? data.results
      : []

  return {
    count: Number(payload?.count ?? results.length),
    next: payload?.next || null,
    previous: payload?.previous || null,
    results: results.map(normalizeTask),
    message: data?.message || '',
  }
}

function normalizeAssignee(assignee) {
  const user = assignee?.user || assignee || {}
  const firstName = user?.first_name || assignee?.first_name || ''
  const lastName = user?.last_name || assignee?.last_name || ''
  const email = user?.email || assignee?.email || ''
  const assigneeId = assignee?.project_member_id || assignee?.id || assignee?.assignee_id || ''

  return {
    id: assigneeId,
    project_member_id: assigneeId,
    user_id: assignee?.user_id || user?.id || '',
    first_name: firstName,
    last_name: lastName,
    email,
    name: [firstName, lastName].filter(Boolean).join(' ') || 'Unassigned',
  }
}

function normalizeTask(task) {
  const project = task?.project || {}
  const assignee = normalizeAssignee(task?.assignee)

  return {
    ...task,
    id: task?.id,
    title: task?.title || 'Untitled Task',
    project: {
      id: project?.id || task?.project_id || '',
      name: project?.name || task?.project_name || 'Unknown project',
    },
    projectId: project?.id || task?.project_id || '',
    projectName: project?.name || task?.project_name || 'Unknown project',
    status: task?.status || 'TO_DO',
    priority: task?.priority || 'MEDIUM',
    assignee,
    assigneeId: assignee.project_member_id,
    assigneeName: assignee.name,
    assigneeEmail: assignee.email,
    due_date: task?.due_date || task?.dueDate || '',
    dueDate: task?.due_date || task?.dueDate || '',
    permissions: {
      canView: true,
      canEdit: Boolean(task?.permissions?.canEdit ?? task?.permissions?.can_edit),
      canDelete: Boolean(task?.permissions?.canDelete ?? task?.permissions?.can_delete),
      canUpdateStatus: Boolean(task?.permissions?.canUpdateStatus ?? task?.permissions?.can_update_status),
    },
  }
}

function normalizeTaskResponse(data) {
  return {
    task: data?.data ? normalizeTask(data.data) : null,
    message: data?.message || '',
  }
}

function normalizeComment(comment) {
  const author = comment?.author || comment?.user || comment?.created_by || {}
  const firstName = author?.first_name || comment?.author_first_name || ''
  const lastName = author?.last_name || comment?.author_last_name || ''
  const role = author?.role?.code || author?.role || comment?.role || comment?.author_role || ''

  return {
    ...comment,
    id: comment?.id,
    content: comment?.content || comment?.body || comment?.text || '',
    created_at: comment?.created_at || comment?.createdAt || '',
    updated_at: comment?.updated_at || comment?.updatedAt || '',
    can_edit: Boolean(comment?.can_edit ?? comment?.permissions?.can_edit ?? comment?.permissions?.canEdit),
    can_delete: Boolean(comment?.can_delete ?? comment?.permissions?.can_delete ?? comment?.permissions?.canDelete),
    author: {
      ...author,
      first_name: firstName,
      last_name: lastName,
      email: author?.email || comment?.author_email || '',
      role,
      name: [firstName, lastName].filter(Boolean).join(' ') || author?.name || comment?.author_name || 'Unknown user',
    },
  }
}

function normalizeCommentListResponse(data) {
  const payload = data?.data || data || {}
  const results = Array.isArray(payload?.results)
    ? payload.results
    : Array.isArray(payload?.comments)
      ? payload.comments
      : Array.isArray(payload)
        ? payload
        : []

  return {
    count: Number(payload?.count ?? results.length),
    message: data?.message || '',
    results: results.map(normalizeComment),
  }
}

function normalizeCommentResponse(data) {
  return {
    comment: data?.data ? normalizeComment(data.data) : normalizeComment(data),
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

export async function getTaskComments(taskId, options = {}) {
  const response = await axios.get(`${API_BASE}/api/tasks/${taskId}/comments/`, buildConfig(options.accessToken, options))
  return normalizeCommentListResponse(response.data)
}

export async function createTaskComment(taskId, payload, options = {}) {
  const response = await axios.post(
    `${API_BASE}/api/tasks/${taskId}/comments/`,
    payload,
    buildConfig(options.accessToken, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  )
  return normalizeCommentResponse(response.data)
}

export async function updateTaskComment(commentId, payload, options = {}) {
  const response = await axios.patch(
    `${API_BASE}/api/comments/${commentId}/`,
    payload,
    buildConfig(options.accessToken, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  )
  return normalizeCommentResponse(response.data)
}

export async function deleteTaskComment(commentId, options = {}) {
  const response = await axios.delete(`${API_BASE}/api/comments/${commentId}/`, buildConfig(options.accessToken, options))
  return {
    success: Boolean(response.data?.success ?? true),
    message: response.data?.message || 'Comment deleted successfully.',
  }
}
