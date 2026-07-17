import axios from 'axios'
import { API_BASE } from './apiConfig.js'
import { clearAuthSession, getAccessToken, getStoredUser, storeAuthNotice } from './authService.js'
import { getUserRoleCode } from '../utils/auth.js'

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

const STATUS_ITEMS = [
  { status: 'TO_DO', label: 'To Do' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'IN_REVIEW', label: 'In Review' },
  { status: 'DONE', label: 'Done' },
]

const PRIORITY_ITEMS = [
  { priority: 'HIGH', label: 'High' },
  { priority: 'MEDIUM', label: 'Medium' },
  { priority: 'LOW', label: 'Low' },
]

const emptyPermissions = {
  can_create_project: false,
  can_create_task: false,
  can_invite_users: false,
  can_manage_members: false,
}

function safeNumber(value) {
  const nextValue = Number(value)
  return Number.isFinite(nextValue) ? nextValue : 0
}

function normalizeStatusItems(items = [], summary = {}) {
  const counts = new Map(
    (Array.isArray(items) ? items : []).map((item) => [
      String(item?.status || '').toUpperCase(),
      safeNumber(item?.count),
    ]),
  )

  return STATUS_ITEMS.map((item) => ({
    ...item,
    count: counts.has(item.status)
      ? counts.get(item.status)
      : safeNumber({
          TO_DO: summary.to_do_tasks,
          IN_PROGRESS: summary.in_progress_tasks,
          IN_REVIEW: summary.in_review_tasks,
          DONE: summary.completed_tasks,
        }[item.status]),
  }))
}

function normalizePriorityItems(items = [], tasks = []) {
  const counts = new Map(
    (Array.isArray(items) ? items : []).map((item) => [
      String(item?.priority || '').toUpperCase(),
      safeNumber(item?.count),
    ]),
  )

  if (counts.size === 0) {
    tasks.forEach((task) => {
      const priority = String(task?.priority || '').toUpperCase()
      counts.set(priority, safeNumber(counts.get(priority)) + 1)
    })
  }

  return PRIORITY_ITEMS.map((item) => ({
    ...item,
    count: safeNumber(counts.get(item.priority)),
  }))
}

function normalizeProjectOptions(projects = []) {
  return (Array.isArray(projects) ? projects : [])
    .map((project) => ({
      id: project?.id,
      name: project?.name || `Project ${project?.id}`,
      role: project?.current_user_role || project?.role || project?.project_role || '',
    }))
    .filter((project) => project.id)
}

function normalizeAdminDashboard(data, projectOptions = []) {
  const payload = normalizeDashboardPayload(data)
  const summary = payload.summary || {}

  return {
    scope: 'managed',
    selected_project: payload.selected_project || null,
    summary: {
      total_projects: safeNumber(summary.total_projects),
      total_tasks: safeNumber(summary.total_tasks),
      in_progress_tasks: safeNumber(summary.in_progress_tasks),
      completed_tasks: safeNumber(summary.completed_tasks),
    },
    tasks_by_status: normalizeStatusItems(payload.tasks_by_status, summary),
    tasks_by_priority: normalizePriorityItems(payload.tasks_by_priority),
    recent_projects: Array.isArray(payload.recent_projects) ? payload.recent_projects : [],
    recent_tasks: Array.isArray(payload.recent_tasks) ? payload.recent_tasks : [],
    recent_activity: Array.isArray(payload.recent_activity) ? payload.recent_activity : [],
    project_options: normalizeProjectOptions(projectOptions).filter((project) => {
      const role = String(project.role || '').toUpperCase()
      return role === 'OWNER' || role === 'ADMIN'
    }),
    permissions: {
      ...emptyPermissions,
      ...(payload.permissions || {}),
    },
  }
}

function normalizeMemberDashboard(projectsData, tasksData, params = {}) {
  const projectsPayload = projectsData?.data || projectsData
  const tasksPayload = tasksData?.data || tasksData
  const projects = Array.isArray(projectsPayload?.results)
    ? projectsPayload.results
    : Array.isArray(projectsPayload)
      ? projectsPayload
      : []
  const tasks = Array.isArray(tasksPayload?.results)
    ? tasksPayload.results
    : Array.isArray(tasksPayload)
      ? tasksPayload
      : []
  const selectedProjectId = params.project_id ? String(params.project_id) : ''
  const scopedProjects = selectedProjectId
    ? projects.filter((project) => String(project?.id) === selectedProjectId)
    : projects
  const scopedTasks = selectedProjectId
    ? tasks.filter((task) => String(task?.project?.id || task?.project_id || '') === selectedProjectId)
    : tasks
  const statusCounts = STATUS_ITEMS.map((item) => ({
    ...item,
    count: scopedTasks.filter((task) => String(task?.status || '').toUpperCase() === item.status).length,
  }))

  return {
    scope: 'member',
    selected_project: selectedProjectId ? scopedProjects[0] || null : null,
    summary: {
      total_projects: scopedProjects.length,
      total_tasks: scopedTasks.length,
      in_progress_tasks: scopedTasks.filter((task) => String(task?.status || '').toUpperCase() === 'IN_PROGRESS').length,
      completed_tasks: scopedTasks.filter((task) => String(task?.status || '').toUpperCase() === 'DONE').length,
    },
    tasks_by_status: statusCounts,
    tasks_by_priority: normalizePriorityItems([], scopedTasks),
    recent_projects: scopedProjects,
    recent_tasks: scopedTasks,
    recent_activity: [],
    project_options: normalizeProjectOptions(projects),
    permissions: {
      ...emptyPermissions,
    },
  }
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

export async function getDashboard(params = {}, options = {}) {
  const roleCode = getUserRoleCode(options.user || getStoredUser())

  if (roleCode === 'ADMIN' || roleCode === 'OWNER') {
    const [dashboardResponse, projectsResponse] = await Promise.all([
      axios.get(`${API_BASE}/api/dashboard/admin/`, {
        headers: authHeaders(options.accessToken),
        params: cleanParams(params),
        signal: options.signal,
        timeout: options.timeout || 10000,
      }),
      axios.get(`${API_BASE}/api/projects/`, {
        headers: authHeaders(options.accessToken),
        signal: options.signal,
        timeout: options.timeout || 10000,
      }),
    ])

    const projectsPayload = projectsResponse.data?.data || projectsResponse.data
    const projectOptions = Array.isArray(projectsPayload?.results)
      ? projectsPayload.results
      : Array.isArray(projectsPayload)
        ? projectsPayload
        : []

    return normalizeAdminDashboard(dashboardResponse.data, projectOptions)
  }

  const [projectsResponse, tasksResponse] = await Promise.all([
    axios.get(`${API_BASE}/api/my-projects/`, {
      headers: authHeaders(options.accessToken),
      signal: options.signal,
      timeout: options.timeout || 10000,
    }),
    axios.get(`${API_BASE}/api/my-tasks/`, {
      headers: authHeaders(options.accessToken),
      signal: options.signal,
      timeout: options.timeout || 10000,
    }),
  ])

  return normalizeMemberDashboard(projectsResponse.data, tasksResponse.data, params)
}
