import { useEffect, useRef, useState } from 'react'
import { getProjects } from '../services/projectService.js'
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

function compareValues(firstValue, secondValue) {
  if (!firstValue && !secondValue) {
    return 0
  }

  if (!firstValue) {
    return 1
  }

  if (!secondValue) {
    return -1
  }

  return String(firstValue).localeCompare(String(secondValue))
}

function sortTasks(tasks, ordering = '-created_at') {
  const descending = ordering.startsWith('-')
  const fieldName = descending ? ordering.slice(1) : ordering

  return [...tasks].sort((firstTask, secondTask) => {
    const comparison = compareValues(firstTask?.[fieldName], secondTask?.[fieldName])
    return descending ? comparison * -1 : comparison
  })
}

async function getAllAccessibleProjects(signal) {
  const pageSize = 50
  let page = 1
  let projects = []
  let totalCount = 0

  do {
    const response = await getProjects({ page, page_size: pageSize }, undefined, { signal })
    totalCount = response.count
    projects = [...projects, ...response.results]
    page += 1
  } while (projects.length < totalCount)

  return projects
}

async function getAllProjectTasks(projectId, params, signal) {
  const pageSize = 100
  let page = 1
  let tasks = []
  let totalCount = 0

  do {
    const response = await getProjectTasks(
      projectId,
      {
        ...params,
        page,
        page_size: pageSize,
      },
      { signal },
    )

    totalCount = response.count
    tasks = [...tasks, ...response.results]
    page += 1
  } while (tasks.length < totalCount)

  return tasks
}

export default function useTasks({ mode = 'all', projectId = '', filters = {}, page = 1, pageSize = 10 }) {
  const [tasks, setTasks] = useState([])
  const [count, setCount] = useState(0)
  const [next, setNext] = useState(null)
  const [previous, setPrevious] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [serverMessage, setServerMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const requestIdRef = useRef(0)

  useEffect(() => {
    function handleTaskUpdated(e) {
      const updatedTask = e?.detail?.task
      if (!updatedTask) return

      if (projectId || filters.project_id) {
        const scopedProjectId = projectId || filters.project_id
        if (String(updatedTask.project?.id || updatedTask.project_id) !== String(scopedProjectId)) {
          return
        }
      }

      setRefreshKey((v) => v + 1)
    }

    function handleTaskDeleted(e) {
      const deletedTaskId = e?.detail?.taskId
      if (!deletedTaskId) return

      // If scoped to a project, always refetch to keep list consistent; otherwise only refetch if the deleted task is in current page
      if (projectId || filters.project_id) {
        setRefreshKey((v) => v + 1)
        return
      }

      // if not scoped, check if deleted task is currently in our tasks list
      if (tasks.some((t) => String(t.id) === String(deletedTaskId))) {
        setRefreshKey((v) => v + 1)
      }
    }

    window.addEventListener('jira-lite:task-updated', handleTaskUpdated)
    window.addEventListener('jira-lite:task-deleted', handleTaskDeleted)
    return () => {
      window.removeEventListener('jira-lite:task-updated', handleTaskUpdated)
      window.removeEventListener('jira-lite:task-deleted', handleTaskDeleted)
    }
  }, [projectId, filters.project_id])

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
      search: filters.search?.trim(),
      ordering: filters.ordering,
      page,
      page_size: pageSize,
    }

    const request =
      mode === 'mine'
        ? getMyTasks(params, { signal: controller.signal })
        : mode === 'project' || filters.project_id
          ? getProjectTasks(projectId || filters.project_id, params, { signal: controller.signal })
          : getAllAccessibleProjects(controller.signal).then(async (projects) => {
              const projectTasks = await Promise.all(
                projects.map((project) => getAllProjectTasks(project.id, params, controller.signal)),
              )
              const allTasks = sortTasks(projectTasks.flat(), filters.ordering || '-created_at')
              const startIndex = (page - 1) * pageSize
              const results = allTasks.slice(startIndex, startIndex + pageSize)

              return {
                count: allTasks.length,
                message: '',
                next: startIndex + pageSize < allTasks.length ? 'next' : null,
                previous: page > 1 ? 'previous' : null,
                results,
              }
            }).catch((error) => {
              if (error?.response?.status === 403 || error?.response?.status === 404) {
                return getTasks(params, { signal: controller.signal })
              }

              throw error
            })

    request
      .then((response) => {
        if (requestId !== requestIdRef.current) {
          return
        }

        setTasks(response.results)
        setCount(response.count)
        setNext(response.next)
        setPrevious(response.previous)
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
        setNext(null)
        setPrevious(null)
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
  }, [filters.ordering, filters.priority, filters.project_id, filters.search, filters.status, mode, page, pageSize, projectId, refreshKey])

  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  return {
    count,
    errorMessage,
    isLoading,
    next,
    previous,
    refetch: () => setRefreshKey((value) => value + 1),
    serverMessage,
    tasks,
    totalPages,
  }
}
