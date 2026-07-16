import { useEffect, useRef, useState } from 'react'
import { getMyTasks, getProjectTasks, getTasks, normalizeTaskError } from '../services/taskService.js'

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

export default function useTasks({ mode = 'all', projectId = '', filters = {}, page = 1, pageSize = 10 }) {
  const [tasks, setTasks] = useState([])
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [serverMessage, setServerMessage] = useState('')
  const requestIdRef = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    requestIdRef.current += 1
    const requestId = requestIdRef.current
    setIsLoading(true)
    setErrorMessage('')

    const params = {
      project_id: filters.project_id,
      status: filters.status,
      priority: filters.priority,
      search: filters.search,
      ordering: filters.ordering,
      ...(page > 1 ? { page } : {}),
    }

    const request =
      mode === 'mine'
        ? getMyTasks(params, { signal: controller.signal })
        : mode === 'project'
          ? getProjectTasks(projectId, params, { signal: controller.signal })
          : getTasks(params, { signal: controller.signal })

    request
      .then((response) => {
        if (requestId !== requestIdRef.current) {
          return
        }

        setTasks(response.results)
        setCount(response.count)
        setServerMessage(response.message || '')
      })
      .catch((error) => {
        const normalized = normalizeTaskError(error)

        if (normalized.canceled || requestId !== requestIdRef.current) {
          return
        }

        if (normalized.shouldRedirectToLogin) {
          redirectToLogin(normalized.message)
          return
        }

        setTasks([])
        setCount(0)
        setErrorMessage(
          normalized.message || (error?.request ? 'Unable to load tasks. Check your connection and try again.' : 'Unable to load tasks.'),
        )
      })
      .finally(() => {
        if (!controller.signal.aborted && requestId === requestIdRef.current) {
          setIsLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [filters.ordering, filters.priority, filters.project_id, filters.search, filters.status, mode, page, pageSize, projectId])

  return {
    count,
    errorMessage,
    isLoading,
    serverMessage,
    tasks,
  }
}
