import { useEffect, useRef, useState } from 'react'
import { getDashboard, normalizeDashboardError } from '../services/dashboardService.js'
import { navigateTo } from '../utils/navigation.js'
import useAuth from './useAuth.js'

const emptyDashboard = {
  scope: 'member',
  selected_project: null,
  summary: {
    total_projects: 0,
    total_tasks: 0,
    in_progress_tasks: 0,
    completed_tasks: 0,
  },
  tasks_by_status: [
    { status: 'TO_DO', label: 'To Do', count: 0 },
    { status: 'IN_PROGRESS', label: 'In Progress', count: 0 },
    { status: 'IN_REVIEW', label: 'In Review', count: 0 },
    { status: 'DONE', label: 'Done', count: 0 },
  ],
  tasks_by_priority: [
    { priority: 'HIGH', label: 'High', count: 0 },
    { priority: 'MEDIUM', label: 'Medium', count: 0 },
    { priority: 'LOW', label: 'Low', count: 0 },
  ],
  recent_projects: [],
  recent_tasks: [],
  recent_activity: [],
  project_options: [],
  permissions: {
    can_create_project: false,
    can_create_task: false,
    can_invite_users: false,
    can_manage_members: false,
  },
}

export default function useDashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [reloadToken, setReloadToken] = useState(0)
  const requestIdRef = useRef(0)
  const hasDashboardDataRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    const hasDashboardData = hasDashboardDataRef.current
    requestIdRef.current += 1
    const requestId = requestIdRef.current

    setError('')

    if (hasDashboardData) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    getDashboard(
      selectedProjectId
        ? {
            project_id: selectedProjectId,
          }
        : {},
      {
        signal: controller.signal,
        user,
      },
    )
      .then((response) => {
        if (requestId !== requestIdRef.current) {
          return
        }

        hasDashboardDataRef.current = true
        setDashboardData(response)
      })
      .catch((fetchError) => {
        const normalized = normalizeDashboardError(fetchError)

        if (normalized.canceled || requestId !== requestIdRef.current) {
          return
        }

        if (normalized.shouldRedirectToLogin) {
          navigateTo('/login', {
            replace: true,
            state: {
              authNotice: {
                message: normalized.message,
                type: 'warning',
              },
            },
          })
          return
        }

        if (selectedProjectId && [400, 403, 404].includes(normalized.status)) {
          setSelectedProjectId('')
        }

        if (!hasDashboardData) {
          hasDashboardDataRef.current = false
          setDashboardData(null)
        }

        setError(normalized.message)
      })
      .finally(() => {
        if (!controller.signal.aborted && requestId === requestIdRef.current) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      })

    return () => controller.abort()
  }, [reloadToken, selectedProjectId, user])

  return {
    dashboardData: dashboardData || emptyDashboard,
    error,
    hasLoadedDashboard: Boolean(dashboardData),
    isLoading,
    isRefreshing,
    retry() {
      setDashboardData(null)
      hasDashboardDataRef.current = false
      setError('')
      setIsLoading(true)
      setIsRefreshing(false)
      setReloadToken((value) => value + 1)
    },
    selectedProjectId,
    setSelectedProjectId,
  }
}
