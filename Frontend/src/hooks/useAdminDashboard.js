import { useEffect, useRef, useState } from 'react'
import { getProjectRole } from '../components/tasks/taskPermissions.js'
import { getProjects } from '../services/projectService.js'
import { getAdminDashboard, normalizeDashboardError } from '../services/dashboardService.js'

function redirectToLogin(message) {
  window.history.replaceState(
    {
      authNotice: {
        message,
        type: 'warning',
      },
    },
    '',
    '/login',
  )
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function isManageableProject(project) {
  const role = getProjectRole(project).toUpperCase()
  return role === 'OWNER' || role === 'ADMIN'
}

function normalizeProjectOptions(projects) {
  return projects
    .filter(isManageableProject)
    .map((project) => ({
      id: project.id,
      name: project.name || `Project ${project.id}`,
      role: getProjectRole(project).toUpperCase(),
    }))
    .filter((project, index, items) => project.id && items.findIndex((item) => item.id === project.id) === index)
}

const emptyDashboard = {
  view: 'admin',
  selected_project: null,
  summary: {
    total_projects: 0,
    total_members: 0,
    total_tasks: 0,
    to_do_tasks: 0,
    in_progress_tasks: 0,
    in_review_tasks: 0,
    completed_tasks: 0,
    overdue_tasks: 0,
    pending_invitations: 0,
  },
  tasks_by_status: [],
  tasks_by_priority: [],
  recent_projects: [],
  recent_tasks: [],
  upcoming_deadlines: [],
  permissions: {
    can_create_project: false,
    can_create_task: false,
    can_invite_users: false,
    can_manage_members: false,
  },
}

export default function useAdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [projectOptions, setProjectOptions] = useState([])
  const [projectOptionsReady, setProjectOptionsReady] = useState(false)
  const [projectOptionsError, setProjectOptionsError] = useState('')
  const requestIdRef = useRef(0)

  useEffect(() => {
    const controller = new AbortController()

    getProjects({}, undefined, { signal: controller.signal })
      .then((response) => {
        setProjectOptions(normalizeProjectOptions(response.results))
        setProjectOptionsError('')
      })
      .catch(() => {
        setProjectOptions([])
        setProjectOptionsError(
          'Project filtering is hidden because no reusable managed project list is available from the current frontend data sources.',
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setProjectOptionsReady(true)
        }
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    requestIdRef.current += 1
    const requestId = requestIdRef.current
    const hasDashboardData = Boolean(dashboardData)

    setError('')

    if (hasDashboardData) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    getAdminDashboard(
      selectedProjectId
        ? {
            project_id: selectedProjectId,
          }
        : {},
      { signal: controller.signal },
    )
      .then((response) => {
        if (requestId !== requestIdRef.current) {
          return
        }

        setDashboardData(response)
      })
      .catch((fetchError) => {
        const normalized = normalizeDashboardError(fetchError)

        if (normalized.canceled || requestId !== requestIdRef.current) {
          return
        }

        if (normalized.shouldRedirectToLogin) {
          redirectToLogin(normalized.message)
          return
        }

        if (selectedProjectId && [400, 403, 404].includes(normalized.status)) {
          setSelectedProjectId('')
          setError(normalized.message)
          return
        }

        if (!hasDashboardData) {
          setDashboardData(null)
        }

        setError(normalized.message)
      })
      .finally(() => {
        if (!controller.signal.aborted && requestId === requestIdRef.current) {
          setLoading(false)
          setRefreshing(false)
        }
      })

    return () => controller.abort()
  }, [reloadToken, selectedProjectId])

  return {
    dashboardData: dashboardData || emptyDashboard,
    error,
    hasLoadedDashboard: Boolean(dashboardData),
    loading,
    projectFilterAvailable: projectOptionsReady && projectOptions.length > 0,
    projectOptions,
    projectOptionsError,
    refreshing,
    retry() {
      setDashboardData(null)
      setLoading(true)
      setRefreshing(false)
      setError('')
      setReloadToken((value) => value + 1)
    },
    selectedProjectId,
    setSelectedProjectId,
    refetch() {
      setReloadToken((value) => value + 1)
    },
  }
}
