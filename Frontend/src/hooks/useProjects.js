import { useEffect, useMemo, useRef, useState } from 'react'
import { getProjects, normalizeProjectError } from '../services/projectService.js'

function redirectToLogin(message) {
  window.history.replaceState(
    {
      authNotice: {
        message,
        type: 'warning',
      },
    },
    '/login',
  )
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function useProjects({ role = '', search = '' } = {}) {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [serverMessage, setServerMessage] = useState('')
  const requestIdRef = useRef(0)

  const normalizedRole = role.trim().toUpperCase()
  const normalizedSearch = search.trim().toLowerCase()

  useEffect(() => {
    const controller = new AbortController()
    requestIdRef.current += 1
    const requestId = requestIdRef.current

    setIsLoading(true)
    setErrorMessage('')

    getProjects({}, undefined, { signal: controller.signal })
      .then((response) => {
        if (requestId !== requestIdRef.current) {
          return
        }

        setProjects(response.results)
        setServerMessage(response.message || '')
      })
      .catch((error) => {
        const normalized = normalizeProjectError(error)

        if (normalized.canceled || requestId !== requestIdRef.current) {
          return
        }

        if (normalized.shouldRedirectToLogin) {
          redirectToLogin(normalized.message)
          return
        }

        setProjects([])
        setErrorMessage(normalized.message || 'Unable to load projects.')
      })
      .finally(() => {
        if (!controller.signal.aborted && requestId === requestIdRef.current) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const roleMatches = !normalizedRole || project.current_user_role === normalizedRole
      const searchMatches =
        !normalizedSearch ||
        [project.name, project.description, project.current_user_role]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch))

      return roleMatches && searchMatches
    })
  }, [normalizedRole, normalizedSearch, projects])

  return {
    errorMessage,
    isLoading,
    projects: filteredProjects,
    serverMessage,
  }
}
